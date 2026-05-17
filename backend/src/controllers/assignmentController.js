/**
 * Assignment Controller
 * Handle assignment-related HTTP requests
 */

import * as assignmentService from '../services/assignmentService.js';
import logger from '../utils/logger.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { uploadFile } from '../utils/storageService.js';

/**
 * Create assignment
 * POST /api/assignments
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { title, description, courseOfferingId, dueDate, startTime } = req.body;
    const trainerId = req.user.id;
    const file = req.file;

    if (!title || !description || !courseOfferingId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and courseOfferingId are required',
        error: 'Validation Error',
      });
    }

    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Only trainers can create assignments', error: 'Forbidden' });
    }

    // Validate startTime format if provided
    if (startTime) {
      const d = new Date(startTime);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: 'start_time must be a valid ISO 8601 date string', error: 'Validation Error' });
      }
    }

    // Upload file to Supabase Storage if provided
    let fileUrl = null;
    if (file) {
      fileUrl = await uploadFile({
        buffer: file.buffer,
        folder: 'assignments',
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
    }

    const assignment = await assignmentService.createAssignment({
      title,
      description,
      courseOfferingId,
      trainerId,
      dueDate,
      startTime: startTime || null,
      fileUrl,
      fileName: file ? file.originalname : null,
      fileSize: file ? file.size : null,
    });

    res.status(201).json({ success: true, message: 'Assignment created successfully', data: assignment });
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
    const { title, description, dueDate, startTime } = req.body;
    const trainerId = req.user.id;

    // Validate at least one field is provided
    if (!title && !description && !dueDate && startTime === undefined) {
      throw new BadRequestError('At least one field (title, description, dueDate, or startTime) must be provided');
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

    // Validate startTime format if provided (null is allowed to clear it)
    if (startTime !== undefined && startTime !== null) {
      const d = new Date(startTime);
      if (isNaN(d.getTime())) {
        throw new BadRequestError('Start time must be a valid ISO 8601 date string');
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (startTime !== undefined) updateData.startTime = startTime;

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
 * Students only see assignments whose start_time has passed.
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

    const studentView = req.user?.role === 'student';
    const assignments = await assignmentService.getAssignmentsByCourse(courseId, { studentView });

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
 * Students only see assignments whose start_time has passed.
 * Trainers see all assignments regardless of start_time.
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

    // Apply student-view filtering (hide not-yet-started assignments) for students
    const studentView = req.user?.role === 'student';
    const assignments = await assignmentService.getAssignmentsByOffering(offeringId, { studentView });

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
