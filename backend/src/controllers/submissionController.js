/**
 * Submission Controller
 * Handle submission-related HTTP requests
 */

import * as submissionService from '../services/submissionService.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Submit assignment
 * POST /api/submissions
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.body;
    const studentId = req.user.id;
    const file = req.file;

    console.log('Submit assignment request:', { 
      assignmentId, 
      studentId, 
      userRole: req.user.role,
      userObject: req.user,
      file: file ? {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      } : null,
      body: req.body,
      hasFile: !!file
    });

    // Validate required fields
    if (!assignmentId) {
      console.log('Validation failed: Missing assignmentId');
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required',
        error: 'Validation Error',
      });
    }

    if (!file) {
      console.log('Validation failed: Missing file attachment');
      return res.status(400).json({
        success: false,
        message: 'File attachment is required',
        error: 'Validation Error',
      });
    }

    // Verify user is a student
    console.log('Checking user role:', req.user.role, 'Expected: student');
    if (req.user.role !== 'student') {
      console.log('Role check failed. User role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only students can submit assignments',
        error: 'Forbidden',
      });
    }

    // Create file URL (relative path for now)
    const fileUrl = `/uploads/${file.filename}`;

    const submission = await submissionService.submitAssignment({
      assignmentId,
      studentId,
      attachmentUrl: fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
    });

    console.log('Assignment submitted successfully:', submission);

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission,
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    
    // Handle specific error types
    if (error.message?.includes('Assignment not found')) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        error: 'Not Found',
      });
    }
    
    if (error.message?.includes('not enrolled')) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in the course to submit this assignment',
        error: 'Forbidden',
      });
    }
    
    if (error.message?.includes('already submitted')) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted this assignment',
        error: 'Conflict',
      });
    }
    
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
 * Grade submission
 * PUT /api/submissions/:id/grade
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;
    const trainerId = req.user.id;

    // Validate required fields
    if (grade === undefined || grade === null || !feedback) {
      throw new BadRequestError('Grade and feedback are required');
    }

    // Validate grade range
    if (grade < 0) {
      throw new BadRequestError('Grade must be at least 0');
    }
    if (grade > 100) {
      throw new BadRequestError('Grade must not exceed 100');
    }

    // Validate feedback length
    if (feedback.length < 10) {
      throw new BadRequestError('Feedback must be at least 10 characters');
    }

    const submission = await submissionService.gradeSubmission(id, trainerId, {
      grade,
      feedback,
    });

    logger.info(`Submission ${id} graded by trainer ${trainerId}`);

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: submission,
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

/**
 * Run AI evaluation on a submission
 * POST /api/submissions/:id/evaluate
 */
export const runAiEvaluation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;

    const submission = await submissionService.runAiEvaluation(id, trainerId);

    res.status(200).json({
      success: true,
      message: 'AI evaluation completed',
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};
