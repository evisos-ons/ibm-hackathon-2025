import { supabase } from './supabaseClient';

export async function saveProductScan(userId, productData, price, portionPercentage = 100) {
  try {
    console.log('Saving product scan:', {
      userId,
      productName: productData.productName,
      price,
      portionPercentage
    });

    const { data, error } = await supabase
      .from('product_history')
      .insert([
        {
          user_id: userId,
          barcode: productData.barcode,
          product_name: productData.productName,
          brand: productData.brands,
          price: price,
          nutriscore: productData.healthInfo?.nutriscore || null,
          nova_group: productData.healthInfo?.novaGroup || null,
          image_url: productData.image || null,
          scanned_at: new Date().toISOString(),
          portion_percentage: portionPercentage,
          nutrients: productData.nutrients || null
        }
      ]);

    if (error) {
      console.error('Supabase error saving scan:', error);
      throw error;
    }
    console.log('Successfully saved scan:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error saving product scan:', error);
    return { data: null, error };
  }
}

export async function getUserScannedProducts(userId, limit = 10) {
  try {
    console.log('Fetching scanned products for user:', userId);
    const { data, error } = await supabase
      .from('product_history')
      .select('*')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error fetching scans:', error);
      throw error;
    }
    console.log('Fetched scans:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user scanned products:', error);
    return { data: null, error };
  }
}

export async function getUserStats(userId) {
  try {
    console.log('Calculating stats for user:', userId);
    // Get total number of scans
    const { data: scanCount, error: scanError } = await supabase
      .from('product_history')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (scanError) {
      console.error('Error getting scan count:', scanError);
      throw scanError;
    }

    // Get average nutriscore
    const { data: nutriscores, error: nutriError } = await supabase
      .from('product_history')
      .select('nutriscore')
      .eq('user_id', userId)
      .not('nutriscore', 'is', null);

    if (nutriError) {
      console.error('Error getting nutriscores:', nutriError);
      throw nutriError;
    }

    // Calculate average health score
    const scoreMap = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
    const avgScore = nutriscores.reduce((acc, curr) => {
      return acc + (scoreMap[curr.nutriscore.toLowerCase()] || 0);
    }, 0) / (nutriscores.length || 1);

    // Convert numeric score back to letter grade
    const healthScore = avgScore >= 4.5 ? 'A+' :
                       avgScore >= 4 ? 'A' :
                       avgScore >= 3.5 ? 'B+' :
                       avgScore >= 3 ? 'B' :
                       avgScore >= 2.5 ? 'C+' :
                       avgScore >= 2 ? 'C' :
                       avgScore >= 1.5 ? 'D' : 'E';

    const stats = {
      totalScans: scanCount.length,
      healthScore,
    };
    console.log('Calculated stats:', stats);
    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { data: null, error };
  }
} 