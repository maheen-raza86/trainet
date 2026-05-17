/**
 * Assignment Service
 * Handle assignment-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.js';
import { createNotification } from './notificationService.js';

/**
 * Create assignment for a course offering
 * @param {Object} assignmentData - Assignment data
 * @param {string} assignmentData.title - Assignment title
 * @param {string} assignmentData.description - Assignment description
 * @param {string} assignmentData.courseOfferingId - Course Offering ID
 * @param {string} assignmentData.trainerId - Trainer ID
 * @param {string} assignmentData.dueDate - Due date
 * @returns {Promise<Object>} Created assignment
 */
export const createAssignment = async (assignmentData) => {
  const { title, description, courseOfferingId, trainerId, dueDate, startTime, fileUrl, fileName, fileSize } = assignmentData;

  try {
    // Verify course offering exists and trainer owns it
    const { data: offering, error: offeringError } = await supabase
      .from('course_offerings')
      .select('*')
      .eq('id', courseOfferingId)
      .single();

    if (offeringError || !offering) {
      throw new NotFoundError('Course offering not found');
    }

    if (offering.trainer_id !== trainerId) {
      throw new UnauthorizedError('You can only create assignments for your own course offerings');
    }

    // Validate scheduling: start_time must be before due_date when both are provided
    if (startTime && dueDate && new Date(startTime) >= new Date(dueDate)) {
      throw new BadRequestError('Start time must be before the due date');
    }

    // Create assignment
    const insertData = {
      course_offering_id: courseOfferingId,
      trainer_id: trainerId,
      title,
      description,
      due_date: dueDate,
    };

    // start_time is optional — null means immediately visible
    if (startTime) insertData.start_time = startTime;

    if (fileUrl) insertData.file_url = fileUrl;
    if (fileName) insertData.file_name = fileName;
    if (fileSize) insertData.file_size = fileSize;

    const { data, error } = await supabase
      .from('assignments')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      logger.error('Error creating assignment:', error);
      throw new BadRequestError('Failed to create assignment');
    }

    logger.info(`Assignment created: ${title} for offering ${courseOfferingId} by trainer ${trainerId}`);

    // Notify enrolled students (non-blocking)
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('offering_id', courseOfferingId);
      for (const e of (enrollments || [])) {
        createNotification(e.student_id, {
          title: 'New Assignment',
          message: `New assignment "${title}" has been posted`,
          type: 'assignment',
        });
      }
    } catch { /* non-blocking */ }

    return data;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError || error instanceof UnauthorizedError) {
      throw error;
    }
    logger.error('Unexpected error creating assignment:', error);
    throw new BadRequestError('Failed to create assignment');
  }
};

/**
 * Get assignments for a course or course offering
 * @param {string} courseId - Course ID or Course Offering ID
 * @param {Object} options - Options
 * @param {boolean} options.studentView - When true, hide assignments not yet started
 * @returns {Promise<Array>} List of assignments
 */
export const getAssignmentsByCourse = async (courseId, options = {}) => {
  try {
    const now = new Date().toISOString();

    // Try to fetch by course_offering_id first (new structure)
    let query = supabase
      .from('assignments')
      .select('*')
      .eq('course_offering_id', courseId)
      .order('due_date', { ascending: true });

    if (options.studentView) {
      query = query.or(`start_time.is.null,start_time.lte.${now}`);
    }

    const { data: offeringAssignments, error: offeringError } = await query;

    if (!offeringError && offeringAssignments && offeringAssignments.length > 0) {
      return offeringAssignments;
    }

    // Fallback to course_id for backward compatibility
    let fallbackQuery = supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('due_date', { ascending: true });

    if (options.studentView) {
      fallbackQuery = fallbackQuery.or(`start_time.is.null,start_time.lte.${now}`);
    }

    const { data, error } = await fallbackQuery;

    if (error) {
      logger.error('Error fetching assignments:', error);
      throw new BadRequestError('Failed to fetch assignments');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching assignments:', error);
    throw new BadRequestError('Failed to fetch assignments');
  }
};

/**
 * Update assignment
 * @param {string} assignmentId - Assignment ID
 * @param {string} trainerId - Trainer ID (for authorization)
 * @param {Object} updateData - Update data
 * @param {string} updateData.title - Assignment title (optional)
 * @param {string} updateData.description - Assignment description (optional)
 * @param {string} updateData.dueDate - Due date (optional)
 * @returns {Promise<Object>} Updated assignment
 */
export const updateAssignment = async (assignmentId, trainerId, updateData) => {
  const { title, description, dueDate, startTime } = updateData;

  try {
    // Verify assignment exists
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify trainer owns the assignment
    if (assignment.trainer_id !== trainerId) {
      throw new UnauthorizedError('You are not authorized to edit this assignment');
    }

    // Validate scheduling: start_time must be before due_date
    const resolvedStartTime = startTime !== undefined ? startTime : assignment.start_time;
    const resolvedDueDate = dueDate !== undefined ? dueDate : assignment.due_date;
    if (resolvedStartTime && resolvedDueDate && new Date(resolvedStartTime) >= new Date(resolvedDueDate)) {
      throw new BadRequestError('Start time must be before the due date');
    }

    // Prepare update object — only columns that exist in the assignments table
    const updateFields = {};

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (dueDate !== undefined) updateFields.due_date = dueDate;
    // Allow explicit null to clear start_time (make immediately visible)
    if (startTime !== undefined) updateFields.start_time = startTime || null;

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update(updateFields)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating assignment:', updateError.message || updateError);
      throw new BadRequestError(updateError.message || 'Failed to update assignment');
    }

    logger.info(`Assignment ${assignmentId} updated by trainer ${trainerId}`);

    return updatedAssignment;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error updating assignment:', error);
    throw new BadRequestError('Failed to update assignment');
  }
};

/**
 * Get assignments for a course offering
 * @param {string} offeringId - Course Offering ID
 * @param {Object} options - Options
 * @param {boolean} options.studentView - When true, hide assignments not yet started
 * @returns {Promise<Array>} List of assignments
 */
export const getAssignmentsByOffering = async (offeringId, options = {}) => {
  try {
    let query = supabase
      .from('assignments')
      .select('*')
      .eq('course_offering_id', offeringId)
      .order('due_date', { ascending: true });

    // Student view: only return assignments whose start_time has passed (or is null)
    if (options.studentView) {
      const now = new Date().toISOString();
      query = query.or(`start_time.is.null,start_time.lte.${now}`);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching assignments by offering:', error);
      throw new BadRequestError('Failed to fetch assignments');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching assignments by offering:', error);
    throw new BadRequestError('Failed to fetch assignments');
  }
};

/**
 * Get assignment by ID
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Object>} Assignment data
 */
export const getAssignmentById = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Assignment not found');
    }

    return data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Error fetching assignment:', error);
    throw new BadRequestError('Failed to fetch assignment');
  }
};

/**
 * Delete assignment
 * @param {string} assignmentId - Assignment ID
 * @param {string} trainerId - Trainer ID (for authorization)
 * @returns {Promise<boolean>}
 */
export const deleteAssignment = async (assignmentId, trainerId) => {
  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, trainer_id')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) throw new NotFoundError('Assignment not found');
    if (assignment.trainer_id !== trainerId) throw new UnauthorizedError('Not authorized to delete this assignment');

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      logger.error('Error deleting assignment:', error);
      throw new BadRequestError('Failed to delete assignment');
    }

    logger.info(`Assignment ${assignmentId} deleted by trainer ${trainerId}`);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error deleting assignment:', error);
    throw new BadRequestError('Failed to delete assignment');
  }
};
