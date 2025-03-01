import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseServer } from '../../../utils/supabaseServer';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get last week's date
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get user's product history from the last week
    const { data: productHistory, error: historyError } = await supabaseServer
      .from('product_history')
      .select('*')
      .eq('user_id', user_id)
      .gte('scanned_at', lastWeek.toISOString())
      .order('scanned_at', { ascending: false });

    if (historyError) {
      console.error('History Error:', historyError);
      throw historyError;
    }

    if (!productHistory || productHistory.length === 0) {
      return res.status(400).json({ error: 'No product history found for user in the last week' });
    }

    // Group products by name to identify repeated purchases
    const productGroups = productHistory.reduce((acc, product) => {
      if (!acc[product.product_name]) {
        acc[product.product_name] = [];
      }
      acc[product.product_name].push(product);
      return acc;
    }, {});

    // Analyze price variations for repeated purchases
    const priceVariations = Object.entries(productGroups).reduce((acc, [name, products]) => {
      if (products.length > 1) {
        const prices = products.map(p => p.price);
        acc[name] = {
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
        };
      }
      return acc;
    }, {});

    // Analyze nutritional data
    const nutritionalAnalysis = productHistory.reduce((acc, product) => {
      if (product.nutrients) {
        Object.entries(product.nutrients).forEach(([nutrient, value]) => {
          if (!acc[nutrient]) acc[nutrient] = [];
          acc[nutrient].push(value);
        });
      }
      return acc;
    }, {});

    // Calculate averages for each nutrient
    const nutrientAverages = {};
    Object.entries(nutritionalAnalysis).forEach(([nutrient, values]) => {
      const sum = values.reduce((a, b) => a + b, 0);
      nutrientAverages[nutrient] = (sum / values.length).toFixed(2);
    });

    // Analyze spending patterns
    const totalSpent = productHistory.reduce((sum, item) => sum + (item.price || 0), 0);
    const averageSpent = totalSpent / productHistory.length;
    const recentSpending = productHistory.slice(0, 5).reduce((sum, item) => sum + (item.price || 0), 0);
    
    // Analyze nutriscores
    const nutriScores = productHistory.map(item => item.nutriscore?.toLowerCase()).filter(Boolean);
    const nutriScoreCount = nutriScores.reduce((acc, score) => {
      acc[score] = (acc[score] || 0) + 1;
      return acc;
    }, {});

    // Create a structured prompt for Gemini
    const prompt = `Analyze this user's shopping history from the last week and provide three insightful, friendly, and actionable observations. Format your response as a JSON object with the following structure:

{
  "environmental_insight": "A friendly, constructive insight about their environmental impact based on product choices and packaging",
  "nutritional_insight": "A friendly, constructive insight about their nutritional habits based on nutriscores and nutrients",
  "spending_insight": "A friendly, constructive insight about their spending patterns and potential savings"
}

User's Last Week Shopping Analysis:
- Total items scanned: ${productHistory.length}
- Total spent this week: £${totalSpent.toFixed(2)}
- Average spent per item: £${averageSpent.toFixed(2)}
- Recent spending (last 5 items): £${recentSpending.toFixed(2)}
- Nutri-score distribution: ${JSON.stringify(nutriScoreCount)}
- Average nutrients per product: ${JSON.stringify(nutrientAverages)}
- Product list: ${productHistory.map(p => p.product_name).join(', ')}
- Price variations for repeated purchases: ${JSON.stringify(priceVariations)}

Please provide constructive insights that are:
1. Encouraging and positive in tone
2. Specific to the user's actual shopping patterns
3. Include actionable suggestions for improvement
4. Consider health, environmental, and financial aspects
5. Keep each insight to 1-2 clear sentences

For this specific case, note that:
1. If they're buying the same products repeatedly, suggest price comparison
2. If they're buying lots of bottled water, suggest environmental alternatives
3. Consider the nutritional variety in their shopping basket

Focus on patterns and trends from the last week, highlighting both positive behaviors and areas for potential improvement.`;

    // Get response from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const insights = JSON.parse(text);

    // Save insights to database
    const { error: insertError } = await supabaseServer
      .from('user_insights')
      .insert([{
        user_id,
        environmental_insight: insights.environmental_insight,
        nutritional_insight: insights.nutritional_insight,
        spending_insight: insights.spending_insight
      }]);

    if (insertError) throw insertError;

    return res.status(200).json({
      status: 'success',
      insights
    });

  } catch (error) {
    console.error('Error generating overview:', error);
    return res.status(500).json({
      status: 'error',
      error: 'Failed to generate overview',
      details: error.message
    });
  }
}
