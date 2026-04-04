/**
 * Epic Token Manager
 * Manages in-memory token cache and refreshes using Device Auth
 */

import { loginWithDeviceAuth } from './epic_auth.mjs';
import { adminDb } from './firebase/admin.mjs';

const tokenCache = new Map();

export async function getAccessTokenForUser(userId) {
    const cached = tokenCache.get(userId);
    if (cached && cached.expiresAt > Date.now() + 60000) {
        return cached.token;
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData?.epic_device_auth) return null;

    try {
        const tokenData = await loginWithDeviceAuth(userData.epic_device_auth);
        const { access_token, expires_in } = tokenData;
        tokenCache.set(userId, {
            token: access_token,
            expiresAt: Date.now() + (expires_in * 1000)
        });
        return access_token;
    } catch (err) {
        console.error(`[EpicAuth] Refresh failed for user ${userId}:`, err.message);
        return null;
    }
}
