import express from 'express';
import { stripeLib, PACKS } from '../lib/stripe.mjs';
import { db } from '../lib/db.mjs';

const router = express.Router();

router.get('/history', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM billing.history WHERE user_id = $1 ORDER BY timestamp DESC', [req.user.id]);
        res.json({ transactions: result.rows });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch history' });
    }
});

router.post('/checkout', async (req, res) => {
    const { pack } = req.body;
    const priceId = PACKS[pack];
    if (!priceId) return res.status(400).json({ error: 'Invalid pack' });

    try {
        const session = await stripeLib.createCheckoutSession(req.user.id, priceId);
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: 'Stripe session creation failed' });
    }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripeLib.verifyWebhook(req.body, sig);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const amount = session.amount_total;
        
        // Credits logic
        let creditsToGrant = 0;
        if (amount === 499) creditsToGrant = 5000;
        else if (amount === 1999) creditsToGrant = 25000;
        else if (amount === 4999) creditsToGrant = 75000;

        try {
            await db.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [creditsToGrant, userId]);
            await db.query('INSERT INTO billing.history (user_id, amount, credits, type) VALUES ($1, $2, $3, $4)', [userId, amount / 100, creditsToGrant, 'purchase']);
            console.log(`Granted ${creditsToGrant} credits to user ${userId}`);
        } catch(err) {
            console.error('Error updating credits after successful purchase:', err);
        }
    }

    res.json({ received: true });
});

export default router;
