/**
 * Epic Games OAuth Flow
 * Documented at: https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation
 */

const EPIC_TOKEN_URL = 'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token';
const EPIC_DEVICE_AUTH_URL = 'https://account-public-service-prod.ol.epicgames.com/account/api/public/account/{accountId}/deviceAuth';

// Use the credentials provided by the user
const CLIENT_ID = '3f69e56c7649492c8cc29f1af08a8a12';
const CLIENT_SECRET = 'b51ee9cb12234f50a69efa67ef53812e';

export async function getClientToken() {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res = await fetch(EPIC_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    if (!res.ok) throw new Error('Epic client token fetch failed');
    return res.json();
}

export async function exchangeAuthCode(authCode) {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res = await fetch(EPIC_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=authorization_code&code=${authCode}`
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Epic auth code exchange failed: ${err.errorMessage || err.error_description}`);
    }
    return res.json();
}

export async function createDeviceAuth(accountId, accessToken) {
    const url = EPIC_DEVICE_AUTH_URL.replace('{accountId}', accountId);
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('Device auth creation failed');
    return res.json();
}

export async function loginWithDeviceAuth(deviceAuth) {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const body = new URLSearchParams({
        grant_type: 'device_auth',
        account_id: deviceAuth.accountId,
        device_id: deviceAuth.deviceId,
        secret: deviceAuth.secret
    });
    const res = await fetch(EPIC_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });
    if (!res.ok) throw new Error('Device auth login failed');
    return res.json();
}

export async function refreshToken(refreshTokenValue) {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res = await fetch(EPIC_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${refreshTokenValue}`
    });
    if (!res.ok) throw new Error('Token refresh failed');
    return res.json();
}
