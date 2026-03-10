/**
 * Assignment Routes
 * Define assignment-related endpoints
 */

import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Create assignment
 * POST /api/assignments
 * Protected route - requires authentication and trainer role
 */
router.post('/', verifyToken, assignmentController.createAssignment);

/**
 * Get assignments for a course
 * GET /api/assignments/course/:courseId
 * Public route - anyone can view course assignments
 */
router.get('/course/:courseId', assignmentController.getAssignmentsByCourse);

export default router;
