import { Inter } from "next/font/google";
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
} from "react-icons/io5";
import { useTheme } from "../context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { supabase } from "../utils/supabaseClient";

const inter = Inter({
  subsets: ["latin"],
});

// Separate Header component
function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <Link href="/">
        <span className={styles.headerTitle}>
          <IoScanSharp /> ScanSave
        </span>
      </Link>
      <div className={styles.headerControls}>
        <Link href="/scan" aria-label="Scan" className={styles.scanIcon}>
          <IoScanSharp size={24} />
        </Link>
        <Link
          href="/profile"
          aria-label="Profile"
          className={styles.profileIcon}
        >
          <IoPersonCircleOutline size={24} />
        </Link>
        <button
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <IoSunnyOutline size={22} />
          ) : (
            <IoMoonOutline size={22} />
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
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Only show header if user is logged in and not on login page or homepage
  const showHeader = session && router.pathname !== "/login" && router.pathname !== "/";

  return (
    <ThemeProvider>
      <Head>
        <title>ScanSave.in</title>
        <meta
          name="description"
          content="Track your spending by scanning food products. Understand their impact on your health and the environment."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={inter.className}>
        {showHeader && <Header />}
        <Component {...pageProps} />
      </div>
      <Toaster
        position="bottom-center"
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
    </ThemeProvider>
  );
}
