/**
 * Progress Controller
 */

import * as progressService from '../services/progressService.js';

/**
 * GET /api/progress/:offeringId
 * Returns progress summary for the authenticated student in a course offering.
 */
export const getProgress = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { offeringId } = req.params;

    const progress = await progressService.getStudentProgress(studentId, offeringId);

    res.status(200).json({
      success: true,
      message: 'Progress retrieved successfully',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};
