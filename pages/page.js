'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import styles from '../styles/Home.module.css'
import Gauge from '../components/Gauge'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1) // 1: Hero, 2: Scanner, 3: Confirm, 4: Portion, 5: Results
  const [barcode, setBarcode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [productInfo, setProductInfo] = useState(null)
  const [weightOption, setWeightOption] = useState('half')
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)

  // Initialize scanner when isScanning changes
  useEffect(() => {
    let scanner = null;
    
    if (isScanning) {
      try {
        scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 150
            },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            defaultZoomValueIfSupported: 2,
            videoConstraints: {
              facingMode: { ideal: "environment" }
            }
          },
          false
        );

        const handleSuccess = (decodedText) => {
          console.log("Barcode detected:", decodedText);
          setBarcode(decodedText);
          if (scanner) {
            try {
              scanner.clear();
            } catch (error) {
              console.error("Failed to clear scanner:", error);
            }
          }
          setIsScanning(false);
          fetchProductInfo(decodedText);
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
        }

      } catch (error) {
        console.error("Scanner initialization error:", error);
        setIsScanning(false);
      }
    }

    // Cleanup function
    return () => {
      if (scanner) {
        try {
          scanner.clear();
        } catch (error) {
          console.error("Failed to clear scanner:", error);
        }
      }
    };
  }, [isScanning]); // Only re-run when isScanning changes

  // Update URL when step changes
  const updateStep = (newStep) => {
    setStep(newStep)
    router.push(`?stage=${newStep}`, { scroll: false })
  }

  // Initialize step from URL on load
  useEffect(() => {
    const stage = searchParams.get('stage')
    if (stage) {
      setStep(parseInt(stage))
    }
  }, [searchParams])

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(prefersDark)
    
    // Update body class
    document.body.className = prefersDark ? 'dark' : ''
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.body.className = !isDarkMode ? 'dark' : ''
  }

  const fetchProductInfo = async (code) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/product?barcode=${code}&weight=100`)
      const data = await response.json()
      console.log(data)
      
      if (data.status === 'success' && data.product) {
        toast.success('Product found!')
        setProductInfo(data.product)
        updateStep(3)
      } else {
        toast.error('Product not found')
        setProductInfo(null)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to fetch product')
      setProductInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualEntry = (e) => {
    e.preventDefault()
    if (barcode) {
      fetchProductInfo(barcode)
    }
  }

  const renderStep = () => {
    // Add loading screen before other cases
    if (isLoading) {
      return (
        <div className={styles.loadingScreen}>
          <div className={styles.loadingAnimation}>
            <div className={styles.scanner}>
              <div className={styles.scannerBar}></div>
            </div>
          </div>
          <p className={styles.loadingText}>Searching for product...</p>
        </div>
      )
    }

    switch (step) {
      case 1:
        return (
          <div className={styles.hero}>
            <h1 className={styles.title}>
              Track what you eat <span>effortlessly</span>
            </h1>
            <p className={styles.subtitle}>
              Scan any food product to understand its impact on your health and the environment
            </p>
            <button 
              className={styles.ctaButton}
              onClick={() => updateStep(2)}
            >
              Start Scanning →
            </button>
          </div>
        )

      case 2:
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
        )

      case 3:
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
                {productInfo.productName && <h3>{productInfo.productName}</h3>}
                {productInfo.brands && <p>{productInfo.brands}</p>}
              </div>
            )}
            <div className={styles.confirmButtons}>
              <button 
                onClick={() => updateStep(2)} 
                className={styles.backButton}
              >
                No, go back
              </button>
              <button 
                onClick={() => updateStep(4)} 
                className={styles.confirmButton}
              >
                Yes, continue
              </button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className={styles.portionStep}>
            <h2 className={styles.stepTitle}>How much did you have?</h2>
            <div className={styles.portionOptions}>
              {[
                { id: 'little', label: 'Just a bite', amount: '10g' },
                { id: 'quarter', label: 'Quarter', amount: '25g' },
                { id: 'half', label: 'Half', amount: '50g' },
                { id: 'full', label: 'Whole thing', amount: '100g' },
                { id: 'double', label: 'Double', amount: '200g' }
              ].map(option => (
                <label 
                  key={option.id}
                  className={`${styles.portionOption} ${weightOption === option.id ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="portion"
                    value={option.id}
                    checked={weightOption === option.id}
                    onChange={(e) => setWeightOption(e.target.value)}
                  />
                  <span className={styles.portionLabel}>{option.label}</span>
                  <span className={styles.portionAmount}>{option.amount}</span>
                </label>
              ))}
            </div>
            <button 
              onClick={() => updateStep(5)} 
              className={styles.nextButton}
            >
              See Results →
            </button>
          </div>
        )

      case 5:
        return (
          <div className={styles.resultsStep}>
            <h2 className={styles.stepTitle}>Product Impact</h2>
            
            {productInfo?.healthInfo?.nutriscore && (
              <div className={styles.scoreCard}>
                <h3>Nutrition Score</h3>
                <Gauge 
                  value={getScorePercentage(productInfo.healthInfo.nutriscore)}
                  label={getScoreLabel(productInfo.healthInfo.nutriscore)}
                />
              </div>
            )}

            {productInfo?.environmentalImpact?.score && productInfo.environmentalImpact.score !== 'not-applicable' ? (
              <div className={styles.scoreCard}>
                <h3>Environmental Impact</h3>
                <Gauge 
                  value={getScorePercentage(productInfo.environmentalImpact.score)}
                  label={getEnvironmentalLabel(productInfo.environmentalImpact.score)}
                />
              </div>
            ) : (
              <div className={styles.scoreCard}>
                <h3>Environmental Impact</h3>
                <div className="unknown-score">
                  <p>We don't have environmental impact data for this product yet.</p>
                  <p className="unknown-score-hint">This might be because:</p>
                  <ul>
                    <li>Environmental impact assessment is pending</li>
                    <li>The product's packaging information is incomplete</li>
                    <li>The manufacturer hasn't provided environmental data</li>
                  </ul>
                </div>
              </div>
            )}

            <div className={styles.accordionSection}>
              <details className={styles.accordion}>
                <summary>Nutritional Information</summary>
                <div className={styles.accordionContent}>
                  {Object.entries(productInfo?.nutrients || {}).map(([key, value]) => (
                    value !== 0 && (
                      <div key={key} className={styles.nutrientRow}>
                        <span>{key}</span>
                        <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                      </div>
                    )
                  ))}
                  {Object.values(productInfo?.nutrients || {}).every(v => v === 0) && (
                    <p className={styles.noData}>No nutritional information available</p>
                  )}
                </div>
              </details>

              <details className={styles.accordion}>
                <summary>Product Categories</summary>
                <div className={styles.accordionContent}>
                  <ul className={styles.categoryList}>
                    {productInfo?.category?.map(category => (
                      <li key={category} className={styles.categoryItem}>
                        {category.replace('en:', '').split('-').join(' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>

              {productInfo?.packaging?.materials && (
                <details className={styles.accordion}>
                  <summary>Packaging Information</summary>
                  <div className={styles.accordionContent}>
                    <p>{productInfo.packaging.materials.split(',').join(', ')}</p>
                  </div>
                </details>
              )}
            </div>

            <button 
              onClick={() => setShowMoreActions(true)}
              className={styles.moreActionsButton}
            >
              Continue
            </button>

            {showMoreActions && (
              <div className={styles.modalOverlay} onClick={() => setShowMoreActions(false)}>
                <div 
                  className={styles.modalContent}
                  onClick={e => e.stopPropagation()}
                >
                  <div className={styles.modalActions}>
                    <button 
                      onClick={() => {
                        updateStep(6)
                        setShowMoreActions(false)
                      }}
                      className={styles.modalAction}
                    >
                      Find Stores Nearby
                    </button>
                    <button 
                      onClick={() => {
                        updateStep(7)
                        setShowMoreActions(false)
                      }}
                      className={styles.modalAction}
                    >
                      See Healthier Options
                    </button>
                    <button 
                      onClick={() => {
                        updateStep(2)
                        setShowMoreActions(false)
                      }}
                      className={styles.modalAction}
                    >
                      Scan Another Product
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 6:
        return (
          <div className={styles.storesStep}>
            {/* Stores content */}
            <button 
              onClick={() => updateStep(5)}
              className={styles.backButton}
            >
              ← Back to Results
            </button>
          </div>
        )

      case 7:
        return (
          <div className={styles.recommendationsStep}>
            {/* Recommendations content */}
            <button 
              onClick={() => updateStep(5)}
              className={styles.backButton}
            >
              ← Back to Results
            </button>
          </div>
        )
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <button 
          onClick={toggleDarkMode}
          className={styles.themeToggle}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        {renderStep()}
      </main>
    </div>
  )
}

function getScorePercentage(score) {
  if (!score) return 0;
  
  // Convert letter grades to percentages
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