/**
 * Recruiter Routes
 * /api/recruiter/*
 */

import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  searchCandidates,
  getCandidateProfile,
  bookmarkCandidate,
  getBookmarks,
  sendMessage,
  getConversation,
  getInbox,
} from '../controllers/recruiterController.js';

const router = express.Router();

const recruiterOnly = [verifyToken, authorizeRoles('recruiter')];

router.get('/search', ...recruiterOnly, searchCandidates);
router.get('/candidate/:id', ...recruiterOnly, getCandidateProfile);
router.post('/bookmark', ...recruiterOnly, bookmarkCandidate);
router.get('/bookmarks', ...recruiterOnly, getBookmarks);
router.post('/message', verifyToken, sendMessage);
router.get('/messages/inbox', verifyToken, getInbox);
router.get('/messages/:userId', verifyToken, getConversation);

export default router;
