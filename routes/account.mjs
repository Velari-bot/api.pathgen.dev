import express from 'express';
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
            ...doc.data()
        }));
        res.json({ keys });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch keys' });
    }
});


router.post('/keys', validateFirestoreKey(0), async (req, res) => {
    const { name, appId } = req.body;
    const key = `rs_${Math.random().toString(36).substr(2, 10)}${Math.random().toString(36).substr(2, 10)}`;
    try {
        const keysSnap = await adminDb.collection('api_keys')
            .where('email', '==', req.user.email)
            .get();
        if (keysSnap.size >= 5) {
            return res.status(403).json({ error: 'Key limit reached. Maximum 5 keys per account.' });
        }

        const keyData = {
            email: req.user.email,
            orgId: req.user.orgId || 'personal',
            appId: appId || 'default-app',
            name: name || 'New API Key',
            created_at: new Date().toISOString(),
            lastUsed: null
        };
        await adminDb.collection('api_keys').doc(key).set(keyData);
        res.status(201).json({ key_id: key, ...keyData });
    } catch(err) {
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

