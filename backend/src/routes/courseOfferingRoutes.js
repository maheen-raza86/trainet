/**
 * Course Offering Routes
 * Define course offering-related endpoints
 */

import express from 'express';
import * as courseOfferingController from '../controllers/courseOfferingController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * Create course offering
 * POST /api/course-offerings
 * Protected route - requires trainer role
 */
router.post('/', verifyToken, authorizeRoles('trainer'), courseOfferingController.createCourseOffering);

/**
 * Get trainer's course offerings
 * GET /api/course-offerings/trainer
 * Protected route - requires trainer role
 */
router.get('/trainer', verifyToken, authorizeRoles('trainer'), courseOfferingController.getTrainerOfferings);

/**
 * Get available course offerings
 * GET /api/course-offerings/available
 * Public route - no authentication required
 */
router.get('/available', courseOfferingController.getAvailableOfferings);

/**
 * Update course offering
 * PUT /api/course-offerings/:id
 * Protected route - requires trainer role
 */
router.put('/:id', verifyToken, authorizeRoles('trainer'), courseOfferingController.updateCourseOffering);

/**
 * Enroll in course offering
 * POST /api/course-offerings/enroll
 * Protected route - requires authentication
 */
router.post('/enroll', verifyToken, courseOfferingController.enrollInOffering);

export default router;
