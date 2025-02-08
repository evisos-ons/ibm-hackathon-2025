'use client'
import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import styles from '../styles/page.module.css'
import Gauge from '../components/Gauge'

export default function ScanPage() {
  const [barcode, setBarcode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [productInfo, setProductInfo] = useState(null)
  const [weightOption, setWeightOption] = useState('half')
  const [isLoading, setIsLoading] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)

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

  if (productInfo) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.productInfo}>
            <h2>{productInfo.productName}</h2>
            {productInfo.image && (
              <img 
                src={productInfo.image} 
                alt={productInfo.productName}
                className={styles.productImage}
              />
            )}
            
            {productInfo.healthInfo?.nutriscore && (
              <div className={styles.scoreCard}>
                <h3>Nutrition Score</h3>
                <Gauge 
                  value={getScorePercentage(productInfo.healthInfo.nutriscore)}
                  label={getScoreLabel(productInfo.healthInfo.nutriscore)}
                />
              </div>
            )}

            <div className={styles.accordionSection}>
              <details className={styles.accordion}>
                <summary>Nutritional Information</summary>
                <div className={styles.accordionContent}>
                  {Object.entries(productInfo.nutrients || {}).map(([key, value]) => (
                    value !== 0 && (
                      <div key={key} className={styles.nutrientRow}>
                        <span>{key}</span>
                        <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                      </div>
                    )
                  ))}
                </div>
              </details>
            </div>

            <button 
              onClick={() => {
                setProductInfo(null);
                setBarcode('');
              }}
              className={styles.scanAgainButton}
            >
              Scan Another Product
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
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
      </main>
    </div>
  );
}

function getScorePercentage(score) {
  if (!score) return 0;
  
  const scoreMap = {
    'A': 90,
    'B': 75,
    'C': 60,
    'D': 45,
    'E': 30
  };
  
  return scoreMap[score.toUpperCase()] || 50;
}

function getScoreLabel(score) {
  const labels = {
    'A': 'Excellent nutritional value',
    'B': 'Good nutritional value',
    'C': 'Average nutritional value',
    'D': 'Poor nutritional value',
    'E': 'Very poor nutritional value'
  };
  
  return labels[score.toUpperCase()] || 'Nutritional value unknown';
} 