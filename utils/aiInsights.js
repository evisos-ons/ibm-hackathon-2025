import { supabase } from './supabaseClient';

export async function saveAIInsight(userId, barcode, insightType, insightText, productName, productImage) {
  try {
    console.log('Saving AI insight:', {
      userId,
      productName,
      insightType
    });

    const { data, error } = await supabase
      .from('ai_insights')
      .insert([
        {
          user_id: userId,
          barcode,
          insight_type: insightType,
          insight_text: insightText,
          product_name: productName,
          product_image: productImage
        }
      ]);

    if (error) {
      console.error('Supabase error saving insight:', error);
      throw error;
    }
    console.log('Successfully saved insight:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error saving AI insight:', error);
    return { data: null, error };
  }
}

export async function getAIInsights(userId, type, limit = 10, offset = 0) {
  try {
    console.log('Fetching AI insights:', {
      userId,
      type,
      limit,
      offset
    });

    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by type if provided
    if (type) {
      query = query.eq('insight_type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error fetching insights:', error);
      throw error;
    }

    console.log('Successfully fetched insights:', data?.length);
    return { data, error: null, count };
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return { data: null, error };
  }
}
