import express from 'express';
import { generateFullSpec } from '../lib/spec_generator.mjs';

const router = express.Router();

/**
 * Public OpenAPI Spec
 */
router.get('/', (req, res) => {
    res.json(generateFullSpec());
});

export default router;
