import jwt from 'jsonwebtoken';
import { db } from '../lib/db.mjs';

const TEST_KEY = 'rs_test_key_do_not_use_in_production';

export const validateApiKey = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: true,
            code: 'INVALID_KEY',
            message: 'Invalid or missing API key'
        });
    }

    const token = authHeader?.split(' ')[1] || req.headers['x-admin-token'];
    
    // Check for admin token first (from env)
    if (token === process.env.ADMIN_TOKEN) {
        req.user = { id: 'admin', role: 'admin' };
        return next();
    }

    // CHECK TEST KEY
    if (token === TEST_KEY) {
        req.user = {
            id: 'test_user',
            credits: 99999,
            key_id: TEST_KEY,
            email: 'test@pathgen.dev'
        };
        return next();
    }

    try {
        // In a real implementation we lookup the key in the DB
        // But for testing if we don't have DB, we only rely on TEST_KEY or ADMIN_TOKEN
        if (!db.pool) {
            return res.status(500).json({ error: 'DB not available' });
        }
        
        const keyResult = await db.query('SELECT * FROM api_keys WHERE key_id = $1', [token]);
        if (keyResult.rows.length === 0) {
            return res.status(401).json({
                error: true,
                code: 'INVALID_KEY',
                message: 'Invalid or missing API key'
            });
        }

        req.user = keyResult.rows[0];
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            error: true,
            code: 'FORBIDDEN',
            message: 'Admin access required'
        });
    }
};
