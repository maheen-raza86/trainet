import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Create assignment (with optional file attachment)
router.post('/', verifyToken, upload.single('file'), assignmentController.createAssignment);

// Update assignment
router.put('/:id', verifyToken, authorizeRoles('trainer'), assignmentController.updateAssignment);

// Delete assignment
router.delete('/:id', verifyToken, authorizeRoles('trainer'), assignmentController.deleteAssignment);

// Get assignments for a course
router.get('/course/:courseId', assignmentController.getAssignmentsByCourse);

// Get assignments for a course offering
router.get('/course-offering/:offeringId', assignmentController.getAssignmentsByOffering);

export default router;
