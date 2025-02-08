import { useTheme } from '../context/ThemeContext';
import styles from '../styles/page.module.css';

export default function ProfilePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Profile</h1>
          <button 
            onClick={toggleTheme}
            className={styles.themeToggle}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <div className={styles.profileSection}>
          <p>Coming soon...</p>
        </div>
      </main>
    </div>
  );
} 