import { Inter } from 'next/font/google';
import Head from 'next/head';
import BottomNav from '../components/BottomNav';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
});

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Food Scanner App</title>
        <meta name="description" content="Scan food products to understand their impact on your health and the environment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={inter.className}>
        <Component {...pageProps} />
        <BottomNav />
      </div>
    </>
  );
} 