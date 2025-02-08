import React from 'react';
import styles from './Gauge.module.css';

const Gauge = ({ value, label }) => {
  // Calculate the stroke dash offset based on the value
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (value / 100) * circumference;

  return (
    <>
    <div className={styles.gauge}>
      <svg className={styles.progress} width="120" height="120" viewBox="0 0 120 120">
        <circle
          className={styles.background}
          cx="60"
          cy="60"
          r="45"
          fill="none"
          strokeWidth="10"
        />
        <circle
          className={styles.value}
          cx="60"
          cy="60"
          r="45"
          fill="none"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className={styles.label}>
        <span className={styles.percentage}>{value}%</span>
       
      </div>
    </div>
          <span className={styles.text}>{label}</span>
</>
  );
};

export default Gauge; 