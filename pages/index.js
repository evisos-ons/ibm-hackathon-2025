import styles from '../styles/page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Home</h1>
        <div className={styles.profileSection}>
          <p>Coming soon...</p>
          <p className={styles.subtitle}>Use the scan button below to start scanning products!</p>
        </div>
      </main>
    </div>
  );
} 