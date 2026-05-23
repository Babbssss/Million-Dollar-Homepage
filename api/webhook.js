const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
 
export const config = {
  api: { bodyParser: false },
};
 
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
 
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
 
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }
 
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata;
 
    try {
      const { error } = await supabase.from('pixel_purchases').insert({
        stripe_session_id: session.id,
        name: meta.buyer_name,
        url: meta.buyer_url,
        color: meta.buyer_color,
        pixels: parseInt(meta.pixels),
        grid_x: parseInt(meta.grid_x),
        grid_y: parseInt(meta.grid_y),
        grid_w: parseInt(meta.grid_w),
        grid_h: parseInt(meta.grid_h),
      });
 
      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Database error' });
      }
 
      console.log('Pixel purchase saved:', meta.buyer_name, meta.pixels, 'pixels');
    } catch (err) {
      console.error('Error saving purchase:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
 
  res.status(200).json({ received: true });
}
