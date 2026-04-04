/**
 * Epic OAuth & Connectivity Routes
 * Path: /v1/epic
 */

import express from 'express';
import { exchangeAuthCode, createDeviceAuth } from '../lib/epic_auth.mjs';
import { adminDb } from '../lib/firebase/admin.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';

const router = express.Router();

// POST /v1/epic/connect
// User sends an authorization code after authenticating with Epic
router.post('/connect', validateFirestoreKey(0), async (req, res) => {
    const { auth_code } = req.body;
    const userId = req.user.email; // Assuming email is our primary user identifier

    if (!auth_code) {
        return res.status(400).json({ error: true, code: 'MISSING_CODE', message: 'Auth code required' });
    }

    try {
        const tokenData = await exchangeAuthCode(auth_code);
        const { access_token, account_id, displayName } = tokenData;

        // Persistent Device Auth for long-lived access
        const deviceAuth = await createDeviceAuth(account_id, access_token);

        // Store against the authenticated user account
        await adminDb.collection('users').doc(userId).set({
            epic_account_id: account_id,
            epic_display_name: displayName,
            epic_device_auth: {
                accountId: deviceAuth.accountId,
                deviceId: deviceAuth.deviceId,
                secret: deviceAuth.secret
            },
            epic_connected_at: new Date().toISOString()
        }, { merge: true });

        res.json({
            success: true,
            epic_account_id: account_id,
            epic_display_name: displayName,
            message: 'Epic account connected successfully.'
        });

    } catch (err) {
        console.error('[Epic Connect Error]', err.message);
        res.status(500).json({ error: true, code: 'EPIC_CONNECT_FAILED', message: err.message });
    }
});

// GET /v1/epic/status
router.get('/status', validateFirestoreKey(0), async (req, res) => {
    try {
        const userDoc = await adminDb.collection('users').doc(req.user.email).get();
        const userData = userDoc.data();
        res.json({
            connected: !!userData?.epic_device_auth,
            epic_display_name: userData?.epic_display_name || null,
            epic_account_id: userData?.epic_account_id || null,
            connected_at: userData?.epic_connected_at || null
        });
    } catch (err) {
        res.status(500).json({ error: true, message: err.message });
    }
});

export default router;
