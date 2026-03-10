/**
 * Enrollment Routes
 * Define enrollment-related routes
 */

import express from 'express';
import { enrollInCourse, getMyEnrollments } from '../controllers/enrollmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/enrollments
 * Enroll in a course
 * Protected route - requires authentication
 * Only students can enroll
 */
router.post('/', verifyToken, enrollInCourse);

/**
 * GET /api/enrollments/my
 * Get my enrollments
 * Protected route - requires authentication
 */
router.get('/my', verifyToken, getMyEnrollments);

export default router;
