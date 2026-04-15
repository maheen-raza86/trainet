/**
 * AI Controller — FR-AI-1, FR-AI-2
 */

import * as aiService from '../services/aiPersonalizationService.js';
import logger from '../utils/logger.js';

export const getSkillProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const profile = await aiService.getSkillProfile(studentId);
    res.status(200).json({ success: true, message: 'Skill profile retrieved', data: profile });
  } catch (err) { next(err); }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const data = await aiService.getRecommendations(studentId);
    res.status(200).json({ success: true, message: 'Recommendations retrieved', data });
  } catch (err) { next(err); }
};

export const getLearningPath = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const data = await aiService.getLearningPath(studentId);
    res.status(200).json({ success: true, message: 'Learning path retrieved', data });
  } catch (err) { next(err); }
};
