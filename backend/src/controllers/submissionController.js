/**
 * Submission Controller
 * Handle submission-related HTTP requests
 */

import * as submissionService from '../services/submissionService.js';
import logger from '../utils/logger.js';

/**
 * Submit assignment
 * POST /api/submissions
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId, attachmentUrl } = req.body;
    const studentId = req.user.id;

    // Validate required fields
    if (!assignmentId || !attachmentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID and attachment URL are required',
        error: 'Validation Error',
      });
    }

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit assignments',
        error: 'Forbidden',
      });
    }

    const submission = await submissionService.submitAssignment({
      assignmentId,
      studentId,
      attachmentUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get submissions for an assignment
 * GET /api/submissions/assignment/:assignmentId
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getSubmissionsByAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const trainerId = req.user.id;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required',
        error: 'Validation Error',
      });
    }

    // Verify user is a trainer
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers can view assignment submissions',
        error: 'Forbidden',
      });
    }

    const submissions = await submissionService.getSubmissionsByAssignment(
      assignmentId,
      trainerId
    );

    res.status(200).json({
      success: true,
      message: 'Submissions retrieved successfully',
      data: {
        submissions,
        count: submissions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's own submissions
 * GET /api/submissions/my
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getMySubmissions = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const submissions = await submissionService.getStudentSubmissions(studentId);

    res.status(200).json({
      success: true,
      message: 'Your submissions retrieved successfully',
      data: {
        submissions,
        count: submissions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
