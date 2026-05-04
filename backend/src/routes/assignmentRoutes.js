import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { requireApprovedTrainer } from '../middleware/trainerMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Create assignment (with optional file attachment) — approved trainers only
router.post('/', verifyToken, authorizeRoles('trainer'), requireApprovedTrainer, upload.single('file'), assignmentController.createAssignment);

// Update assignment — approved trainers only
router.put('/:id', verifyToken, authorizeRoles('trainer'), requireApprovedTrainer, assignmentController.updateAssignment);

// Delete assignment
router.delete('/:id', verifyToken, authorizeRoles('trainer'), assignmentController.deleteAssignment);

// Get assignments for a course
router.get('/course/:courseId', assignmentController.getAssignmentsByCourse);

// Get assignments for a course offering
router.get('/course-offering/:offeringId', assignmentController.getAssignmentsByOffering);

export default router;
