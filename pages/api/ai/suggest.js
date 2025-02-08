import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// API handler for generating product suggestions using Gemini AI
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productInfo, price } = req.body;

    if (!productInfo) {
      return res.status(400).json({ error: 'Product information is required' });
    }

    // Create a structured prompt for Gemini
    const prompt = `Analyze this product and provide helpful suggestions in plain text (no markdown formatting). Format your response as a JSON object with the following structure:

{
  "recycling": "Clear instructions for recycling the packaging, written in plain text",
  "health": "Analysis of nutritional value and health implications, written in plain text",
  "alternatives": "2-3 healthier alternative products, written in plain text",
  "usage": "Best ways to use or consume this product, written in plain text",
  "environmental": "Environmental impact analysis, written in plain text"${price ? ',\n  "price": "Analysis of the price paid (£' + price + ') compared to typical market prices for similar products, including whether it appears to be good value"' : ''}
}

Product Information:
- Name: ${productInfo.productName}
- Brand: ${productInfo.brands}
- Nutrition Score: ${productInfo.healthInfo?.nutriscore || 'N/A'}
- NOVA Group: ${productInfo.healthInfo?.novaGroup || 'N/A'}
- Ingredients: ${productInfo.healthInfo?.ingredients || 'N/A'}
- Packaging: ${productInfo.packaging?.materials || 'N/A'}${price ? '\n- Price Paid: £' + price : ''}

Please provide detailed suggestions in each category. Keep each suggestion concise but informative.
Do not use any markdown formatting (no **, -, #, etc.). Use simple plain text with regular punctuation.
Remember to format the response as a valid JSON object with the exact keys specified above.`;

    // Get response from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(text);
      
      // Clean any remaining markdown from the response
      Object.keys(suggestions).forEach(key => {
        if (typeof suggestions[key] === 'string') {
          suggestions[key] = suggestions[key]
            .replace(/\*\*/g, '')  // Remove bold
            .replace(/\n\n/g, '\n') // Replace double newlines with single
            .replace(/^\s*[-•]\s*/gm, '') // Remove list markers
            .replace(/#{1,6}\s/g, '') // Remove headers
            .trim();
        }
      });

    } catch (error) {
      console.log('Failed to parse JSON response:', text);
      // If JSON parsing fails, use a more robust text extraction
      suggestions = {
        recycling: text.match(/recycling["']?\s*:\s*["']([^"']*)["']/i)?.[1] || 
                  text.match(/Recycling Instructions:?(.*?)(?=Health Analysis:|$)/s)?.[1]?.trim() || '',
        
        health: text.match(/health["']?\s*:\s*["']([^"']*)["']/i)?.[1] || 
                text.match(/Health Analysis:?(.*?)(?=Alternative Suggestions:|$)/s)?.[1]?.trim() || '',
        
        alternatives: text.match(/alternatives["']?\s*:\s*["']([^"']*)["']/i)?.[1] || 
                     text.match(/Alternative Suggestions:?(.*?)(?=Usage Tips:|$)/s)?.[1]?.trim() || '',
        
        usage: text.match(/usage["']?\s*:\s*["']([^"']*)["']/i)?.[1] || 
               text.match(/Usage Tips:?(.*?)(?=Environmental Impact:|$)/s)?.[1]?.trim() || '',
        
        environmental: text.match(/environmental["']?\s*:\s*["']([^"']*)["']/i)?.[1] || 
                      text.match(/Environmental Impact:?(.*?)(?=Price Analysis:|$)/s)?.[1]?.trim() || '',
        
        price: price ? (text.match(/price["']?\s*:\s*["']([^"']*)["']/i)?.[1] || 
                text.match(/Price Analysis:?(.*?)$/s)?.[1]?.trim() || '') : undefined
      };

      // Clean any markdown from extracted text
      Object.keys(suggestions).forEach(key => {
        if (typeof suggestions[key] === 'string') {
          suggestions[key] = suggestions[key]
            .replace(/\*\*/g, '')
            .replace(/\n\n/g, '\n')
            .replace(/^\s*[-•]\s*/gm, '')
            .replace(/#{1,6}\s/g, '')
            .trim();
        }
      });
    }

    // Validate that we have at least some content
    if (Object.values(suggestions).every(v => !v)) {
      throw new Error('Failed to generate meaningful suggestions');
    }

    return res.status(200).json({
      status: 'success',
      suggestions
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({
      status: 'error',
      error: 'Failed to generate suggestions',
      details: error.message
    });
  }
}
