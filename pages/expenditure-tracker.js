import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Chart from 'chart.js/auto';
import styles from '../styles/page.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ExpenditureTracker() {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchExpenditureData();
    }
  }, [isMounted]);

  const fetchExpenditureData = async () => {
    try {
      // First, check if there's any data in the table
      const { count, error: countError } = await supabase
        .from('product_history')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      if (count === 0) {
        setLoading(false);
        setData([]);
        return;
      }

      // If there is data, fetch it with the timestamp column
      const { data: productHistory, error: fetchError } = await supabase
        .from('product_history')
        .select('*');

      if (fetchError) throw fetchError;

      // Process data for monthly breakdown
      const monthlyData = processMonthlyData(productHistory);
      setData(monthlyData);
      renderChart(monthlyData);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const processMonthlyData = (data) => {
    const monthlyTotals = {};

    data.forEach(item => {
      // Use the known timestamp field name
      const dateField = 'scanned_at';
      
      if (!item[dateField]) {
        console.warn('No date field found in item:', item);
        return;
      }

      const date = new Date(item[dateField]);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', item[dateField]);
        return;
      }
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTotals[monthYear]) {
        monthlyTotals[monthYear] = 0;
      }
      
      monthlyTotals[monthYear] += item.price || 0; // Changed from cost to price
    });

    return Object.entries(monthlyTotals).map(([month, total]) => ({
      month,
      total: parseFloat(total.toFixed(2))
    }));
  };

  const renderChart = (data) => {
    try {
      // Ensure the canvas element exists and is mounted
      if (!chartRef.current || !isMounted) {
        console.error('Canvas element not ready');
        setError('Chart element not ready. Please try again.');
        return;
      }

      // Check if we have valid data
      if (!data || data.length === 0) {
        console.warn('No data to render chart');
        setError('No data available to display');
        return;
      }

      const ctx = chartRef.current.getContext('2d');
      
      // Destroy existing chart instance if it exists
      if (chartInstance) {
        chartInstance.destroy();
      }

      // Prepare chart data
      const labels = data.map(item => {
        const [year, month] = item.month.split('-');
        return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      });

      const totals = data.map(item => item.total);

      // Create new chart instance
      const newChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Monthly Expenditure',
            data: totals,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Amount (£)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Month'
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `£${context.raw.toFixed(2)}`;
                }
              }
            }
          }
        }
      });

      setChartInstance(newChartInstance);
    } catch (error) {
      console.error('Chart rendering error:', error);
      setError('Failed to render chart. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Monthly Expenditure Breakdown</h1>
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
      ) : data.length > 0 ? (
        <div className={styles.chartContainer}>
          <canvas 
            ref={chartRef} 
            className={styles.chartCanvas}
            style={{ display: 'block' }}
          ></canvas>
        </div>
      ) : (
        <div className={styles.noDataMessage}>
          <p>No expenditure data available. Start scanning products to track your expenses!</p>
        </div>
      )}
    </div>
  );
} 