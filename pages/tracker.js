import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  useEffect(() => {
    fetchExpenditureData();
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

  const processDailyData = (data) => {
    if (!data || data.length === 0) {
      console.log('No data received in processDailyData');
      return [];
    }

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => 
      new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime()
    );

    // Group by minute and calculate totals
    const minuteGroups = sortedData.reduce((acc, item) => {
      const date = new Date(item.scanned_at);
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', item.scanned_at);
        return acc;
      }

      // Create a key for this minute
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
      acc[minuteKey].products.push({
        name: item.product_name,
        price: item.price,
        timestamp: item.scanned_at
      });

      return acc;
    }, {});

    // Convert to array and sort by timestamp
    const result = Object.values(minuteGroups).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    console.log('Processed minute groups:', result);
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

  return (
    <div className={styles.expenditurePage}>
      <h1>Expenditure Tracker</h1>
      
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
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.customTooltip}>
        <h3>{formatTimestamp(label)}</h3>
        <p>Total: £{data.total.toFixed(2)}</p>
        {data.products.length > 0 && (
          <div className={styles.productList}>
            <h4>Products Scanned:</h4>
            {data.products.map((product, index) => (
              <div key={index} className={styles.productItem}>
                <p>{product.name}</p>
                <p>£{product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
}; 