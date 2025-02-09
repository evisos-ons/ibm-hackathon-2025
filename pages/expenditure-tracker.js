import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from '../styles/page.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

      const daily = processDailyData(productHistory);
      setDailyData(daily);
      calculateStats(daily);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const processDailyData = (data) => {
    const hourlyTotals = {};

    data.forEach(item => {
      const date = new Date(item.scanned_at);
      if (isNaN(date.getTime())) return;
      

      const hour = new Date(date);
      hour.setMinutes(0, 0, 0);
      const hourString = hour.toISOString();
      
      if (!hourlyTotals[hourString]) {
        hourlyTotals[hourString] = {
          total: 0,
          products: []
        };
      }
      
      hourlyTotals[hourString].total += item.price || 0;
      hourlyTotals[hourString].products.push({
        name: item.product_name,
        price: item.price,
        timestamp: date.toISOString()
      });
    });


    const allHours = [];
    if (Object.keys(hourlyTotals).length > 0) {
      const firstHour = new Date(Object.keys(hourlyTotals)[0]);
      const lastHour = new Date(Object.keys(hourlyTotals)[Object.keys(hourlyTotals).length - 1]);
      
      for (let d = new Date(firstHour); d <= lastHour; d.setHours(d.getHours() + 1)) {
        const hourString = d.toISOString();
        allHours.push({
          timestamp: hourString,
          total: hourlyTotals[hourString]?.total || 0,
          products: hourlyTotals[hourString]?.products || []
        });
      }
    }

    return allHours;
  };

  const calculateStats = (daily) => {
    if (daily.length === 0) return;

    const total = daily.reduce((sum, day) => sum + day.total, 0);
    const averageDaily = total / daily.length;
    const highestDay = daily.reduce((max, day) => day.total > max.total ? day : max, daily[0]);
    const lowestDay = daily.reduce((min, day) => day.total < min.total ? day : min, daily[0]);

    setStats({
      totalSpent: total.toFixed(2),
      averageDaily: averageDaily.toFixed(2),
      highestDay: {
        date: formatTimestamp(highestDay.timestamp),
        amount: highestDay.total.toFixed(2)
      },
      lowestDay: {
        date: formatTimestamp(lowestDay.timestamp),
        amount: lowestDay.total.toFixed(2)
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
      ) : dailyData.length > 0 ? (
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
              <p>{stats.highestDay.date}: £{stats.highestDay.amount}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Lowest Day</h3>
              <p>{stats.lowestDay.date}: £{stats.lowestDay.amount}</p>
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
                  interval={Math.floor(dailyData.length / 24)}
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
                  stroke="#4CAF50" 
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