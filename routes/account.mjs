import express from 'express';
import crypto from 'crypto';
import { adminDb } from '../lib/firebase/admin.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';
import { getPlayerStats, fortniteLib } from '../fortnite_api.mjs';


const router = express.Router();

router.get('/balance', validateFirestoreKey(0), async (req, res) => {
    try {
        const billingRef = adminDb.collection('billing').doc(req.user.email);
        const billDoc = await billingRef.get();
        if (!billDoc.exists) return res.status(404).json({ error: 'Billing profile not found' });
        res.json({ balance: billDoc.data().balance });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch balance' });
    }
});


router.get('/keys', validateFirestoreKey(0), async (req, res) => {
    try {
        const keysSnap = await adminDb.collection('api_keys')
            .where('email', '==', req.user.email)
            .get();
        
        const keys = keysSnap.docs.map(doc => ({
            key_id: doc.id,
            name: doc.data().name,
            last4: doc.data().last4 || '****',
            created_at: doc.data().created_at,
            lastUsed: doc.data().lastUsed
        }));
        res.json({ keys });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch keys' });
    }
});


router.post('/keys', validateFirestoreKey(0), async (req, res) => {
    const { name, appId } = req.body;
    
    // 1. Generate raw 32-character secure key
    const rawKey = `rs_${crypto.randomBytes(16).toString('hex')}`;
    const last4 = rawKey.slice(-4);
    
    // 2. Hash the key for storage (using SHA-256 for lookup index)
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    try {
        const keysSnap = await adminDb.collection('api_keys')
            .where('email', '==', req.user.email)
            .get();
        if (keysSnap.size >= 5) {
            return res.status(403).json({ error: 'Key limit reached. Maximum 5 keys per account.' });
        }

        const keyMetadata = {
            email: req.user.email,
            orgId: req.user.orgId || 'personal',
            appId: appId || 'default-app',
            name: name || 'New API Key',
            last4: last4,
            created_at: new Date().toISOString(),
            lastUsed: null
        };

        // We store by the HASH so we can look it up instantly during auth, 
        // but no one viewing the DB can see the original key.
        await adminDb.collection('api_keys').doc(hashedKey).set(keyMetadata);

        // ONLY return the rawKey once!
        res.status(201).json({ 
            key: rawKey,
            last4: last4,
            ...keyMetadata 
        });
    } catch(err) {
        console.error('Error creating API key:', err);
        res.status(500).json({ error: 'Could not create key' });
    }
});


router.delete('/keys/:keyId', validateFirestoreKey(0), async (req, res) => {
    try {
        const keyRef = adminDb.collection('api_keys').doc(req.params.keyId);
        const keyDoc = await keyRef.get();
        if (!keyDoc.exists || keyDoc.data().email !== req.user.email) {
            return res.status(403).json({ error: 'Unauthorised or key not found' });
        }
        await keyRef.delete();
        res.json({ message: 'Key deleted' });
    } catch(err) {
        res.status(500).json({ error: 'Could not delete key' });
    }
});


// USAGE
router.get('/usage', validateFirestoreKey(0), async (req, res) => {
    try {
        const usageSnap = await adminDb.collection('activities')
            .where('email', '==', req.user.email)
            .get();
        res.json({ total_requests: usageSnap.size });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch usage' });
    }
});


router.get('/usage/daily', async (req, res) => {
    // Placeholder for real time-series data from DB
    res.json({
        "2026-03-23": 1502,
        "2026-03-24": 1840,
        "2026-03-25": 1201
    });
});

export default router;

