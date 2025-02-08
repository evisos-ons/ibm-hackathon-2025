'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/page.module.css';

export default function ScannerPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </nav>
      
      {/* Add your existing scanner page content here */}
      <main className={styles.main}>
        <h1>Welcome {user?.email}</h1>
        {/* Your scanner components */}
      </main>
    </div>
  );
} 