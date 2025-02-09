import { useState, useEffect } from 'react';
import styles from '../styles/page.module.css';
import { IoSparklesOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { getAIInsights } from '../utils/aiInsights';

const INSIGHT_TYPES = [
  { value: 'health', label: 'Health Analysis' },
  { value: 'price', label: 'Price Analysis' },
  { value: 'alternatives', label: 'Alternative Products' },
  { value: 'usage', label: 'Usage Tips' },
  { value: 'environmental', label: 'Environmental Impact' },
  { value: 'recycling', label: 'Recycling Tips' }
];

export default function AIInsights({ userId }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('health');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 5;

  const fetchInsights = async (reset = false) => {
    try {
      setLoading(true);
      const newPage = reset ? 0 : page;
      const { data, error } = await getAIInsights(
        userId,
        selectedType,
        LIMIT,
        newPage * LIMIT
      );

      if (error) throw error;

      if (data) {
        setInsights(reset ? data : [...insights, ...data]);
        setHasMore(data.length === LIMIT);
        if (!reset) setPage(page + 1);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchInsights(true);
    }
  }, [userId, selectedType]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setPage(0);
    setInsights([]);
  };

  return (
    <div className={styles.insightsContainer}>
      <div className={styles.insightsHeader}>
        <h2>AI Insights</h2>
        <div className={styles.insightTabs}>
          {INSIGHT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeChange(type.value)}
              className={`${styles.insightTab} ${
                selectedType === type.value ? styles.activeTab : ''
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.insightsList}>
        {insights.map((insight) => (
          <div key={insight.id} className={styles.insightCard}>
            <div className={styles.insightProduct}>
              {insight.product_image && (
                <img
                  src={insight.product_image}
                  alt={insight.product_name}
                  className={styles.insightImage}
                />
              )}
              <div className={styles.insightProductInfo}>
                <h3>{insight.product_name}</h3>
                <span className={styles.insightDate}>
                  {new Date(insight.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className={styles.insightText}>{insight.insight_text}</p>
            <div className={styles.insightMeta}>
              <IoSparklesOutline />
              <span>{INSIGHT_TYPES.find(t => t.value === insight.insight_type)?.label}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className={styles.insightLoading}>
            <IoSparklesOutline className={styles.loadingIcon} />
            Loading insights...
          </div>
        )}

        {!loading && hasMore && (
          <button
            onClick={() => fetchInsights()}
            className={styles.loadMoreButton}
          >
            Load More
            <IoChevronForwardOutline />
          </button>
        )}

        {!loading && insights.length === 0 && (
          <div className={styles.noInsights}>
            <p>No {INSIGHT_TYPES.find(t => t.value === selectedType)?.label} insights yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 