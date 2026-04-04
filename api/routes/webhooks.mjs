import express from 'express';
import { webhookManager } from '../lib/webhooks.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';

const router = express.Router();

/**
 * Webhook Support (Subscription Layer)
 */

router.post('/subscribe', validateFirestoreKey(5, { requireBeta: true }), async (req, res) => {
    const { url, events } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing callback URL' });
    
    try {
        const sub = await webhookManager.subscribe(req.user.email, url, events);
        res.json({
            status: 200,
            message: 'Webhook registered successfully',
            subscription_id: sub.id,
            active_events: events || ['*']
        });
    } catch(err) {
        res.status(500).json({ error: 'Failed to register webhook' });
    }
});

router.get('/events', async (req, res) => {
    // List available events to subscribe to
    res.json({
        available_events: ['shop.rotate', 'aes.rotate', 'news.update', 'replay.complete']
    });
});

export default router;
