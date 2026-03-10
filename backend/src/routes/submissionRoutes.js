/**
 * Submission Routes
 * Define submission-related endpoints
 */

import express from 'express';
import * as submissionController from '../controllers/submissionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Submit assignment
 * POST /api/submissions
 * Protected route - requires authentication and student role
 */
router.post('/', verifyToken, submissionController.submitAssignment);

/**
 * Get submissions for an assignment
 * GET /api/submissions/assignment/:assignmentId
 * Protected route - requires authentication and trainer role
 */
router.get('/assignment/:assignmentId', verifyToken, submissionController.getSubmissionsByAssignment);

/**
 * Get student's own submissions
 * GET /api/submissions/my
 * Protected route - requires authentication
 */
router.get('/my', verifyToken, submissionController.getMySubmissions);

export default router;
