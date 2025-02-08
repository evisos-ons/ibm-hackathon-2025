import { useTheme } from '../context/ThemeContext';
import styles from '../styles/page.module.css';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';

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
            {theme === 'dark' ? <IoSunnyOutline /> : <IoMoonOutline />}
          </button>
        </div>
        <div className={styles.profileSection}>
          <p>Coming soon...</p>
        </div>
        <div>
            <p> <br></br> </p>
        </div>
        <div className={styles.profileSectionRecents}>
            <p>Recently Purchased Items:</p>
        </div>
      </main>
    </div>
  );
} 