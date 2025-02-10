import { GeistSans } from "geist/font/sans";
import Head from "next/head";
import { ThemeProvider } from "../context/ThemeContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/page.module.css";
import "../styles/globals.css";
import {
  IoPersonCircleOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoScanSharp,
  IoScanCircleOutline,
  IoCompassOutline,
} from "react-icons/io5";
import { useTheme } from "../context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { supabase } from "../utils/supabaseClient";
import { Analytics } from "@vercel/analytics/react";

function Header() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.headerLeft}>
        <span className={styles.headerTitle}>
            <IoScanSharp />
            ScanSave
        </span>
      </Link>
      <div className={styles.headerControls}>
        <Link 
          href="/scan" 
          aria-label="Scan" 
          className={`${styles.headerIcon} ${router.pathname === '/scan' ? styles.activeHeader : ''}`}
        >
          <IoScanCircleOutline size={28} />
        </Link>
        <Link
          href="/tracker"
          aria-label="Tracker"
          className={`${styles.headerIcon} ${router.pathname === '/tracker' ? styles.activeHeader : ''}`}
        >
          <IoCompassOutline size={28} />
        </Link>
        <Link
          href="/profile"
          aria-label="Profile"
          className={`${styles.headerIcon} ${router.pathname === '/profile' ? styles.activeHeader : ''}`}
        >
          <IoPersonCircleOutline size={28} />
        </Link>
        <button
          onClick={toggleTheme}
          className={`${styles.themeToggle} ${styles.headerIcon}`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <IoSunnyOutline size={24} />
          ) : (
            <IoMoonOutline size={24} />
          )}
        </button>
      </div>
    </header>
  );
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const showHeader =
    session && router.pathname !== "/login" && router.pathname !== "/";

  return (
    <ThemeProvider>
      <Head>
        <title>ScanSave</title>
        <meta
          name="description"
          content="Track your spending by scanning food products. Understand their impact on your health and the environment."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://scansave.in/" />
        <meta property="og:title" content="ScanSave.in" />
        <meta
          property="og:description"
          content="Track your spending by scanning food products. Understand their impact on your health and the environment."
        />
        <meta property="og:image" content="/banner.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://scansave.in/" />
        <meta property="twitter:title" content="ScanSave.in" />
        <meta
          property="twitter:description"
          content="Track your spending by scanning food products. Understand their impact on your health and the environment."
        />
        <meta property="twitter:image" content="/banner.png" />

        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="ScanSave" />
      </Head>
      <div className={GeistSans.className}>
        {showHeader && <Header />}
        <Component {...pageProps} />
        <Toaster
          position="top-left"
          toastOptions={{
            className: "",
            duration: 5000,
            removeDelay: 1000,
            style: {
              background: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              boxShadow: "0 0 0 1px hsl(var(--primary) / .5)",
            },
          }}
        />
      </div>
      <Analytics />
    </ThemeProvider>
  );
}
