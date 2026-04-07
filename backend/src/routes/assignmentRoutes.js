/**
 * Assignment Routes
 * Define assignment-related endpoints
 */

import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * Create assignment
 * POST /api/assignments
 * Protected route - requires authentication and trainer role
 */
router.post('/', verifyToken, assignmentController.createAssignment);

/**
 * Update assignment
 * PUT /api/assignments/:id
 * Protected route - requires authentication and trainer role
 */
router.put('/:id', verifyToken, authorizeRoles('trainer'), assignmentController.updateAssignment);

/**
 * Delete assignment
 * DELETE /api/assignments/:id
 */
router.delete('/:id', verifyToken, authorizeRoles('trainer'), assignmentController.deleteAssignment);

/**
 * Get assignments for a course
 * GET /api/assignments/course/:courseId
 * Public route - anyone can view course assignments
 */
router.get('/course/:courseId', assignmentController.getAssignmentsByCourse);

/**
 * Get assignments for a course offering
 * GET /api/assignments/course-offering/:offeringId
 * Public route - anyone can view course offering assignments
 */
router.get('/course-offering/:offeringId', assignmentController.getAssignmentsByOffering);

export default router;
