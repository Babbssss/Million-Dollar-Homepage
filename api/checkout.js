const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
 
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  try {
    const body = req.body || {};
    const pixels = Number(body.pixels || 0);
    const name = body.name || 'Anonymous';
    const url = body.url || '';
    const color = body.color || '#378ADD';
    const grid_x = Number(body.grid_x ?? -1);
    const grid_y = Number(body.grid_y ?? -1);
    const grid_w = Number(body.grid_w ?? 0);
    const grid_h = Number(body.grid_h ?? 0);
 
    if (!pixels || pixels < 10) {
      return res.status(400).json({ error: 'Invalid pixel count: ' + pixels });
    }
 
    const amount = Math.round(pixels) * 100;
 
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pixels.toLocaleString()} pixels — The Million Dollar Homepage 2`,
            description: `Buyer: ${name}${url ? ' · ' + url : ''}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?cancelled=true`,
      metadata: {
        pixels: pixels.toString(),
        buyer_name: name,
        buyer_url: url,
        buyer_color: color,
        grid_x: grid_x.toString(),
        grid_y: grid_y.toString(),
        grid_w: grid_w.toString(),
        grid_h: grid_h.toString(),
      },
    });
 
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Payment session failed: ' + err.message });
  }
}
