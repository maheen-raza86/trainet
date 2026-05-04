/**
 * Trainer Application Routes
 * Trainer submits application; trainer checks own status.
 */

import express from 'express';
import * as ctrl from '../controllers/trainerApplicationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// POST /api/trainer-application — submit application (trainer only)
// Optional CV file upload
router.post(
  '/',
  verifyToken,
  authorizeRoles('trainer'),
  upload.single('cv'),
  ctrl.submitApplication
);

// GET /api/trainer-application/status — get own status (trainer only)
router.get(
  '/status',
  verifyToken,
  authorizeRoles('trainer'),
  ctrl.getMyStatus
);

export default router;
