import express from 'express';
import { generateFullSpec } from '../lib/spec_generator.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';

const router = express.Router();

/**
 * Public OpenAPI Spec
 */
router.get('/', validateFirestoreKey(0), (req, res) => {
    res.json(generateFullSpec());
});

export default router;
