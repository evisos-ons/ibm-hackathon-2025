'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/page.module.css';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (isScanning && !scanner && typeof window !== 'undefined') {
      import('html5-qrcode').then((Html5QrcodeScanner) => {
        try {
          const newScanner = new Html5QrcodeScanner.Html5QrcodeScanner('reader', {
            qrbox: {
              width: 250,
              height: 250,
            },
            fps: 5,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
          });

          newScanner.render(success, error);
          setScanner(newScanner);
        } catch (err) {
          console.error('Scanner initialization error:', err);
          setError('Failed to initialize camera. Please make sure you have granted camera permissions.');
          setIsScanning(false);
        }
      }).catch((err) => {
        console.error('Failed to load scanner:', err);
        setError('Failed to load the scanner. Please try again.');
        setIsScanning(false);
      });
    }

    function success(result) {
      if (scanner) {
        scanner.clear();
      }
      setScanner(null);
      setIsScanning(false);
      fetchProductData(result);
    }

    function error(err) {
      console.warn(err);
    }

    return () => {
      if (scanner) {
        scanner.clear();
        setScanner(null);
      }
    };
  }, [isScanning]);

  const fetchProductData = async (barcode) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1) {
        setProductData(data.product);
        setError(null);
        setManualBarcode('');
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Error fetching product data');
      console.error('Fetch error:', err);
    }
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setProductData(null);
    setError(null);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      fetchProductData(manualBarcode.trim());
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Food Scanner</h1>
        
        {!isScanning && !productData && (
          <div className={styles.inputOptions}>
            <button 
              className={styles.primary}
              onClick={handleStartScan}
            >
              Scan Barcode
            </button>
            
            <div className={styles.divider}>OR</div>
            
            <form onSubmit={handleManualSubmit} className={styles.manualInput}>
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode manually"
                className={styles.input}
              />
              <button 
                type="submit" 
                className={styles.secondary}
                disabled={!manualBarcode.trim()}
              >
                Search
              </button>
            </form>
          </div>
        )}

        {isScanning && (
          <div className={styles.scanner}>
            <div id="reader"></div>
            <p className={styles.hint}>Please allow camera access and point at a barcode</p>
            <button 
              className={styles.secondary}
              onClick={() => {
                setIsScanning(false);
                if (scanner) {
                  scanner.clear();
                  setScanner(null);
                }
              }}
            >
              Cancel Scan
            </button>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {productData && (
          <div className={styles.productInfo}>
            <h2>{productData.product_name || 'Unknown Product'}</h2>
            
            <h3>Nutrition Facts</h3>
            <div className={styles.nutritionInfo}>
              {productData.nutriments ? (
                <>
                  <p>Energy: {productData.nutriments.energy_100g || 'N/A'} kcal/100g</p>
                  <p>Proteins: {productData.nutriments.proteins_100g || 'N/A'} g/100g</p>
                  <p>Carbohydrates: {productData.nutriments.carbohydrates_100g || 'N/A'} g/100g</p>
                  <p>Fat: {productData.nutriments.fat_100g || 'N/A'} g/100g</p>
                </>
              ) : (
                <p>No nutrition information available</p>
              )}
            </div>

            <h3>Environmental Impact</h3>
            <div className={styles.environmentalInfo}>
              {productData.ecoscore_grade ? (
                <p>Eco-score: {productData.ecoscore_grade.toUpperCase()}</p>
              ) : (
                <p>Environmental impact data not available</p>
              )}
            </div>

            <button 
              className={styles.primary}
              onClick={() => {
                setProductData(null);
                setError(null);
              }}
            >
              Scan Another Product
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
