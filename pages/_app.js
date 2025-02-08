import { Inter } from 'next/font/google';
import Head from 'next/head';
import { ThemeProvider } from '../context/ThemeContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/page.module.css';
import '../styles/globals.css';
import { IoPersonCircleOutline } from 'react-icons/io5';

const inter = Inter({
  subsets: ['latin'],
});

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Basic auth check - replace with your actual auth logic
  useEffect(() => {
    // const isAuthenticated = localStorage.getItem('isAuthenticated');
    // if (!isAuthenticated && router.pathname !== '/login') {
    //   router.push('/login');
    // }
  }, [router.pathname]);

  return (
    <ThemeProvider>
      <Head>
        <title>Food Scanner App</title>
        <meta name="description" content="Scan food products to understand their impact on your health and the environment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={inter.className}>
        {router.pathname !== '/login' && (
          <header className={styles.header}>
            <Link href="/"> Home </Link>
            <Link href="/profile">
              <IoPersonCircleOutline size={28} />
            </Link>
          </header>
        )}
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  );
} 