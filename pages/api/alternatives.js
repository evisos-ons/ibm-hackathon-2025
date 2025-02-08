export default async function handler(req, res) {
  const { category, nutriscore } = req.query;

  try {
    // Base URL for the Open Food Facts API
    let url = 'https://world.openfoodfacts.org/api/v2/search';
    
    // Build query parameters
    const params = new URLSearchParams({
      fields: 'code,product_name,brands,nutriscore_grade,image_front_url,categories_tags',
      page_size: '6', // Limit results
      sort_by: 'unique_scans_n', // Sort by popularity
    });

    // Add category filter if provided
    if (category) {
      params.append('categories_tags', category);
    }
    
    // Add nutriscore filter if provided (show same or better)
    if (nutriscore) {
      const nutriscores = ['a', 'b', 'c', 'd', 'e'];
      const currentIndex = nutriscores.indexOf(nutriscore.toLowerCase());
      if (currentIndex !== -1) {
        const betterScores = nutriscores.slice(0, currentIndex + 1);
        params.append('nutriscore_grade', betterScores.join('|'));
      }
    }

    // Make the API request
    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Format the response
    const alternatives = data.products.map(product => ({
      barcode: product.code,
      name: product.product_name,
      brand: product.brands,
      nutriscore: product.nutriscore_grade,
      image: product.image_front_url,
      categories: product.categories_tags
    }));

    res.status(200).json({
      status: 'success',
      count: alternatives.length,
      alternatives
    });

  } catch (error) {
    console.error('Error fetching alternatives:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch alternative products',
      details: error.message
    });
  }
} 