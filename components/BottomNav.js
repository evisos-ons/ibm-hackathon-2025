import { useRouter } from 'next/router';
import Link from 'next/link';
import { AiOutlineHome, AiOutlineScan, AiOutlineUser } from 'react-icons/ai';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const router = useRouter();

  return (
    <nav className={styles.bottomNav}>
      <Link 
        href="/" 
        className={`${styles.navItem} ${router.pathname === '/' ? styles.active : ''}`}
      >
        <AiOutlineHome size={24} />
        <span>Home</span>
      </Link>
      
      <Link 
        href="/scan" 
        className={`${styles.navItem} ${router.pathname === '/scan' ? styles.active : ''}`}
      >
        <AiOutlineScan size={24} />
        <span>Scan</span>
      </Link>
      
      <Link 
        href="/profile" 
        className={`${styles.navItem} ${router.pathname === '/profile' ? styles.active : ''}`}
      >
        <AiOutlineUser size={24} />
        <span>Profile</span>
      </Link>
    </nav>
  );
} 