/**
 * Progress Routes
 */

import express from 'express';
import { getProgress } from '../controllers/progressController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// GET /api/progress/:offeringId — student only
router.get('/:offeringId', verifyToken, authorizeRoles('student'), getProgress);

export default router;
