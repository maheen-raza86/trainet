/**
 * Assignment Controller
 * Handle assignment-related HTTP requests
 */

import * as assignmentService from '../services/assignmentService.js';
import logger from '../utils/logger.js';

/**
 * Create assignment
 * POST /api/assignments
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { title, description, courseId, dueDate } = req.body;
    const trainerId = req.user.id;

    // Validate required fields
    if (!title || !description || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and courseId are required',
        error: 'Validation Error',
      });
    }

    // Verify user is a trainer
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers can create assignments',
        error: 'Forbidden',
      });
    }

    const assignment = await assignmentService.createAssignment({
      title,
      description,
      courseId,
      trainerId,
      dueDate,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignments for a course
 * GET /api/assignments/course/:courseId
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getAssignmentsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
        error: 'Validation Error',
      });
    }

    const assignments = await assignmentService.getAssignmentsByCourse(courseId);

    res.status(200).json({
      success: true,
      message: 'Assignments retrieved successfully',
      data: {
        assignments,
        count: assignments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
