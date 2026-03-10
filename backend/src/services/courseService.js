/**
 * Course Service
 * Handle course-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Get all courses
 * @returns {Promise<Array>} List of all courses
 */
export const getAllCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching courses:', error);
      throw new BadRequestError('Failed to fetch courses');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching courses:', error);
    throw new BadRequestError('Failed to fetch courses');
  }
};

/**
 * Get course by ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Course data
 */
export const getCourseById = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error || !data) {
      logger.warn(`Course not found: ${courseId}`);
      throw new NotFoundError('Course not found');
    }

    return data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Error fetching course:', error);
    throw new BadRequestError('Failed to fetch course');
  }
};

/**
 * Enroll student in course
 * @param {string} studentId - Student user ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Enrollment data
 */
export const enrollStudent = async (studentId, courseId) => {
  try {
    // Check if course exists
    const course = await getCourseById(courseId);

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      throw new ConflictError('Student is already enrolled in this course');
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert([
        {
          student_id: studentId,
          course_id: courseId,
          status: 'active',
          progress: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Error creating enrollment:', error);
      throw new BadRequestError('Failed to enroll in course');
    }

    logger.info(`Student ${studentId} enrolled in course ${courseId}`);

    return data;
  } catch (error) {
    if (error instanceof ConflictError || error instanceof NotFoundError) {
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
export const getStudentCourses = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (*)
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student courses:', error);
      throw new BadRequestError('Failed to fetch enrolled courses');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching student courses:', error);
    throw new BadRequestError('Failed to fetch enrolled courses');
  }
};

/**
 * Create assignment for a course
 * @param {string} courseId - Course ID
 * @param {string} trainerId - Trainer user ID
 * @param {Object} assignmentData - Assignment data
 * @returns {Promise<Object>} Created assignment
 */
export const createAssignment = async (courseId, trainerId, assignmentData) => {
  try {
    const { title, description, dueDate, maxScore } = assignmentData;

    // Verify course exists
    await getCourseById(courseId);

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
          max_score: maxScore,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Error creating assignment:', error);
      throw new BadRequestError('Failed to create assignment');
    }

    logger.info(`Assignment created for course ${courseId} by trainer ${trainerId}`);

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
 * Submit assignment
 * @param {string} assignmentId - Assignment ID
 * @param {string} studentId - Student user ID
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} Created submission
 */
export const submitAssignment = async (assignmentId, studentId, submissionData) => {
  try {
    const { content, attachmentUrl } = submissionData;

    // Verify assignment exists
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Check if student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', assignment.course_id)
      .single();

    if (enrollmentError || !enrollment) {
      throw new BadRequestError('You must be enrolled in the course to submit assignments');
    }

    // Check for existing submission
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (existingSubmission) {
      throw new ConflictError('Assignment already submitted. Please update your existing submission.');
    }

    // Create submission
    const { data, error } = await supabase
      .from('submissions')
      .insert([
        {
          assignment_id: assignmentId,
          student_id: studentId,
          content,
          attachment_url: attachmentUrl,
          status: 'submitted',
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Error creating submission:', error);
      throw new BadRequestError('Failed to submit assignment');
    }

    logger.info(`Assignment ${assignmentId} submitted by student ${studentId}`);

    return data;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ConflictError
    ) {
      throw error;
    }
    logger.error('Unexpected error submitting assignment:', error);
    throw new BadRequestError('Failed to submit assignment');
  }
};
