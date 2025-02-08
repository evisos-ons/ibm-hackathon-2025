import { useRouter } from 'next/router';
import styles from '../styles/page.module.css';
import toast from 'react-hot-toast';
import { IoPersonCircle, IoLogOutOutline } from 'react-icons/io5';

export default function ProfilePage() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear authentication state
    localStorage.removeItem('isAuthenticated');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <IoPersonCircle size={80} className={styles.profileIcon} />
            <h1 className={styles.profileName}>John Doe</h1>
            <p className={styles.profileEmail}>john.doe@example.com</p>
          </div>

          <div className={styles.profileStats}>
            <div className={styles.statCard}>
              <h3>Products Scanned</h3>
              <p>24</p>
            </div>
            <div className={styles.statCard}>
              <h3>Health Score</h3>
              <p>B+</p>
            </div>
            <div className={styles.statCard}>
              <h3>Environmental Impact</h3>
              <p>A-</p>
            </div>
          </div>

          <div className={styles.recentlyScanned}>
            <h3>Recent Items Scanned:</h3>
            <br></br>
            <p>Pepsi Max 330ml</p>
          </div>

          <div className={styles.profileActions}>
            <button 
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              <IoLogOutOutline size={20} />
              Sign Out
            </button>
          </div>

          
        </div>
      </main>
    </div>
  );
} 