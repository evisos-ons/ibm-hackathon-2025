import { useRouter } from "next/router";
import styles from "../styles/page.module.css";
import toast from "react-hot-toast";
import { IoPersonCircle, IoLogOutOutline, IoCompass } from "react-icons/io5";
import { supabase } from "../utils/supabaseClient";
import { getUserScannedProducts, getUserStats } from "../utils/productHistory";
import { useEffect, useState } from "react";
import UserInsights from "../components/UserInsights";
import Link from "next/link";
import AIInsights from "../components/AIInsights";

export default function ProfilePage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [userStats, setUserStats] = useState({
    totalScans: 0,
    healthScore: "N/A",
    totalSpent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching user:", error);
        return;
      }

      if (!session) {
        router.push("/login");
        return;
      }

      setUserEmail(session.user.email);
      setUserId(session.user.id);

      const [scanHistory, stats] = await Promise.all([
        getUserScannedProducts(session.user.id, 5),
        getUserStats(session.user.id),
      ]);

      console.log(scanHistory);
      console.log(stats);

      if (scanHistory.data) {
        setRecentScans(scanHistory.data);
      }

      if (stats.data) {
        setUserStats(stats.data);
      }

      setIsLoading(false);
    };

    getUser();
  }, [router]);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setProfile(user);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const handleScanClick = (barcode) => {
    router.push(`/scan?barcode=${barcode}`);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.loadingScreen}>
            <p>Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <IoPersonCircle size={80} className={styles.profileIcon} />
            <h1 className={styles.profileName}>
              {userEmail ? userEmail.split("@")[0] : "Loading..."}
            </h1>
            <p className={styles.profileEmail}>{userEmail || "Loading..."}</p>
            <div className={styles.logoutButtonContainer}>
              <button onClick={handleLogout} className={styles.logoutButton}>
                <IoLogOutOutline size={16} />
                Sign Out
              </button>
            </div>
          </div>

          <div className={styles.statsSection}>
            <div className={styles.statCard}>
              <h3>Total Scans</h3>
              <p>{userStats.totalScans}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Health Score</h3>
              <p>{userStats.healthScore}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Total Spent</h3>
              <p>£{userStats.totalSpent.toFixed(2)}</p>
            </div>
          </div>
          <div className={styles.trackerButtonContainer}>
            <Link href="/tracker" className={styles.trackerButton}>
              <IoCompass size={24} />
              View Tracker
            </Link>
          </div>

          <div className={styles.recentlyScanned}>
            {recentScans.length > 0 ? (
              <>
                <h3>Recent Items</h3>
                <div className={styles.scanList}>
                  {recentScans.map((scan) => (
                    <div
                      key={scan.id}
                      className={styles.scanItem}
                      onClick={() => handleScanClick(scan.barcode)}
                      style={{ cursor: "pointer" }}
                    >
                      {scan.image_url && (
                        <img
                          src={scan.image_url}
                          alt={scan.product_name}
                          className={styles.scanItemImage}
                        />
                      )}
                      <div className={styles.scanItemInfo}>
                        <h4>
                          {scan.product_name} - {scan.brand}
                        </h4>
                        <div className={styles.scanItemDetailsContainer}>
                          {scan.price && (
                            <span>
                              £{scan.price.toFixed(2)}
                            </span>
                          )}
                          {scan.nutriscore && (
                            <span>
                              Nutri-Score: {scan.nutriscore.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.noScans}>No items scanned yet</p>
            )}
          </div>

          {userId && (
            <div className={styles.aiInsightsSection}>
              <AIInsights userId={userId} />
            </div>
          )}

          {userId && (
            <div className={styles.aiInsightsSection}>
              <UserInsights userId={userId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
