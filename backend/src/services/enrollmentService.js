/**
 * Enrollment Service
 * Handle enrollment-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Enroll student in course
 * @param {string} studentId - Student user ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Enrollment data
 */
export const enrollStudent = async (studentId, courseId) => {
  try {
    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      logger.warn(`Course not found: ${courseId}`);
      throw new NotFoundError('Course not found');
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      throw new ConflictError('Already enrolled in this course');
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert([
        {
          student_id: studentId,
          course_id: courseId,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Error creating enrollment:', error);
      throw new BadRequestError(error.message);
    }

    logger.info(`Student ${studentId} enrolled in course ${courseId}`);

    return data;
  } catch (error) {
    if (
      error instanceof ConflictError ||
      error instanceof NotFoundError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error during enrollment:', error);
    throw new BadRequestError('Failed to enroll in course');
  }
};

/**
 * Get student's enrolled courses
 * @param {string} studentId - Student user ID
 * @returns {Promise<Array>} List of enrolled courses
 */
export const getStudentEnrollments = async (studentId) => {
  try {
    // First try to get course offering enrollments (new system)
    const { data: offeringEnrollments, error: offeringError } = await supabase
      .from('enrollments')
      .select(`
        *,
        course_offerings (
          *,
          courses (
            id,
            title,
            description
          ),
          profiles!course_offerings_trainer_id_fkey (
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq('student_id', studentId)
      .not('offering_id', 'is', null)
      .neq('status', 'dropped')
      .order('enrolled_at', { ascending: false });

    if (!offeringError && offeringEnrollments && offeringEnrollments.length > 0) {
      return offeringEnrollments;
    }

    // Fallback to course enrollments (old system) for backward compatibility
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          created_at
        )
      `)
      .eq('student_id', studentId)
      .is('offering_id', null)
      .order('enrolled_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student enrollments:', error);
      throw new BadRequestError(error.message);
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching student enrollments:', error);
    throw new BadRequestError('Failed to fetch enrollments');
  }
};

/**
 * Get enrollments for a specific course offering
 * @param {string} offeringId - Course offering ID
 * @returns {Promise<Array>} List of enrollments
 */
export const getEnrollmentsByOffering = async (offeringId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id, student_id, status, progress, enrolled_at,
        profiles!enrollments_student_id_fkey(id, first_name, last_name, email, role)
      `)
      .eq('offering_id', offeringId);

    if (error) {
      logger.error('Error fetching enrollments by offering:', error);
      throw new BadRequestError('Failed to fetch enrollments');
    }

    // Defensive: only return student enrollments
    return (data || []).filter(e => e.profiles?.role === 'student');
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
    logger.error('Unexpected error fetching enrollments by offering:', error);
    throw new BadRequestError('Failed to fetch enrollments');
  }
};
