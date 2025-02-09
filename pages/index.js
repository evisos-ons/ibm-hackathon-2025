import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import styles from "../styles/page.module.css";
import { useRouter } from "next/router";
import { IoScanSharp, IoLeafOutline, IoWalletOutline, IoTrendingUpOutline } from "react-icons/io5";

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleAction = () => {
    if (session) {
      router.push("/scan");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className={`${styles.page} ${styles.pageHomeScreen}`}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            Scan Your Food. <span>Save Money.</span> Live Better.
          </h1>
          <p className={styles.subtitle}>
            Scan food products to track spending, understand their impact on your health and the environment, and find better alternatives.
          </p>
          <button onClick={handleAction} className={styles.heroButton}>
            {session ? "Start Scanning" : "Login to Start"}
            <IoScanSharp size={20} />
          </button>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <IoScanSharp size={24} />
            <h2>Easy Scanning</h2>
            <p>Quickly scan barcodes to get detailed product information and pricing history.</p>
          </div>
          <div className={styles.feature}>
            <IoLeafOutline size={24} />
            <h2>Health Insights</h2>
            <p>Get nutritional information and health scores for your food choices.</p>
          </div>
          <div className={styles.feature}>
            <IoWalletOutline size={24} />
            <h2>Price Tracking</h2>
            <p>Track your spending and find better deals on similar products.</p>
          </div>
          <div className={styles.feature}>
            <IoTrendingUpOutline size={24} />
            <h2>Smart Suggestions</h2>
            <p>Receive AI-powered recommendations for healthier and more affordable alternatives.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
