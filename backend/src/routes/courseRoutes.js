/**
 * Course Routes
 * Define course-related endpoints
 */

import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * Get all courses (catalog)
 * GET /api/courses
 * Public route - no authentication required
 */
router.get('/', courseController.getAllCourses);

/**
 * Get course by ID
 * GET /api/courses/:id
 * Public route - no authentication required
 */
router.get('/:id', courseController.getCourseById);

/**
 * Enroll in course
 * POST /api/courses/enroll
 * Protected route - requires authentication
 */
router.post('/enroll', verifyToken, courseController.enrollInCourse);

/**
 * Get student's enrolled courses
 * GET /api/courses/my-courses
 * Protected route - requires authentication
 */
router.get('/my-courses', verifyToken, courseController.getMyEnrolledCourses);

/**
 * Create assignment for a course
 * POST /api/courses/:courseId/assignments
 * Protected route - requires trainer role
 */
router.post(
  '/:courseId/assignments',
  verifyToken,
  authorizeRoles('trainer'),
  courseController.createAssignment
);

/**
 * Submit assignment
 * POST /api/assignments/:assignmentId/submit
 * Protected route - requires student role
 */
router.post(
  '/assignments/:assignmentId/submit',
  verifyToken,
  authorizeRoles('student'),
  courseController.submitAssignment
);

export default router;
