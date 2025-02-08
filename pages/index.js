'use client'
import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import styles from '../styles/page.module.css'
import Gauge from '../components/Gauge'
import { IoArrowForward, IoSparklesOutline } from 'react-icons/io5';
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'
import { saveProductScan } from '../utils/productHistory'

export default function ScanPage() {
  const [step, setStep] = useState(1); // 1: Scanner, 2: Confirm, 3: Portion, 4: Price, 5: Results
  const [barcode, setBarcode] = useState('3068320014067')
  const [isScanning, setIsScanning] = useState(false)
  const [productInfo, setProductInfo] = useState(null)
  const [portionPercentage, setPortionPercentage] = useState(100)
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  const [openAccordion, setOpenAccordion] = useState('');
  const [alternatives, setAlternatives] = useState([]);
  const [isAlternativesLoading, setIsAlternativesLoading] = useState(false);
  const [hasEnoughInfoForAI, setHasEnoughInfoForAI] = useState(false);
  const router = useRouter()

  // Add useEffect for saving scans at the top level
  useEffect(() => {
    const saveScan = async () => {
      if (step === 5 && productInfo && price) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await saveProductScan(session.user.id, productInfo, parseFloat(price), portionPercentage);
        }
      }
    };
    saveScan();
  }, [step, productInfo, price, portionPercentage]);

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchProductInfo = async (code) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/product?barcode=${code}&weight=100`);
      const data = await response.json();
      
      if (data.status === 'success' && data.product) {
        toast.success('Product found!');
        setProductInfo(data.product);
        // Check if there's enough info for AI suggestions
        const hasEnoughInfo = (
          data.product.healthInfo.ingredients || 
          data.product.healthInfo.nutriscore !== 'unknown' ||
          data.product.healthInfo.novaGroup ||
          data.product.category.length > 0 ||
          data.product.packaging.materials
        );
        setHasEnoughInfoForAI(hasEnoughInfo);
        // Fetch alternatives when product is found
        fetchAlternatives(data.product);
        setStep(2); // Move to confirmation step
      } else {
        toast.error('Product not found');
        setProductInfo(null);
        setHasEnoughInfoForAI(false);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product');
      setProductInfo(null);
      setHasEnoughInfoForAI(false);
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

  // Modify the fetchSuggestions function
  const fetchSuggestions = async (productData) => {
    // Check if we have enough information to make meaningful suggestions
    const hasEnoughInfo = (
      productData.healthInfo.ingredients || 
      productData.healthInfo.nutriscore !== 'unknown' ||
      productData.healthInfo.novaGroup ||
      productData.category.length > 0 ||
      productData.packaging.materials
    );

    if (!hasEnoughInfo) {
      toast.error('Not enough product information for AI suggestions');
      return;
    }

    setIsSuggestionsLoading(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productInfo: productData,
          price: price // Include the price in the request
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setSuggestions(data.suggestions);
      } else {
        console.error('Failed to get suggestions:', data.error);
        toast.error('Failed to get AI suggestions');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  // Add this function to handle accordion clicks
  const handleAccordionClick = (accordionId) => {
    setOpenAccordion(openAccordion === accordionId ? '' : accordionId);
  };

  const fetchAlternatives = async (productData) => {
    setIsAlternativesLoading(true);
    try {
      // Get the main category from the product
      const mainCategory = productData.category[0];
      const params = new URLSearchParams({
        category: mainCategory,
        nutriscore: productData.healthInfo.nutriscore,
      });

      const response = await fetch(`/api/alternatives?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success') {
        setAlternatives(data.alternatives);
      } else {
        console.error('Failed to get alternatives:', data.error);
      }
    } catch (error) {
      console.error('Error fetching alternatives:', error);
    } finally {
      setIsAlternativesLoading(false);
    }
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
                  type="number"
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
            <div className={styles.confirmButtons}>
              <button 
                onClick={() => setStep(2)} 
                className={styles.backButton}
              >
                Back
              </button>
              <button 
                onClick={() => setStep(4)} 
                className={styles.confirmButton}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 4: // Price
        return (
          <div className={styles.priceStep}>
            <h2 className={styles.stepTitle}>How much did you pay?</h2>
            <p className={styles.priceHint}>Enter the price you paid for this product</p>
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
                required
              />
            </div>
            <div className={styles.confirmButtons}>
              <button 
                onClick={() => setStep(3)} 
                className={styles.backButton}
              >
                Back
              </button>
              <button 
                onClick={() => {
                  if (!price || parseFloat(price) <= 0) {
                    toast.error('Please enter a valid price');
                    return;
                  }
                  setStep(5);
                }} 
                className={styles.confirmButton}
                disabled={!price || parseFloat(price) <= 0}
              >
                {price ? 'Continue' : 'Enter a price'}
              </button>
            </div>
          </div>
        );

      case 5: // Results
        return (
          <div className={styles.resultsStep}>
            <div className={styles.productHeader}>
              <div>
                <h2 className={styles.stepTitle}>{productInfo.productName}</h2>
                {productInfo.brands && (
                  <p className={styles.brandName}>{productInfo.brands}</p>
                )}
              </div>
            </div>

            <div className={styles.topSection}>
              {productInfo.image && (
                <img 
                  src={productInfo.image} 
                  alt={productInfo.productName}
                  className={styles.productImage}
                />
              )}

              <div className={styles.mainColumn}>
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

                {price && (
                  <div className={styles.priceCard}>
                    <h3>Price Paid</h3>
                    <p className={styles.priceDisplay}>£{parseFloat(price).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
            {isSuggestionsLoading ? (
              <div className={styles.aiButton}>
                <IoSparklesOutline />
                Loading AI Insights...
              </div>
            ) : (
              <button 
                className={styles.aiButton}
                onClick={() => fetchSuggestions(productInfo)}
                disabled={!hasEnoughInfoForAI || suggestions || isSuggestionsLoading}
              >
                <IoSparklesOutline />
                {suggestions 
                  ? 'AI Insights Loaded' 
                  : hasEnoughInfoForAI 
                    ? 'Get AI Insights' 
                    : 'Not Enough Product Info'
                }
              </button>
            )}

            {suggestions && (
              <div className={`${styles.sideColumn} ${styles.aiColumn}`}>
                <h3>AI Insights</h3>
                {price && suggestions.price && (
                  <details 
                    className={styles.accordion}
                    open={openAccordion === 'price'}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAccordionClick('price');
                    }}
                  >
                    <summary>Price Analysis</summary>
                    <div className={styles.accordionContent}>
                      <p>{suggestions.price}</p>
                    </div>
                  </details>
                )}
                <details 
                  className={styles.accordion}
                  open={openAccordion === 'health'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAccordionClick('health');
                  }}
                >
                  <summary>Health Analysis</summary>
                  <div className={styles.accordionContent}>
                    <p>{suggestions.health}</p>
                  </div>
                </details>

                <details 
                  className={styles.accordion}
                  open={openAccordion === 'alternatives'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAccordionClick('alternatives');
                  }}
                >
                  <summary>Alternative Products</summary>
                  <div className={styles.accordionContent}>
                    <p>{suggestions.alternatives}</p>
                  </div>
                </details>

                <details 
                  className={styles.accordion}
                  open={openAccordion === 'usage'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAccordionClick('usage');
                  }}
                >
                  <summary>Usage Tips</summary>
                  <div className={styles.accordionContent}>
                    <p>{suggestions.usage}</p>
                  </div>
                </details>
              </div>
            )}

            <div className={styles.sideColumn}>
              <h3>Product Details</h3>
              <details 
                className={styles.accordion}
                open={openAccordion === 'nutrition'}
                onClick={(e) => {
                  e.preventDefault();
                  handleAccordionClick('nutrition');
                }}
              >
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
                <details 
                  className={styles.accordion}
                  open={openAccordion === 'ingredients'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAccordionClick('ingredients');
                  }}
                >
                  <summary>Ingredients</summary>
                  <div className={styles.accordionContent}>
                    <p>{productInfo.healthInfo.ingredients}</p>
                    {productInfo.healthInfo.isVegetarian && (
                      <p className={styles.dietaryInfo}>✓ Suitable for vegetarians</p>
                    )}
                  </div>
                </details>
              )}

              {suggestions && (
                <details 
                  className={styles.accordion}
                  open={openAccordion === 'environmental'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAccordionClick('environmental');
                  }}
                >
                  <summary>Environmental Impact</summary>
                  <div className={styles.accordionContent}>
                    <p>{suggestions.environmental}</p>
                  </div>
                </details>
              )}

              {productInfo.packaging.materials && (
                <details 
                  className={styles.accordion}
                  open={openAccordion === 'recycling'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAccordionClick('recycling');
                  }}
                >
                  <summary>Recycling Information</summary>
                  <div className={styles.accordionContent}>
                    {suggestions?.recycling && (
                      <p className={styles.recyclingTip}>{suggestions.recycling}</p>
                    )}
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

              <details 
                className={styles.accordion}
                open={openAccordion === 'categories'}
                onClick={(e) => {
                  e.preventDefault();
                  handleAccordionClick('categories');
                }}
              >
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
            </div>

            <div className={styles.alternativesSection}>
              <h3>Similar Products You Might Like</h3>
              {isAlternativesLoading ? (
                <div className={styles.loadingSpinner}>Loading alternatives...</div>
              ) : alternatives.length > 0 ? (
                <div className={styles.alternativesGrid}>
                  {alternatives.map((alt) => (
                    <div key={alt.barcode} className={styles.alternativeCard}>
                      <div className={styles.alternativeImageContainer}>
                      {alt.image && (
                        <img
                          src={alt.image}
                          alt={alt.name}
                          className={styles.alternativeImage}
                        />
                      )}
                        </div>
                      
                      <div className={styles.alternativeInfo}>
                        <h4>{alt.name}</h4>
                        {alt.brand && <p className={styles.altBrand}>{alt.brand}</p>}
                        {alt.nutriscore && (
                          <div className={styles.altScore}>
                            Nutri-Score: {alt.nutriscore.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noAlternatives}>No similar products found</p>
              )}
            </div>
              <div className={styles.scanAgainButtonContainer}>
            <button 
              onClick={() => {
                setStep(1);
                setProductInfo(null);
                setBarcode('');
                setPortionPercentage(100);
                setPrice('');
                setSuggestions(null);
                setOpenAccordion('');
                setAlternatives([]);
              }}
              className={styles.scanAgainButton}
            >
              Scan Another Product
            </button>    
              </div>
            
          </div>
        );
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {renderStep()}
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

function getEnvironmentalLabel(score) {
  const labels = {
    'A': 'Very low environmental impact',
    'B': 'Low environmental impact',
    'C': 'Moderate environmental impact',
    'D': 'High environmental impact',
    'E': 'Very high environmental impact'
  };
  
  return labels[score.toUpperCase()] || 'Environmental impact unknown';
} 