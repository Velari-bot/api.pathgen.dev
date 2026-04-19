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

export const validateFirestoreKey = (creditCost = 1, options = { requireBeta: false, requireAdmin: false }) => {
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
            if (!adminDb) throw new Error("Firestore Admin not initialized");

            const result = await adminDb.runTransaction(async (transaction) => {
                const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
                let keyRef = adminDb.collection('api_keys').doc(hashedKey);
                let keyDoc = await transaction.get(keyRef);
                
                if (!keyDoc.exists) {
                    const legacyRef = adminDb.collection('api_keys').doc(apiKey);
                    const legacyDoc = await transaction.get(legacyRef);
                    if (legacyDoc.exists) {
                        keyRef = legacyRef;
                        keyDoc = legacyDoc;
                    }
                }

                if (!keyDoc.exists) {
                    throw new Error("Invalid Key");
                }

                const keyData = keyDoc.data();
                const { email, orgId, appId, betaAccess, tier } = keyData;

                if (options.requireAdmin && tier !== 'ADMIN') {
                    throw new Error("Admin Required");
                }

                if (options.requireBeta && tier !== 'PRO' && tier !== 'ADMIN' && !betaAccess) {
                    throw new Error("Upgrade Required");
                }

                let actualCreditCost = creditCost;
                let actualUsdCost = usdCost;

                if (tier === 'PRO' && actualCreditCost > 2) {
                    // 25% discount for PRO tier on high-cost endpoints
                    actualCreditCost = Math.ceil(actualCreditCost * 0.75); 
                    actualUsdCost = actualCreditCost / 100;
                }

                if (actualCreditCost > 0) {
                    const billingRef = adminDb.collection('billing').doc(email);
                    const billDoc = await transaction.get(billingRef);
                    const balance = billDoc.exists ? (billDoc.data().balance || 0) : 0;

                    if (balance < actualUsdCost) {
                        throw new Error("Insufficient Balance");
                    }

                    const newBalance = Math.max(0, balance - actualUsdCost);
                    transaction.update(billingRef, { balance: newBalance });
                }

                const latency = Date.now() - startTime;
                const actRef = adminDb.collection('activities').doc();
                
                transaction.set(actRef, {
                    orgId,
                    email,
                    appId: appId || 'external-gateway',
                    credits: actualCreditCost,
                    usdCost: actualUsdCost,
                    tier: tier || 'FREE',
                    action: req.method + ' ' + req.path,
                    target: req.path,
                    status: 'success',
                    latency: latency + 45,
                    timestamp: new Date()
                });

                transaction.update(keyRef, { lastUsed: new Date().toISOString() });

                const billingRef = adminDb.collection('billing').doc(email);
                const updatedBillDoc = await transaction.get(billingRef);
                const finalBalance = updatedBillDoc.exists ? (updatedBillDoc.data().balance || 0) : 0;

                return { email, orgId, appId, credits: Math.round(finalBalance * 100), tier: tier || 'FREE' };
            });

            req.user = result;
            next();
        } catch (err) {
            console.error('Firestore Auth Transaction Failed:', err.message);
            
            if (err.message === "Invalid Key") {
                return res.status(401).json({ error: true, code: 'INVALID_KEY', message: 'Invalid API key' });
            }
            if (err.message === "Admin Required") {
                return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Admin access required' });
            }
            if (err.message === "Upgrade Required") {
                return res.status(403).json({ error: true, code: 'UPGRADE_REQUIRED', message: 'Upgrade required' });
            }
            if (err.message === "Insufficient Balance") {
                return res.status(402).json({ error: true, code: 'INSUFFICIENT_CREDITS', message: 'Insufficient balance' });
            }

            return res.status(500).json({
                error: true,
                message: 'Authentication service unavailable'
            });
        }
    };
};
