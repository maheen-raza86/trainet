/**
 * Submission Routes
 * Define submission-related endpoints
 */

import express from 'express';
import * as submissionController from '../controllers/submissionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * Submit assignment
 * POST /api/submissions
 * Protected route - requires authentication and student role
 * Accepts file upload
 */
router.post('/', verifyToken, upload.single('file'), submissionController.submitAssignment);

/**
 * Grade submission
 * PUT /api/submissions/:id/grade
 * Protected route - requires authentication and trainer role
 */
router.put('/:id/grade', verifyToken, authorizeRoles('trainer'), submissionController.gradeSubmission);

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

/**
 * Run AI evaluation on a submission
 * POST /api/submissions/:id/evaluate
 */
router.post('/:id/evaluate', verifyToken, authorizeRoles('trainer'), submissionController.runAiEvaluation);

export default router;
