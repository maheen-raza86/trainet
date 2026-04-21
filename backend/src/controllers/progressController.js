/**
 * Progress Controller
 */

import * as progressService from '../services/progressService.js';

export const getProgress = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { offeringId } = req.params;
    const progress = await progressService.calculateCourseProgress(studentId, offeringId);
    res.status(200).json({ success: true, message: 'Progress retrieved successfully', data: progress });
  } catch (error) { next(error); }
};

export const getOfferingProgress = async (req, res, next) => {
  try {
    const { offeringId } = req.params;
    const students = await progressService.getOfferingProgress(offeringId);
    res.status(200).json({ success: true, message: 'Offering progress retrieved', data: { students, count: students.length } });
  } catch (error) { next(error); }
};

export const getWeeklyProgress = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { offeringId } = req.params;
    const weekly = await progressService.calculateWeeklyProgress(studentId, offeringId);
    res.status(200).json({ success: true, message: 'Weekly progress retrieved', data: weekly });
  } catch (error) { next(error); }
};
