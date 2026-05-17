import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { requireApprovedTrainer } from '../middleware/trainerMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Create assignment (with optional file attachment) — approved trainers only
router.post(
  '/',
  verifyToken,
  authorizeRoles('trainer'),
  requireApprovedTrainer,
  upload.single('file'),
  assignmentController.createAssignment
);

// Update assignment — approved trainers only
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('trainer'),
  requireApprovedTrainer,
  assignmentController.updateAssignment
);

// Delete assignment — trainers only (approved trainers only)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('trainer'),
  requireApprovedTrainer,
  assignmentController.deleteAssignment
);

// Get assignments for a course — requires authentication
// Trainers see all; students see only started assignments (start_time enforcement)
router.get(
  '/course/:courseId',
  verifyToken,
  assignmentController.getAssignmentsByCourse
);

// Get assignments for a course offering — requires authentication
// Trainers see all; students see only started assignments (start_time enforcement)
router.get(
  '/course-offering/:offeringId',
  verifyToken,
  assignmentController.getAssignmentsByOffering
);

export default router;
