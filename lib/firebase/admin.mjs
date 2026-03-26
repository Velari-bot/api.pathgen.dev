import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let adminDb;

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            let serviceAccount;
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                // Fix for escaped newlines in service account private key from env
                if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                }
            } catch (jsonError) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', jsonError.message);
                throw jsonError;
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
            console.log('Firebase Admin Initialized from Service Account');
        } else {
            admin.initializeApp();
            console.log('Firebase Admin Initialized from default credentials');
        }
    } catch (error) {
        console.error('CRITICAL: Firebase initialization error:', error.message);
        // Important: don't let it half-initialize
    }
}

try {
    adminDb = admin.firestore();
} catch (e) {
    console.error('Failed to initialize Firestore instance:', e.message);
}

export { adminDb, admin };
