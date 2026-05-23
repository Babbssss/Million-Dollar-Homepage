const { createClient } = require('@supabase/supabase-js');
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
 
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  try {
    const { data, error } = await supabase
      .from('pixel_purchases')
      .select('*')
      .order('created_at', { ascending: true });
 
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
 
    res.status(200).json({ purchases: data });
  } catch (err) {
    console.error('Error loading purchases:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
 
