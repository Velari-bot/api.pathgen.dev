import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db.mjs';
import { adminDb } from '../lib/firebase/admin.mjs';
import { postOpsAlert } from '../lib/monitor.mjs';
import { sendWelcomeEmail } from '../lib/email.mjs';

const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password, displayName = 'New Player' } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 1. Create SQL Auth Account
        await db.query('INSERT INTO accounts (email, password) VALUES ($1, $2)', [email, hashedPassword]);
        
        // 2. Create Firestore User Profile & Welcome Credits ($1.00 = 100 credits)
        await adminDb.collection('users').doc(email).set({
            email,
            display_name: displayName,
            credits: 100,
            created_at: new Date().toISOString(),
            email_alerts: true,
            email_coaching: true
        });

        // 3. Initialize Billing Doc
        await adminDb.collection('billing').doc(email).set({
            balance: 1.00, // 100 welcome credits
            tier: 'FREE'
        });

        // --- AUTOMATION TRIGGERS ---
        (async () => {
            // Welcome Email
            sendWelcomeEmail(email, displayName).catch(console.error);

            // Ops Notification
            await postOpsAlert({
                title: '👤 New User Registered',
                color: 0x4ade80,
                fields: [
                  { name: 'Display Name', value: displayName, inline: true },
                  { name: 'Email',        value: email.split('@')[0] + '@...', inline: true },
                  { name: 'Credits',      value: '100 (welcome grant)', inline: true }
                ],
                timestamp: new Date().toISOString()
            }).catch(console.error);
        })();

        res.status(201).json({ message: 'User registered successfully with 100 free credits' });
    } catch (err) {
        console.error('[Auth] Registration error:', err.message);
        res.status(500).json({ error: 'Registration failed — email may already be taken' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM accounts WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});

export default router;
