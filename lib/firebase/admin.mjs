import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let adminDb;

if (!admin.apps.length) {
    try {
        // Prefer service account JSON for production
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Or use direct env variables, useful for local dev or simple setups
            admin.initializeApp();
        }
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase initialization error', error);
    }
}

adminDb = admin.firestore();

export { adminDb, admin };
