'use client'
import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import styles from '../styles/page.module.css'
import Gauge from '../components/Gauge'

export default function ScanPage() {
  const [step, setStep] = useState(1); // 1: Scanner, 2: Confirm, 3: Portion, 4: Price, 5: Results
  const [barcode, setBarcode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [productInfo, setProductInfo] = useState(null)
  const [portionPercentage, setPortionPercentage] = useState(100)
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize scanner when isScanning changes
  useEffect(() => {
    let scanner = null;
    
    if (isScanning) {
      try {
        scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 5,
            qrbox: {
              width: 300,
              height: 100
            },
            aspectRatio: 1.777778,
            showTorchButtonIfSupported: true,
            defaultZoomValueIfSupported: 2,
            videoConstraints: {
              facingMode: { ideal: "environment" },
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 }
            }
          },
          false
        );

        const handleSuccess = (decodedText) => {
          // Validate barcode format
          const barcodeRegex = /^[0-9]{8,13}$/;
          if (!barcodeRegex.test(decodedText)) {
            console.warn("Invalid barcode format:", decodedText);
            return;
          }

          console.log("Barcode detected:", decodedText);
          setBarcode(decodedText);
          
          // Stop scanning and clear scanner
          if (scanner) {
            try {
              scanner.pause();
              setTimeout(() => {
                scanner.clear();
                setIsScanning(false);
                fetchProductInfo(decodedText);
              }, 500);
            } catch (error) {
              console.error("Failed to clear scanner:", error);
            }
          }
        };

        const handleError = (err) => {
          // Only log errors that aren't related to normal scanning process
          if (!err?.message?.includes("No MultiFormat Readers")) {
            console.warn("Scanner error:", err);
          }
        };

        try {
          scanner.render(handleSuccess, handleError);
        } catch (error) {
          console.error("Failed to render scanner:", error);
          setIsScanning(false);
          toast.error('Failed to start camera');
        }

      } catch (error) {
        console.error("Scanner initialization error:", error);
        setIsScanning(false);
        toast.error('Failed to initialize scanner');
      }
    }

    // Cleanup function
    return () => {
      if (scanner) {
        try {
          scanner.pause();
          setTimeout(() => scanner.clear(), 500);
        } catch (error) {
          console.error("Failed to clear scanner:", error);
        }
      }
    };
  }, [isScanning]);

  const fetchProductInfo = async (code) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/product?barcode=${code}&weight=100`);
      const data = await response.json();
      
      if (data.status === 'success' && data.product) {
        toast.success('Product found!');
        setProductInfo(data.product);
        setStep(2); // Move to confirmation step
      } else {
        toast.error('Product not found');
        setProductInfo(null);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product');
      setProductInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = (e) => {
    e.preventDefault();
    const barcodeRegex = /^[0-9]{8,13}$/;
    if (!barcodeRegex.test(barcode)) {
      toast.error('Please enter a valid 8-13 digit barcode');
      return;
    }
    fetchProductInfo(barcode);
  };

  const getPortionLabel = (percentage) => {
    if (percentage <= 25) return 'Just a bite';
    if (percentage <= 50) return 'Half';
    if (percentage <= 75) return 'Most of it';
    return 'All of it';
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.loadingScreen}>
            <div className={styles.loadingAnimation}>
              <div className={styles.scanner}>
                <div className={styles.scannerBar}></div>
              </div>
            </div>
            <p className={styles.loadingText}>Searching for product...</p>
          </div>
        </main>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1: // Scanner
        return (
          <div className={styles.scannerStep}>
            <h2 className={styles.stepTitle}>Scan Your Product</h2>
            <div className={styles.scanOptions}>
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={styles.scanButton}
              >
                {isScanning ? 'Stop Camera' : 'Open Camera'}
              </button>
              <p className={styles.orDivider}>or</p>
              <form onSubmit={handleManualEntry} className={styles.manualEntry}>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Enter barcode manually"
                  className={styles.input}
                />
                <button type="submit" className={styles.submitButton}>
                  Search
                </button>
              </form>
            </div>
            {isScanning && (
              <div className={styles.scannerContainer}>
                <div id="reader" className={styles.reader}></div>
                <p className={styles.instruction}>
                  Position the barcode in front of your camera
                </p>
              </div>
            )}
          </div>
        );

      case 2: // Confirm
        return (
          <div className={styles.confirmStep}>
            <h2 className={styles.stepTitle}>Is this your product?</h2>
            {productInfo && (
              <div className={styles.productCard}>
                {productInfo.image && (
                  <img 
                    src={productInfo.image} 
                    alt={productInfo.productName}
                    className={styles.productImage}
                  />
                )}
                <h3>{productInfo.productName}</h3>
                {productInfo.brands && <p>{productInfo.brands}</p>}
              </div>
            )}
            <div className={styles.confirmButtons}>
              <button 
                onClick={() => setStep(1)} 
                className={styles.backButton}
              >
                No, go back
              </button>
              <button 
                onClick={() => setStep(3)} 
                className={styles.confirmButton}
              >
                Yes, continue
              </button>
            </div>
          </div>
        );

      case 3: // Portion
        return (
          <div className={styles.portionStep}>
            <h2 className={styles.stepTitle}>How much did you have?</h2>
            <div className={styles.portionSlider}>
              <p className={styles.portionLabel}>{getPortionLabel(portionPercentage)}</p>
              <input
                type="range"
                min="0"
                max="100"
                value={portionPercentage}
                onChange={(e) => setPortionPercentage(parseInt(e.target.value))}
                className={styles.slider}
              />
              <p className={styles.portionValue}>{portionPercentage}%</p>
            </div>
            <button 
              onClick={() => setStep(4)} 
              className={styles.nextButton}
            >
              Next →
            </button>
          </div>
        );

      case 4: // Price
        return (
          <div className={styles.priceStep}>
            <h2 className={styles.stepTitle}>How much did you pay?</h2>
            <p className={styles.priceHint}>Optional - This helps us find better deals</p>
            <div className={styles.priceInput}>
              <span className={styles.currencySymbol}>£</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={styles.input}
              />
            </div>
            <div className={styles.priceButtons}>
              <button 
                onClick={() => setStep(3)} 
                className={styles.backButton}
              >
                Back
              </button>
              <button 
                onClick={() => setStep(5)} 
                className={styles.nextButton}
              >
                {price ? 'See Results →' : 'Skip →'}
              </button>
            </div>
          </div>
        );

      case 5: // Results
        return (
          <div className={styles.resultsStep}>
            <h2 className={styles.stepTitle}>{productInfo.productName}</h2>
            {productInfo.brands && (
              <p className={styles.brandName}>{productInfo.brands}</p>
            )}
            
            {productInfo.image && (
              <img 
                src={productInfo.image} 
                alt={productInfo.productName}
                className={styles.productImage}
              />
            )}

            {price && (
              <div className={styles.priceCard}>
                <h3>Price Paid</h3>
                <p className={styles.priceDisplay}>${parseFloat(price).toFixed(2)}</p>
                <button className={styles.findCheaperButton}>
                  Find it cheaper
                </button>
              </div>
            )}

            {productInfo?.healthInfo?.nutriscore && (
              <div className={styles.scoreCard}>
                <h3>Nutrition Score</h3>
                <Gauge 
                  value={getScorePercentage(productInfo.healthInfo.nutriscore)}
                  label={getScoreLabel(productInfo.healthInfo.nutriscore)}
                />
                {productInfo.healthInfo.novaGroup && (
                  <p className={styles.novaGroup}>
                    NOVA Group: {productInfo.healthInfo.novaGroup}
                  </p>
                )}
              </div>
            )}

            <div className={styles.accordionSection}>
              <details className={styles.accordion}>
                <summary>Product Categories</summary>
                <div className={styles.accordionContent}>
                  <ul className={styles.categoryList}>
                    {productInfo.category.map(category => (
                      <li key={category} className={styles.categoryItem}>
                        {category.replace('en:', '').split('-').join(' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>

              <details className={styles.accordion}>
                <summary>Nutritional Information</summary>
                <div className={styles.accordionContent}>
                  {Object.entries(productInfo.nutrients).map(([key, value]) => (
                    <div key={key} className={styles.nutrientRow}>
                      <span>{key}</span>
                      <span>{value.toFixed(1)}</span>
                    </div>
                  ))}
                  {Object.values(productInfo.nutrients).every(v => v === 0) && (
                    <p className={styles.noData}>No nutritional values - Natural water product</p>
                  )}
                </div>
              </details>

              {productInfo.healthInfo.ingredients && (
                <details className={styles.accordion}>
                  <summary>Ingredients</summary>
                  <div className={styles.accordionContent}>
                    <p>{productInfo.healthInfo.ingredients}</p>
                    {productInfo.healthInfo.isVegetarian && (
                      <p className={styles.dietaryInfo}>✓ Suitable for vegetarians</p>
                    )}
                  </div>
                </details>
              )}

              {productInfo.packaging.materials && (
                <details className={styles.accordion}>
                  <summary>Packaging Information</summary>
                  <div className={styles.accordionContent}>
                    <ul className={styles.packagingList}>
                      {productInfo.packaging.materials
                        .split(', ')
                        .map(material => (
                          <li key={material} className={styles.packagingItem}>
                            {material.replace('en:', '').split('-').join(' ')}
                          </li>
                        ))}
                    </ul>
                  </div>
                </details>
              )}
            </div>

            <button 
              onClick={() => {
                setStep(1);
                setProductInfo(null);
                setBarcode('');
                setPortionPercentage(100);
                setPrice('');
              }}
              className={styles.scanAgainButton}
            >
              Scan Another Product
            </button>
          </div>
        );
    }
  };

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/page.module.css';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/scanner');
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccess('Logged in successfully!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccess('Check your email for confirmation!');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
    });
    if (error) console.error(error);
  };

  return (
    <div className={styles.container}>
      <div className={styles.authForm}>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={handleAuth}>
          <div className={styles.formGroup}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.switchMode}>
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className={styles.textButton}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>

        <div className={styles.socialLogin}>
          <button 
            onClick={() => handleSocialLogin('google')}
            className={styles.socialButton}
          >
            Continue with Google
          </button>
          <button 
            onClick={() => handleSocialLogin('github')}
            className={styles.socialButton}
          >
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
