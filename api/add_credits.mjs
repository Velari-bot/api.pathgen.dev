import { adminDb } from './lib/firebase/admin.mjs';

async function addCredits() {
    const email = 'benderaiden826@gmail.com';
    await adminDb.collection('billing').doc(email).set({ balance: 100.00 }, { merge: true });
    console.log('Balance updated to 100.00');
}

addCredits();
