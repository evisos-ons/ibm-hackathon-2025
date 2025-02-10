import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import styles from '../styles/page.module.css';
import { supabase } from '../utils/supabaseClient';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ExpenditureTracker() {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSpent: 0,
    averageDaily: 0,
    highestDay: { date: '', amount: 0 },
    lowestDay: { date: '', amount: 0 }
  });
  const [budget, setBudget] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [isSettingSavingsGoal, setIsSettingSavingsGoal] = useState(false);
  const [trendsData, setTrendsData] = useState({
    weeklyComparison: [],
    monthlyComparison: [],
    categoryBreakdown: [],
    trendAnalysis: []
  });
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState('weekly');

  useEffect(() => {
    fetchExpenditureData();
    fetchFinancialGoals();
  }, []);

  const fetchExpenditureData = async () => {
    try {
      const { data: productHistory, error: fetchError } = await supabase
        .from('product_history')
        .select('*');

      if (fetchError) throw fetchError;

      console.log('Fetched data:', productHistory);
      const daily = processDailyData(productHistory);
      console.log('Processed data:', daily);
      if (daily && daily.length > 0) {
        setDailyData(daily);
        calculateStats(daily);
      } else {
        console.error('No data after processing:', daily);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchFinancialGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: goals, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (goals) {
        setBudget(Number(goals.budget) || 0);
        setSavingsGoal(Number(goals.savings_goal) || 0);
      }
    } catch (error) {
      console.error('Error fetching financial goals:', error);
      setError('Failed to load financial goals. Please try again.');
    }
  };

  const processDailyData = (data) => {
    if (!data || data.length === 0) {
      console.log('No data received in processDailyData');
      return [];
    }

    const sortedData = [...data].sort((a, b) => 
      new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime()
    );

    const minuteGroups = sortedData.reduce((acc, item) => {
      const date = new Date(item.scanned_at);
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', item.scanned_at);
        return acc;
      }

      date.setSeconds(0, 0);
      const minuteKey = date.toISOString();

      if (!acc[minuteKey]) {
        acc[minuteKey] = {
          timestamp: minuteKey,
          total: 0,
          products: []
        };
      }

      acc[minuteKey].total += item.price || 0;
      if (item.product_name && item.price) {
        acc[minuteKey].products.push({
          name: item.product_name,
          price: item.price,
          timestamp: item.scanned_at,
          category: item.category || 'Uncategorized'
        });
      }

      return acc;
    }, {});

    const result = Object.values(minuteGroups).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    console.log('Processed minute groups:', result);
    analyzeSpendingTrends(result);
    return result;
  };

  const calculateStats = (daily) => {
    if (!daily || daily.length === 0) {
      console.log('No data received in calculateStats');
      return;
    }

    console.log('Calculating stats for data:', daily);
    const total = daily.reduce((sum, day) => sum + (day.total || 0), 0);
    const averageDaily = total / daily.length;
    const highestDay = daily.reduce((max, day) => (day.total || 0) > (max.total || 0) ? day : max, daily[0]);
    const lowestDay = daily.reduce((min, day) => (day.total || 0) < (min.total || 0) ? day : min, daily[0]);

    setStats({
      totalSpent: total.toFixed(2),
      averageDaily: averageDaily.toFixed(2),
      highestDay: {
        date: formatTimestamp(highestDay.timestamp),
        amount: (highestDay.total || 0).toFixed(2)
      },
      lowestDay: {
        date: formatTimestamp(lowestDay.timestamp),
        amount: (lowestDay.total || 0).toFixed(2)
      }
    });
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    setIsSettingBudget(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const newBudget = parseFloat(formData.get('budget'));

      if (isNaN(newBudget) || newBudget < 0) {
        throw new Error('Please enter a valid positive number for budget');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to set a budget');

      const { error } = await supabase
        .from('user_goals')
        .upsert({
          user_id: user.id,
          budget: newBudget,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setBudget(newBudget);
      setShowBudgetForm(false);
    } catch (error) {
      console.error('Error setting budget:', error);
      setError(error.message);
    } finally {
      setIsSettingBudget(false);
    }
  };

  const handleSetSavingsGoal = async (e) => {
    e.preventDefault();
    setIsSettingSavingsGoal(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const newGoal = parseFloat(formData.get('savingsGoal'));

      if (isNaN(newGoal) || newGoal < 0) {
        throw new Error('Please enter a valid positive number for savings goal');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to set a savings goal');

      const { error } = await supabase
        .from('user_goals')
        .upsert({
          user_id: user.id,
          savings_goal: newGoal,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSavingsGoal(newGoal);
      setShowSavingsForm(false);
    } catch (error) {
      console.error('Error setting savings goal:', error);
      setError(error.message);
    } finally {
      setIsSettingSavingsGoal(false);
    }
  };

  const calculateBudgetProgress = () => {
    if (budget === 0) return 0;
    return ((stats.totalSpent / budget) * 100).toFixed(2);
  };

  const calculateSavingsProgress = () => {
    if (savingsGoal === 0) return 0;
    return ((stats.totalSpent / savingsGoal) * 100).toFixed(2);
  };

  const getBudgetStatus = () => {
    if (budget === 0) return 'neutral';
    const progress = calculateBudgetProgress();
    return progress >= 100 ? 'exceeded' : progress >= 80 ? 'warning' : 'good';
  };

  const getSavingsStatus = () => {
    if (savingsGoal === 0) return 'neutral';
    const progress = calculateSavingsProgress();
    return progress >= 100 ? 'exceeded' : progress >= 80 ? 'warning' : 'good';
  };

  const BudgetForm = () => (
    <form onSubmit={handleSetBudget} className={styles.budgetForm}>
      <input
        type="number"
        name="budget"
        step="0.01"
        min="0"
        placeholder="Enter your budget"
        required
        disabled={isSettingBudget}
      />
      <button type="submit" disabled={isSettingBudget}>
        {isSettingBudget ? 'Saving...' : 'Set Budget'}
      </button>
      <button 
        type="button" 
        onClick={() => setShowBudgetForm(false)}
        disabled={isSettingBudget}
        className={styles.cancelBudgetButton}
      >
        Cancel
      </button>
    </form>
  );

  const SavingsGoalForm = () => (
    <form onSubmit={handleSetSavingsGoal} className={styles.savingsForm}>
      <input
        type="number"
        name="savingsGoal"
        step="0.01"
        min="0"
        placeholder="Enter savings goal"
        required
        disabled={isSettingSavingsGoal}
      />
      <button type="submit" disabled={isSettingSavingsGoal}>
        {isSettingSavingsGoal ? 'Saving...' : 'Set Goal'}
      </button>
      <button 
        type="button" 
        onClick={() => setShowSavingsForm(false)}
        disabled={isSettingSavingsGoal}
        className={styles.cancelBudgetButton}
      >
        Cancel
      </button>
    </form>
  );

  const analyzeSpendingTrends = (data) => {
    if (!data || data.length === 0) return;

    // Weekly comparison
    const weeklyComparison = data.reduce((acc, item) => {
      const date = new Date(item.timestamp);
      const weekNumber = getWeekNumber(date);
      const year = date.getFullYear();
      const key = `${year}-${weekNumber}`;

      if (!acc[key]) {
        acc[key] = {
          week: weekNumber,
          year: year,
          total: 0
        };
      }

      acc[key].total += item.total || 0;
      return acc;
    }, {});

    // Monthly comparison
    const monthlyComparison = data.reduce((acc, item) => {
      const date = new Date(item.timestamp);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!acc[key]) {
        acc[key] = {
          month: month,
          year: year,
          total: 0
        };
      }

      acc[key].total += item.total || 0;
      return acc;
    }, {});

    // Category breakdown
    const categoryBreakdown = data.reduce((acc, item) => {
      const products = item.products || [];
      products.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = {
            category: category,
            total: 0
          };
        }
        acc[category].total += product.price || 0;
      });
      return acc;
    }, {});

    // Trend analysis
    const trendAnalysis = data.map(item => ({
      date: item.timestamp,
      total: item.total || 0
    }));

    setTrendsData({
      weeklyComparison: Object.values(weeklyComparison),
      monthlyComparison: Object.values(monthlyComparison),
      categoryBreakdown: Object.values(categoryBreakdown),
      trendAnalysis: trendAnalysis
    });
  };

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  const TrendsAnalysis = () => (
    <div className={styles.trendsSection}>
      <h2>Spending Trends Analysis</h2>
      
      <div className={styles.trendsTabs}>
        <button
          className={`${styles.trendTab} ${selectedTrendPeriod === 'weekly' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTrendPeriod('weekly')}
        >
          Weekly Comparison
        </button>
        <button
          className={`${styles.trendTab} ${selectedTrendPeriod === 'monthly' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTrendPeriod('monthly')}
        >
          Monthly Comparison
        </button>
      </div>

      {selectedTrendPeriod === 'weekly' && (
        <div className={styles.trendsChart}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={trendsData.weeklyComparison}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis tickFormatter={(value) => `£${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--primary))" 
                name="Weekly Spending"
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedTrendPeriod === 'monthly' && (
        <div className={styles.trendsChart}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={trendsData.monthlyComparison}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `£${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" fill="hsl(var(--primary))" name="Monthly Spending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={styles.categoryBreakdown}>
        <h3>Category Breakdown</h3>
        <div className={styles.categoryGrid}>
          {trendsData.categoryBreakdown.map((category, index) => (
            <div key={index} className={styles.categoryCard}>
              <h4>{category.category}</h4>
              <p>£{category.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.expenditurePage}>
      <h1>Expenditure Tracker</h1>
      
      <div className={styles.financialGoals}>
        <div className={`${styles.budgetSection} ${styles[getBudgetStatus()]}`}>
          <h2>Budget</h2>
          {budget > 0 ? (
            <>
              <p>Your Budget: £{budget.toFixed(2)}</p>
              <p>Spent: £{stats.totalSpent}</p>
              <div className={styles.progressBar}>
                <div 
                  style={{ width: `${calculateBudgetProgress()}%` }}
                  className={styles.progressFill}
                ></div>
              </div>
              <p>{calculateBudgetProgress()}% of budget used</p>
              {getBudgetStatus() === 'exceeded' && (
                <p className={styles.warningMessage}>You've exceeded your budget!</p>
              )}
              {getBudgetStatus() === 'warning' && (
                <p className={styles.warningMessage}>You're close to exceeding your budget</p>
              )}
              <button 
                className={styles.updateButton}
                onClick={() => setShowBudgetForm(true)}
                disabled={isSettingBudget}
              >
                Update Budget
              </button>
            </>
          ) : (
            <button 
              className={styles.setButton}
              onClick={() => setShowBudgetForm(true)}
              disabled={isSettingBudget}
            >
              Set Budget
            </button>
          )}
          {showBudgetForm && <BudgetForm />}
        </div>

        <div className={`${styles.savingsSection} ${styles[getSavingsStatus()]}`}>
          <h2>Savings Goal</h2>
          {savingsGoal > 0 ? (
            <>
              <p>Your Goal: £{savingsGoal.toFixed(2)}</p>
              <p>Spent: £{stats.totalSpent}</p>
              <div className={styles.progressBar}>
                <div 
                  style={{ width: `${calculateSavingsProgress()}%` }}
                  className={styles.progressFill}
                ></div>
              </div>
              <p>{calculateSavingsProgress()}% of goal used</p>
              <button 
                className={styles.updateButton}
                onClick={() => setShowSavingsForm(true)}
                disabled={isSettingSavingsGoal}
              >
                Update Goal
              </button>
            </>
          ) : (
            <button 
              className={styles.setButton}
              onClick={() => setShowSavingsForm(true)}
              disabled={isSettingSavingsGoal}
            >
              Set Savings Goal
            </button>
          )}
          {showSavingsForm && <SavingsGoalForm />}
        </div>
      </div>

      {!loading && dailyData.length > 0 && <TrendsAnalysis />}

      {error ? (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchExpenditureData();
            }}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div className={styles.loadingMessage}>
          <p>Loading data...</p>
        </div>
      ) : dailyData && dailyData.length > 0 ? (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Spent</h3>
              <p>£{stats.totalSpent}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Average Daily</h3>
              <p>£{stats.averageDaily}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Highest Day</h3>
              <p>{stats.highestDay.date}</p><p>£{stats.highestDay.amount}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Lowest Day</h3>
              <p>{stats.lowestDay.date}</p><p>£{stats.lowestDay.amount}</p>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <h2>Daily Expenditure Breakdown</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={dailyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis 
                  tickFormatter={(value) => `£${value}`}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name="Expenditure"
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className={styles.noDataMessage}>
          <p>No expenditure data available. Start scanning products to track your expenses!</p>
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  console.log('CustomTooltip props:', { active, payload, label });

  if (!active || !payload || payload.length === 0) {
    console.log('CustomTooltip: No active payload');
    return null;
  }

  const data = payload[0]?.payload || {};
  const products = data.products || [];
  console.log('CustomTooltip data:', data);

  return (
    <div className={styles.customTooltip}>
      <h3>{formatTimestamp(label)}</h3>
      <p>Total: £{(data.total || 0).toFixed(2)}</p>
      {products.length > 0 && (
        <div className={styles.productList}>
          <h4>Products Scanned:</h4>
          {products.map((product, index) => (
            <div key={index} className={styles.productItem}>
              <p>{product.name || 'Unknown Product'}</p>
              <p>£{(product.price || 0).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 