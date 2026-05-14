const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
 
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const { pixels, name, url } = req.body;
 
  // Validate pixels
  if (!pixels || typeof pixels !== 'number' || pixels < 10 || pixels > 1000000) {
    return res.status(400).json({ error: 'Invalid pixel count' });
  }
 
  // Price in cents ($1 per pixel, so pixels * 100 cents)
  const amount = Math.round(pixels) * 100;
 
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pixels.toLocaleString()} pixels — Million Dollar Homepage 2.0`,
              description: name ? `Buyer: ${name}${url ? ' · ' + url : ''}` : undefined,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true&pixels=${pixels}&name=${encodeURIComponent(name || '')}`,
      cancel_url: `${req.headers.origin}/?cancelled=true`,
      metadata: {
        pixels: pixels.toString(),
        buyer_name: name || '',
        buyer_url: url || '',
      },
    });
 
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Payment session failed' });
  }
}
