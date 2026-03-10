/**
 * Assignment Service
 * Handle assignment-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

/**
 * Create assignment for a course
 * @param {Object} assignmentData - Assignment data
 * @param {string} assignmentData.title - Assignment title
 * @param {string} assignmentData.description - Assignment description
 * @param {string} assignmentData.courseId - Course ID
 * @param {string} assignmentData.trainerId - Trainer ID
 * @param {string} assignmentData.dueDate - Due date
 * @returns {Promise<Object>} Created assignment
 */
export const createAssignment = async (assignmentData) => {
  const { title, description, courseId, trainerId, dueDate } = assignmentData;

  try {
    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new NotFoundError('Course not found');
    }

    // Create assignment
    const { data, error } = await supabase
      .from('assignments')
      .insert([
        {
          course_id: courseId,
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

    logger.info(`Assignment created: ${title} for course ${courseId} by trainer ${trainerId}`);

    return data;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error creating assignment:', error);
    throw new BadRequestError('Failed to create assignment');
  }
};

/**
 * Get assignments for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} List of assignments
 */
export const getAssignmentsByCourse = async (courseId) => {
  try {
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
