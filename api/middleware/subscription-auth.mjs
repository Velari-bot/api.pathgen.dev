import jwt from 'jsonwebtoken';
import { adminDb } from '../lib/firebase/admin.mjs';

/**
 * Commercial Subscription Middleware
 * Validates a User Session (JWT) and checks for active subscription tiers
 * instead of simple credit balance.
 */
export const validateSubscription = (requiredTier = 'FREE') => {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: true,
                code: 'AUTH_REQUIRED',
                message: 'Please log in to access this feature'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            // 1. Verify User Session
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const email = decoded.email;

            if (!email) throw new Error("Invalid token payload");

            // 2. Fetch User Billing/Subscription State from Firestore
            const billingRef = adminDb.collection('billing').doc(email);
            const billDoc = await billingRef.get();

            if (!billDoc.exists) {
                return res.status(403).json({
                    error: true,
                    code: 'NO_BILLING_PROFILE',
                    message: 'User billing profile not found'
                });
            }

            const billingData = billDoc.data();
            const userTier = billingData.tier || 'FREE';

            // 3. Logic: Tier Hierarchy (FREE < MID < PRO < ADMIN)
            const tiers = { 'FREE': 0, 'MID': 1, 'PRO': 2, 'ADMIN': 3 };
            
            if (tiers[userTier] < tiers[requiredTier]) {
                return res.status(402).json({
                    error: true,
                    code: 'UPGRADE_REQUIRED',
                    message: `This feature requires a ${requiredTier} subscription`,
                    current_tier: userTier,
                    required_tier: requiredTier
                });
            }

            // 4. Metering (Optional for Subscriptions)
            // Even "Pro" users might have a monthly limit (e.g. 100 replays/mo)
            const monthlyUsage = billingData.monthly_usage || 0;
            const usageLimit = { 'FREE': 5, 'MID': 50, 'PRO': 500 }[userTier] || 0;

            if (monthlyUsage >= usageLimit && userTier !== 'ADMIN') {
                return res.status(429).json({
                    error: true,
                    code: 'USAGE_LIMIT_REACHED',
                    message: `You have reached your monthly limit of ${usageLimit} parses.`
                });
            }

            // 5. Update Usage Count Atomically
            await billingRef.update({
                monthly_usage: (monthlyUsage + 1),
                last_used: new Date().toISOString()
            });

            // Pass user data to next middleware
            req.user = { 
                email, 
                tier: userTier, 
                usage: monthlyUsage + 1,
                limit: usageLimit
            };
            
            next();

        } catch (err) {
            console.error('[SubAuth] Error:', err.message);
            return res.status(401).json({
                error: true,
                code: 'SESSION_EXPIRED',
                message: 'Your session has expired. Please log in again.'
            });
        }
    };
};
