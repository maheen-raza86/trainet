/**
 * Work & Practice Routes
 * SRDS FR-WP-1 through FR-WP-4
 */

import express from 'express';
import * as wpController from '../controllers/workPracticeController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ── Trainer routes ─────────────────────────────────────────────────────────

// Create task (with optional resource file)
router.post('/', verifyToken, authorizeRoles('trainer'), upload.single('resource'), wpController.createTask);

// Get trainer's own tasks
router.get('/trainer', verifyToken, authorizeRoles('trainer'), wpController.getTrainerTasks);

// Update task
router.put('/:id', verifyToken, authorizeRoles('trainer'), wpController.updateTask);

// Delete task
router.delete('/:id', verifyToken, authorizeRoles('trainer'), wpController.deleteTask);

// Get submissions for a task
router.get('/:taskId/submissions', verifyToken, authorizeRoles('trainer'), wpController.getSubmissionsByTask);

// Grade a submission
router.put('/submissions/:id/grade', verifyToken, authorizeRoles('trainer'), wpController.gradeSubmission);

// AI evaluate a submission (trainer-triggered)
router.post('/submissions/:id/evaluate', verifyToken, authorizeRoles('trainer'), wpController.runAiEvaluation);

// Finalize a submission (trainer override)
router.put('/submissions/:id/finalize', verifyToken, authorizeRoles('trainer'), wpController.finalizeSubmission);

// ── Student routes ─────────────────────────────────────────────────────────

// Get tasks visible to the student
router.get('/', verifyToken, authorizeRoles('student'), wpController.getStudentTasks);

// Get student's own submissions
router.get('/my-submissions', verifyToken, authorizeRoles('student'), wpController.getMySubmissions);

// Get a specific student submission by ID (student's own)
router.get('/my-submissions/:id', verifyToken, authorizeRoles('student'), wpController.getMySubmissionById);

// Submit a task (with optional file)
router.post('/:id/submit', verifyToken, authorizeRoles('student'), upload.single('file'), wpController.submitTask);

// ── Shared routes ──────────────────────────────────────────────────────────

// Get task by ID (authenticated)
router.get('/:id', verifyToken, wpController.getTaskById);

// Get submission by ID (student or trainer)
router.get('/submissions/:id', verifyToken, wpController.getSubmissionById);

export default router;
