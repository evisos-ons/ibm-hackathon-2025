import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <main className={`${GeistSans.className}`}>
      <Component {...pageProps} />
    </main>
  );
} 