/**
 * AI Routes — /api/ai/*
 * Student-only: skill profile, recommendations, learning path
 */

import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { getSkillProfile, getRecommendations, getLearningPath } from '../controllers/aiController.js';

const router = express.Router();

const studentOnly = [verifyToken, authorizeRoles('student')];

router.get('/profile', ...studentOnly, getSkillProfile);
router.get('/recommendations', ...studentOnly, getRecommendations);
router.get('/learning-path', ...studentOnly, getLearningPath);

export default router;
