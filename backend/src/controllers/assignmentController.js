/**
 * Assignment Controller
 * Handle assignment-related HTTP requests
 */

import * as assignmentService from '../services/assignmentService.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Create assignment
 * POST /api/assignments
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { title, description, courseOfferingId, dueDate } = req.body;
    const trainerId = req.user.id;

    // Validate required fields
    if (!title || !description || !courseOfferingId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and courseOfferingId are required',
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
      courseOfferingId,
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
 * Update assignment
 * PUT /api/assignments/:id
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;
    const trainerId = req.user.id;

    // Validate at least one field is provided
    if (!title && !description && !dueDate) {
      throw new BadRequestError('At least one field (title, description, or dueDate) must be provided');
    }

    // Validate title length if provided
    if (title !== undefined && title.length < 3) {
      throw new BadRequestError('Title must be at least 3 characters');
    }

    // Validate description length if provided
    if (description !== undefined && description.length < 10) {
      throw new BadRequestError('Description must be at least 10 characters');
    }

    // Validate dueDate format if provided
    if (dueDate !== undefined) {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        throw new BadRequestError('Due date must be a valid ISO 8601 date string');
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    const assignment = await assignmentService.updateAssignment(id, trainerId, updateData);

    logger.info(`Assignment ${id} updated by trainer ${trainerId}`);

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
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

/**
 * Get assignments for a course offering
 * GET /api/assignments/course-offering/:offeringId
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getAssignmentsByOffering = async (req, res, next) => {
  try {
    const { offeringId } = req.params;

    if (!offeringId) {
      return res.status(400).json({
        success: false,
        message: 'Course offering ID is required',
        error: 'Validation Error',
      });
    }

    const assignments = await assignmentService.getAssignmentsByOffering(offeringId);

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

/**
 * Delete assignment
 * DELETE /api/assignments/:id
 */
export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;

    await assignmentService.deleteAssignment(id, trainerId);

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
