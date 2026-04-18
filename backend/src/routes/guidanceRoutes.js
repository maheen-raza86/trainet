/**
 * Guidance Routes
 */

import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  createGuidanceRequest,
  getStudentRequests,
  getAlumniRequests,
  cancelGuidanceRequest,
  respondToRequest,
  createSession,
  getStudentSessions,
  getAlumniSessions,
  getSessionById,
  updateSession,
  uploadMaterialHandler,
  getMaterials,
  submitFeedback,
  getFeedback,
} from '../controllers/guidanceController.js';

const router = express.Router();

// ── Guidance Requests ─────────────────────────────────────────────────────────

router.post('/request', verifyToken, authorizeRoles('student'), createGuidanceRequest);
router.get('/student', verifyToken, authorizeRoles('student', 'admin'), getStudentRequests);
router.get('/alumni', verifyToken, authorizeRoles('alumni', 'admin'), getAlumniRequests);
router.patch('/:id/cancel', verifyToken, authorizeRoles('student'), cancelGuidanceRequest);
router.put('/:id/respond', verifyToken, authorizeRoles('alumni'), respondToRequest);

// ── Mentorship Sessions ───────────────────────────────────────────────────────

router.post('/sessions', verifyToken, authorizeRoles('alumni'), createSession);
router.get('/sessions/student', verifyToken, authorizeRoles('student', 'admin'), getStudentSessions);
router.get('/sessions/alumni', verifyToken, authorizeRoles('alumni', 'admin'), getAlumniSessions);
router.get('/sessions/:id', verifyToken, authorizeRoles('student', 'alumni', 'admin'), getSessionById);
router.put('/sessions/:id', verifyToken, authorizeRoles('alumni'), updateSession);
// File upload: accepts multipart/form-data with optional 'file' field
router.post('/sessions/:id/materials', verifyToken, authorizeRoles('alumni'), upload.single('file'), uploadMaterialHandler);
router.get('/sessions/:id/materials', verifyToken, authorizeRoles('student', 'alumni', 'admin'), getMaterials);
router.post('/sessions/:id/feedback', verifyToken, authorizeRoles('student'), submitFeedback);
router.get('/sessions/:id/feedback', verifyToken, authorizeRoles('alumni', 'admin'), getFeedback);

export default router;
