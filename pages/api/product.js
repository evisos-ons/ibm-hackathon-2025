export default async function handler(req, res) {
  const { barcode, weight } = req.query
  const weightNum = parseFloat(weight)

  try {
    const url = `https://world.openfoodfacts.org/api/v3/product/${barcode}.json`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.product) {
      return res.status(404).json({ 
        status: 'error',
        error: 'Product not found' 
      })
    }

    const product = data.product
    
    // Enhanced product information
    const productInfo = {
      status: 'success',
      product: {
        productName: product.product_name || product.generic_name || 'Unknown Product',
        brands: product.brands || '',
        image: product.image_front_url || product.image_url || '',
        category: product.categories_tags || [],
        nutrients: {
          'Energy (kcal)': (product.nutriments['energy-kcal_100g'] || 0) * (weightNum / 100),
          'Proteins (g)': (product.nutriments.proteins_100g || 0) * (weightNum / 100),
          'Carbohydrates (g)': (product.nutriments.carbohydrates_100g || 0) * (weightNum / 100),
          'Sugars (g)': (product.nutriments.sugars_100g || 0) * (weightNum / 100),
          'Fat (g)': (product.nutriments.fat_100g || 0) * (weightNum / 100),
          'Saturated Fat (g)': (product.nutriments['saturated-fat_100g'] || 0) * (weightNum / 100),
          'Salt (g)': (product.nutriments.salt_100g || 0) * (weightNum / 100),
          'Fiber (g)': (product.nutriments.fiber_100g || 0) * (weightNum / 100)
        },
        healthInfo: {
          nutriscore: product.nutriscore_grade || 'unknown',
          novaGroup: product.nova_group || null,
          ingredients: product.ingredients_text || '',
          allergens: product.allergens_tags || [],
          isVegetarian: product.ingredients_analysis_tags?.includes('en:vegan') || false,
          additives: product.additives_tags || []
        },
        environmentalImpact: {
          score: product.ecoscore_grade || 'not-applicable',
          co2Emissions: product.carbon_footprint_100g || null
        },
        packaging: {
          materials: product.packaging_tags ? product.packaging_tags.join(', ') : ''
        }
      }
    }

    res.status(200).json(productInfo)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to fetch product information',
      details: error.message 
    })
  }
}
