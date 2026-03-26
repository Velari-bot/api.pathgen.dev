import { adminDb } from './lib/firebase/admin.mjs';

async function check() {
    const email = 'benderaiden826@gmail.com';
    const doc = await adminDb.collection('billing').doc(email).get();
    if (doc.exists) {
        console.log(`Document for ${email}:`, doc.data());
    } else {
        console.log(`Document for ${email} NOT FOUND`);
    }
}

check();
