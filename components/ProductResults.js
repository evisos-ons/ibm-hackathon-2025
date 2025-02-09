import { useState } from 'react';
import styles from '../styles/page.module.css';
import Gauge from './Gauge';
import { IoSparklesOutline } from 'react-icons/io5';

export default function ProductResults({ 
  productInfo, 
  price, 
  suggestions,
  isSuggestionsLoading,
  hasEnoughInfoForAI,
  alternatives,
  isAlternativesLoading,
  onFetchSuggestions,
  onScanAgain 
}) {
  const [openAccordion, setOpenAccordion] = useState('');

  const handleAccordionClick = (accordionId) => {
    setOpenAccordion(openAccordion === accordionId ? '' : accordionId);
  };

  if (!productInfo) {
    return (
      <div className={styles.resultsStep}>
        <div className={styles.loadingScreen}>
          <p>Loading product information...</p>
        </div>
      </div>
    );
  }

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
          onClick={onFetchSuggestions}
          disabled={!hasEnoughInfoForAI || suggestions}
        >
          <IoSparklesOutline />
          {suggestions
            ? 'AI Insights Loaded'
            : hasEnoughInfoForAI
            ? 'Get AI Insights'
            : 'Not Enough Product Info'}
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
            {Object.values(productInfo.nutrients).every((v) => v === 0) && (
              <p className={styles.noData}>
                No nutritional values - Natural water product
              </p>
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
                  .map((material) => (
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
              {productInfo.category.map((category) => (
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
        <button onClick={onScanAgain} className={styles.scanAgainButton}>
          Scan Another Product
        </button>
      </div>
    </div>
  );
}

function getScorePercentage(score) {
  if (!score) return 0;

  const scoreMap = {
    A: 90,
    B: 75,
    C: 60,
    D: 45,
    E: 30,
  };

  return scoreMap[score.toUpperCase()] || 50;
}

function getScoreLabel(score) {
  const labels = {
    A: 'Excellent nutritional value',
    B: 'Good nutritional value',
    C: 'Average nutritional value',
    D: 'Poor nutritional value',
    E: 'Very poor nutritional value',
  };

  return labels[score.toUpperCase()] || 'Nutritional value unknown';
} 