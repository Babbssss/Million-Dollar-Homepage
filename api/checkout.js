
Copy

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
 
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  try {
    const { pixels, name, url } = req.body;
 
    if (!pixels || typeof pixels !== 'number' || pixels < 10) {
      return res.status(400).json({ error: 'Invalid pixel count' });
    }
 
    const amount = Math.round(pixels) * 100;
 
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pixels.toLocaleString()} pixels — The Million Dollar Homepage 2`,
              description: name ? `Buyer: ${name}${url ? ' · ' + url : ''}` : 'Pixel purchase',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?cancelled=true`,
      metadata: {
        pixels: pixels.toString(),
        buyer_name: name || 'Anonymous',
        buyer_url: url || '',
      },
    });
 
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Payment session failed' });
  }
}
