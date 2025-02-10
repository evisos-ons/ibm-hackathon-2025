import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import styles from "../styles/page.module.css";
import { useRouter } from "next/router";
import { IoScanSharp, IoLeafOutline, IoWalletOutline, IoTrendingUpOutline, IoLogoGithub } from "react-icons/io5";
import Link from 'next/link';
import Image from 'next/image';

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

        <footer className={styles.footerSection}>
          <p className={styles.createdBy}>Created by Team 10</p>
          <div className={styles.teamList}>
            <a href="https://github.com/evisos-ons" target="_blank" className={styles.teamMember}>
              <Image 
                src="https://avatars.githubusercontent.com/u/180557538?s=64&v=4"
                alt="Sebastian's GitHub avatar"
                width={24}
                height={24}
                className={styles.avatar}
              />
              Sebastian
            </a>
            <a href="https://github.com/AshIsOnGithub" target="_blank" className={styles.teamMember}>
              <Image 
                src="https://avatars.githubusercontent.com/u/161076558?s=64&v=4"
                alt="Ash's GitHub avatar"
                width={24}
                height={24}
                className={styles.avatar}
              />
              Ash
            </a>
            <a href="https://github.com/PatChimsi" target="_blank" className={styles.teamMember}>
              <Image 
                src="https://avatars.githubusercontent.com/u/198340776?s=64&v=4"
                alt="Patrick's GitHub avatar"
                width={24}
                height={24}
                className={styles.avatar}
              />
              Patrick
            </a>
            <a href="https://github.com/yunusa1232" target="_blank" className={styles.teamMember}>
              <Image 
                src="https://avatars.githubusercontent.com/u/198340825?s=64&v=4"
                alt="Yunusa's GitHub avatar"
                width={24}
                height={24}
                className={styles.avatar}
              />
              Yunusa
            </a>
          </div>
          <a href="https://github.com/evisos-ons/ibm-hackathon-2025" className={styles.githubLink}>
            <IoLogoGithub size={20} />
            Open Source; GitHub Repository
          </a>
        </footer>
      </main>
    </div>
  );
}
