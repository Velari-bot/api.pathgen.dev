import { adminDb } from './firebase/admin.mjs';

/**
 * PathGen Webhook Automation Hub
 * Manages developer subscriptions and real-time event dispatching.
 */

export const webhookManager = {
    /**
     * Subscribe a URL to specific events
     */
    async subscribe(email, url, events = ['*']) {
        const subRef = adminDb.collection('webhook_subscriptions').doc();
        await subRef.set({
            email,
            url,
            events, // ['shop.rotate', 'aes.rotate', 'replay.complete']
            active: true,
            created_at: new Date()
        });
        return { success: true, id: subRef.id };
    },

    /**
     * Dispatch an event to all interested subscribers
     */
    async fireEvent(eventType, payload) {
        console.log(`[Webhook Fire] Event: ${eventType}`);
        
        try {
            const snapshot = await adminDb.collection('webhook_subscriptions')
                .where('active', '==', true)
                .get();

            const tasks = snapshot.docs.map(doc => {
                const sub = doc.data();
                if (sub.events.includes('*') || sub.events.includes(eventType)) {
                    return this.dispatch(sub.url, eventType, payload);
                }
                return null;
            }).filter(t => t !== null);

            await Promise.allSettled(tasks);
        } catch (err) {
            console.error('[Webhook Bus Error]:', err.message);
        }
    },

    /**
     * Send HTTP POST to the developer's endpoint
     */
    async dispatch(url, type, data) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'PathGen-Webhooks/1.0'
                },
                body: JSON.stringify({
                    event: type,
                    timestamp: new Date().toISOString(),
                    data
                }),
                signal: AbortSignal.timeout(5000)
            });
            return res.ok;
        } catch (err) {
            console.error(`[Webhook Failed] ${url}: ${err.message}`);
            return false;
        }
    }
};
