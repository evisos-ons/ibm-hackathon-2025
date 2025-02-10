import { useState, useEffect } from 'react';
import styles from '../styles/page.module.css';
import { IoRefreshOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabaseClient'; 

export default function UserInsights({ userId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canRefresh, setCanRefresh] = useState(false);
  const [nextAvailable, setNextAvailable] = useState(null);

  const fetchLatestInsights = async () => {
    try {
      const { data: latestInsight, error } = await supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching insights:', error);
        toast.error('Failed to fetch insights');
        throw error;
      }
      if (latestInsight && latestInsight.length > 0) {
        setInsights(latestInsight[0]);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const checkRefreshAvailability = async () => {
    try {
      const response = await fetch('/api/user/checkOverview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      
      setCanRefresh(data.canRequest);
      setNextAvailable(data.nextAvailableTime);
    } catch (error) {
      console.error('Error checking refresh availability:', error);
    }
  };

  const generateNewInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      const data = await response.json();
      console.log(data);
      if (data.status === 'success') {
        await fetchLatestInsights();
        toast.success('Generated new insights!');
      } else {
        toast.error('Unable to generate insights at this time.');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate new insights');
    } finally {
      setLoading(false);
      checkRefreshAvailability();
    }
  };

  useEffect(() => {
    fetchLatestInsights();
    checkRefreshAvailability();
  }, []);

  const getTimeRemaining = () => {
    if (!nextAvailable) return '';
    const now = new Date();
    const next = new Date(nextAvailable);
    const diff = next - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading && !insights) {
    return <div className={styles.insightsLoading}>Loading insights...</div>;
  }

  return (
    <div className={styles.insightsContainer}>
      <div className={styles.insightsHeader}>
        <div className={styles.insightsHeaderText}>
        <h3>AI Shopping Insights</h3>
        <span> Ask AI to rate your spending and shopping habits every 12 hours.</span>
        </div>
        
        <button
          onClick={generateNewInsights}
          disabled={!canRefresh || loading}
          className={styles.refreshButton}
          title={!canRefresh ? `Next refresh available in ${getTimeRemaining()}` : 'Generate new insights'}
        >
          <IoRefreshOutline size={16} className={loading ? styles.spinning : ''} />
          {!canRefresh ? `Try again in ${getTimeRemaining()}` : 'Refresh Insights'}
        </button>
      </div>

      {insights ? (
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <h4>Environmental Impact</h4>
            <p>{insights.environmental_insight}</p>
          </div>
          <div className={styles.insightCard}>
            <h4>Nutritional Habits</h4>
            <p>{insights.nutritional_insight}</p>
          </div>
          <div className={styles.insightCard}>
            <h4>Spending Patterns</h4>
            <p>{insights.spending_insight}</p>
          </div>
        </div>
      ) : (
        <div className={styles.noInsights}>
          <p>No insights available yet. Generate your first insights!</p>
        </div>
      )}
    </div>
  );
} 