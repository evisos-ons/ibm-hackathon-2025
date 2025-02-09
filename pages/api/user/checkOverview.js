import { supabaseServer } from '../../../utils/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get the latest insight
    const { data: latestInsight, error } = await supabaseServer
      .from('user_insights')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Insight Error:', error);
      throw error;
    }

    const now = new Date();
    const lastInsightTime = latestInsight?.[0]?.created_at ? new Date(latestInsight[0].created_at) : null;
    
    // Check if 12 hours have passed since the last insight
    const canRequestNewInsight = !lastInsightTime || 
      (now - lastInsightTime) > (12 * 60 * 60 * 1000); // 12 hours in milliseconds

    return res.status(200).json({
      canRequest: canRequestNewInsight,
      nextAvailableTime: lastInsightTime ? new Date(lastInsightTime.getTime() + (12 * 60 * 60 * 1000)) : null
    });

  } catch (error) {
    console.error('Error checking overview availability:', error);
    return res.status(500).json({ error: 'Failed to check overview availability' });
  }
}
