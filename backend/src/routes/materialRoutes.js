/**
 * Course Material Routes
 */

import express from 'express';
import * as materialController from '../controllers/materialController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Add material (trainer only, optional file upload)
router.post(
  '/',
  verifyToken,
  authorizeRoles('trainer'),
  upload.single('file'),
  materialController.addMaterial
);

// Get materials for an offering (authenticated)
router.get('/offering/:offeringId', verifyToken, materialController.getMaterialsByOffering);

// Get full offering detail with materials
router.get('/offering-detail/:offeringId', verifyToken, materialController.getOfferingDetail);

// Update live session link (trainer only)
router.put('/live-session/:offeringId', verifyToken, authorizeRoles('trainer'), materialController.updateLiveSession);

// Delete material (trainer only)
router.delete('/:id', verifyToken, authorizeRoles('trainer'), materialController.deleteMaterial);

export default router;
