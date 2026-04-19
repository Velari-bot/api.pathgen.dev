import express from 'express';
import { stripeLib, PACKS } from '../lib/stripe.mjs';

import { adminDb } from '../lib/firebase/admin.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';


const router = express.Router();

router.get('/history', validateFirestoreKey(0), async (req, res) => {
    try {
        const historySnap = await adminDb.collection('activities')
            .where('email', '==', req.user.email)
            .where('action', '==', 'PURCHASE')
            .get();
        
        const transactions = historySnap.docs.map(doc => doc.data());
        res.json({ transactions });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch history' });
    }
});


router.post('/topup', validateFirestoreKey(0), async (req, res) => {
    // Alias for /checkout to match production spec
    const { pack } = req.body;
    const priceId = PACKS[pack];
    if (!priceId) return res.status(400).json({ error: 'Invalid pack' });

    try {
        const session = await stripeLib.createCheckoutSession(req.user.email, priceId);
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: 'Stripe session creation failed' });
    }
});

router.post('/checkout', validateFirestoreKey(0), async (req, res) => {
    const { pack } = req.body;
    const priceId = PACKS[pack];
    if (!priceId) return res.status(400).json({ error: 'Invalid pack' });

    try {
        const session = await stripeLib.createCheckoutSession(req.user.email, priceId);
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
        const email = session.customer_email || session.client_reference_id; // Assume client_ref is email for API
        const amountUsd = session.amount_total / 100;
        
        try {
            await adminDb.runTransaction(async (transaction) => {
                const billingRef = adminDb.collection('billing').doc(email);
                const billDoc = await transaction.get(billingRef);
                const currentBalance = billDoc.exists ? (billDoc.data().balance || 0) : 0;
                
                transaction.set(billingRef, { balance: currentBalance + amountUsd }, { merge: true });
                
                const actRef = adminDb.collection('activities').doc();
                transaction.set(actRef, {
                    email,
                    action: 'PURCHASE',
                    amount: amountUsd,
                    credits: amountUsd * 100,
                    status: 'success',
                    timestamp: new Date()
                });
            });
            console.log(`Granted $${amountUsd} to user ${email}`);
        } catch(err) {
            console.error('Error updating credits after successful purchase:', err);
        }

    }

    res.json({ received: true });
});

export default router;
