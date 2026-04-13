/**
 * Alumni Routes
 * /api/alumni/*
 */

import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getAllAlumni,
  getAlumniById,
  getMyProfile,
  saveProfile,
  sendMentorshipRequest,
  getAlumniRequests,
  getStudentRequests,
  updateRequestStatus,
  sendMessage,
  getConversation,
  getInbox,
} from '../controllers/alumniController.js';

const router = express.Router();

// ── Public / authenticated ────────────────────────────────────────────────────
router.get('/', verifyToken, getAllAlumni);
router.get('/profile/me', verifyToken, authorizeRoles('alumni'), getMyProfile);
router.post('/profile', verifyToken, authorizeRoles('alumni'), saveProfile);
router.get('/:id', verifyToken, getAlumniById);

// ── Mentorship ────────────────────────────────────────────────────────────────
router.post('/mentorship/request', verifyToken, authorizeRoles('student'), sendMentorshipRequest);
router.get('/mentorship/alumni', verifyToken, authorizeRoles('alumni'), getAlumniRequests);
router.get('/mentorship/student', verifyToken, authorizeRoles('student'), getStudentRequests);
router.put('/mentorship/:id/status', verifyToken, authorizeRoles('alumni'), updateRequestStatus);

// ── Messages ──────────────────────────────────────────────────────────────────
router.post('/messages', verifyToken, sendMessage);
router.get('/messages/inbox', verifyToken, getInbox);
router.get('/messages/:userId', verifyToken, getConversation);

export default router;
