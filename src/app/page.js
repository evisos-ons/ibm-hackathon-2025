'use client';

import { useState } from 'react';
import { useZxing } from 'react-zxing';
import styles from './page.module.css';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);

  const { ref } = useZxing({
    onDecodeResult: async (result) => {
      setIsScanning(false);
      try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${result.getText()}.json`);
        const data = await response.json();
        if (data.status === 1) {
          setProductData(data.product);
          setError(null);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Error fetching product data');
      }
    },
  });

  const handleStartScan = () => {
    setIsScanning(true);
    setProductData(null);
    setError(null);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Food Scanner</h1>
        
        {!isScanning && !productData && (
          <button 
            className={styles.primary}
            onClick={handleStartScan}
          >
            Scan Barcode
          </button>
        )}

        {isScanning && (
          <div className={styles.scanner}>
            <video ref={ref} />
            <button 
              className={styles.secondary}
              onClick={() => setIsScanning(false)}
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
            <h2>{productData.product_name}</h2>
            
            <h3>Nutrition Facts</h3>
            <div className={styles.nutritionInfo}>
              {productData.nutriments && (
                <>
                  <p>Energy: {productData.nutriments.energy_100g || 'N/A'} kcal/100g</p>
                  <p>Proteins: {productData.nutriments.proteins_100g || 'N/A'} g/100g</p>
                  <p>Carbohydrates: {productData.nutriments.carbohydrates_100g || 'N/A'} g/100g</p>
                  <p>Fat: {productData.nutriments.fat_100g || 'N/A'} g/100g</p>
                </>
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
              onClick={handleStartScan}
            >
              Scan Another Product
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
