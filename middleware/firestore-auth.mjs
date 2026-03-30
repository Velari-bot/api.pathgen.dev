import crypto from 'crypto';
import { adminDb } from '../lib/firebase/admin.mjs';

/**
 * Validates request using Firebase/Firestore and handles real-time billing.
 * 
 * Logic follows the Multi-Tenant Credit & Auth Schema:
 * 1. Authenticate with Bearer Token from api_keys collection.
 * 2. Perform atomic transaction:
 *    a. Fetch user billing by email.
 *    b. Calculate and deduct USD cost (100 credits = $1.00).
 *    c. Verify balance >= cost.
 *    d. Record activity history.
 */
/**
 * Internal utility to deduct credits from a user's account atomically
 */
export async function deductCredits(email, creditCost, action, target = '/') {
    const usdCost = creditCost / 100;
    const startTime = Date.now();

    try {
        const result = await adminDb.runTransaction(async (transaction) => {
            // 1. Credit Check & Atomic Deduction
            const billingRef = adminDb.collection('billing').doc(email);
            const billDoc = await transaction.get(billingRef);
            
            const balance = billDoc.exists ? (billDoc.data().balance || 0) : 0;

            if (balance < usdCost) {
                throw new Error("Insufficient Balance");
            }

            const newBalance = Math.max(0, balance - usdCost);
            transaction.update(billingRef, { balance: newBalance });

            // 2. Log Activity for Dashboard
            const latency = Date.now() - startTime;
            const actRef = adminDb.collection('activities').doc();
            
            transaction.set(actRef, {
                email,
                credits: creditCost,
                usdCost: usdCost,
                action: action,
                target: target,
                status: 'success',
                latency: latency + 15,
                timestamp: new Date()
            });

            return { newBalance };
        });
        return result;
    } catch (err) {
        throw err;
    }
}

export const validateFirestoreKey = (creditCost = 1, options = { requireBeta: false }) => {
    return async (req, res, next) => {
        let apiKey = req.query.key;
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.split(' ')[1];
        }

        if (!apiKey) {
            return res.status(401).json({
                error: true,
                code: 'INVALID_KEY',
                message: 'Invalid or missing API key'
            });
        }
        
        const usdCost = creditCost / 100;
        const startTime = Date.now();

            try {
                const result = await adminDb.runTransaction(async (transaction) => {
                    // 1. Identity Lookup
                    // We now hash the incoming key before document lookup to match our secure storage
                    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
                    let keyRef = adminDb.collection('api_keys').doc(hashedKey);
                    let keyDoc = await transaction.get(keyRef);
                    
                    // Fallback for Legacy (non-hashed) keys to prevent breaking existing users
                    if (!keyDoc.exists) {
                        const legacyRef = adminDb.collection('api_keys').doc(apiKey);
                        const legacyDoc = await transaction.get(legacyRef);
                        if (legacyDoc.exists) {
                            keyRef = legacyRef;
                            keyDoc = legacyDoc;
                            console.warn(`SECURITY WARNING: Legacy raw API key used by ${legacyDoc.data().email}. Please rotate.`);
                        }
                    }

                    if (!keyDoc.exists) {
                        throw new Error("Invalid Key");
                    }

                const keyData = keyDoc.data();
                const { email, orgId, appId, betaAccess, tier } = keyData;

                // 2. Beta & Tier Access Check
                if (options.requireBeta && tier !== 'PRO' && !betaAccess) {
                    throw new Error("Upgrade Required");
                }

                // 3. Conditional Credit Deduction (only if cost > 0)
                if (creditCost > 0) {
                    const billingRef = adminDb.collection('billing').doc(email);
                    const billDoc = await transaction.get(billingRef);
                    const balance = billDoc.exists ? (billDoc.data().balance || 0) : 0;

                    if (balance < usdCost) {
                        throw new Error("Insufficient Balance");
                    }

                    const newBalance = Math.max(0, balance - usdCost);
                    transaction.update(billingRef, { balance: newBalance });
                }

                // 3. Log Activity for Dashboard
                const latency = Date.now() - startTime;
                const actRef = adminDb.collection('activities').doc();
                
                transaction.set(actRef, {
                    orgId,
                    email,
                    appId: appId || 'external-gateway',
                    credits: creditCost,
                    usdCost: usdCost,
                    action: req.method + ' ' + req.path,
                    target: req.path,
                    status: 'success',
                    latency: latency + 45,
                    timestamp: new Date()
                });

                transaction.update(keyRef, { lastUsed: new Date().toISOString() });

                return { email, orgId, appId };
            });

            // Set user object for downstream handlers
            req.user = result;
            next();
        } catch (err) {
            console.error('Firestore Auth Transaction Failed:', err.message);
            
            if (err.message === "Invalid Key") {
                return res.status(401).json({
                    error: true,
                    code: 'INVALID_KEY',
                    message: 'Invalid API key'
                });
            }

            if (err.message === "Upgrade Required") {
                return res.status(403).json({
                    error: true,
                    code: 'UPGRADE_REQUIRED',
                    tier: 'FREE',
                    message: 'This feature (AI, Enhanced Replay, Webhooks) requires a PathGen PRO subscription. Upgrade at https://pathgen.dev/pricing'
                });
            }

            if (err.message === "Beta Access Required") {
                return res.status(403).json({
                    error: true,
                    code: 'BETA_ACCESS_REQUIRED',
                    message: 'This endpoint is currently in Closed Beta. Please request access at https://pathgen.dev/beta'
                });
            }

            if (err.message === "Insufficient Balance") {
                return res.status(402).json({
                    error: true,
                    code: 'INSUFFICIENT_CREDITS',
                    message: 'Please recharge your credits to continue.'
                });
            }

            return res.status(500).json({
                error: true,
                message: 'Authentication service unavailable'
            });
        }
    };
};
