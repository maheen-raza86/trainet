/**
 * Assignment Service
 * Handle assignment-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

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
  const { title, description, courseOfferingId, trainerId, dueDate } = assignmentData;

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

    // Verify trainer owns the offering
    if (offering.trainer_id !== trainerId) {
      throw new UnauthorizedError('You can only create assignments for your own course offerings');
    }

    // Create assignment
    const { data, error } = await supabase
      .from('assignments')
      .insert([
        {
          course_offering_id: courseOfferingId,
          trainer_id: trainerId,
          title,
          description,
          due_date: dueDate,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Error creating assignment:', error);
      throw new BadRequestError('Failed to create assignment');
    }

    logger.info(`Assignment created: ${title} for offering ${courseOfferingId} by trainer ${trainerId}`);

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
 * @returns {Promise<Array>} List of assignments
 */
export const getAssignmentsByCourse = async (courseId) => {
  try {
    // Try to fetch by course_offering_id first (new structure)
    const { data: offeringAssignments, error: offeringError } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_offering_id', courseId)
      .order('due_date', { ascending: true });

    if (!offeringError && offeringAssignments && offeringAssignments.length > 0) {
      return offeringAssignments;
    }

    // Fallback to course_id for backward compatibility
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('due_date', { ascending: true });

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
  const { title, description, dueDate } = updateData;

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

    // Prepare update object
    const updateFields = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (dueDate !== undefined) updateFields.due_date = dueDate;

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update(updateFields)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating assignment:', updateError);
      throw new BadRequestError('Failed to update assignment');
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
 * @returns {Promise<Array>} List of assignments
 */
export const getAssignmentsByOffering = async (offeringId) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_offering_id', offeringId)
      .order('due_date', { ascending: true });

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
