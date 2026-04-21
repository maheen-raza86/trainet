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
 * DISABLED — enrollment must go through QR token (SRDS requirement)
 * Returns 410 Gone with instructions to use QR flow
 */
router.post('/enroll', verifyToken, (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Direct enrollment is disabled. Students must enroll via QR code. Use POST /api/enroll/qr with a valid token.',
    error: 'Gone',
  });
});

/**
 * Remove student from offering (trainer only)
 * DELETE /api/course-offerings/enrollment/:enrollmentId
 */
router.delete('/enrollment/:enrollmentId', verifyToken, authorizeRoles('trainer'), courseOfferingController.removeEnrollment);

/**
 * Drop a course offering (student only)
 * POST /api/course-offerings/:id/drop
 */
router.post('/:id/drop', verifyToken, authorizeRoles('student'), courseOfferingController.dropCourse);

/**
 * Delete course offering (trainer only)
 * DELETE /api/course-offerings/:id
 */
router.delete('/:id', verifyToken, authorizeRoles('trainer'), courseOfferingController.deleteOffering);

export default router;
