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

router.post('/', verifyToken, upload.single('file'), submissionController.submitAssignment);
router.put('/:id/grade', verifyToken, authorizeRoles('trainer'), submissionController.gradeSubmission);
router.put('/:id/finalize', verifyToken, authorizeRoles('trainer'), submissionController.finalizeSubmission);
router.get('/assignment/:assignmentId', verifyToken, submissionController.getSubmissionsByAssignment);
router.get('/my', verifyToken, submissionController.getMySubmissions);
router.get('/:id', verifyToken, submissionController.getSubmissionById);
router.post('/:id/evaluate', verifyToken, authorizeRoles('trainer'), submissionController.runAiEvaluation);

export default router;
