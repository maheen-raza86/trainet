/**
 * Submission Service
 * Handle submission-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
} from '../utils/errors.js';

/**
 * Submit assignment
 * @param {Object} submissionData - Submission data
 * @param {string} submissionData.assignmentId - Assignment ID
 * @param {string} submissionData.studentId - Student ID
 * @param {string} submissionData.attachmentUrl - Attachment URL
 * @returns {Promise<Object>} Created submission
 */
export const submitAssignment = async (submissionData) => {
  const { assignmentId, studentId, attachmentUrl } = submissionData;

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

    // Verify student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', assignment.course_id)
      .single();

    if (enrollmentError || !enrollment) {
      throw new BadRequestError('You must be enrolled in the course to submit this assignment');
    }

    // Check for existing submission
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (existingSubmission) {
      throw new ConflictError('You have already submitted this assignment');
    }

    // Create submission
    const { data, error } = await supabase
      .from('submissions')
      .insert([
        {
          assignment_id: assignmentId,
          student_id: studentId,
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

/**
 * Get submissions for an assignment
 * @param {string} assignmentId - Assignment ID
 * @param {string} trainerId - Trainer ID (for authorization)
 * @returns {Promise<Array>} List of submissions
 */
export const getSubmissionsByAssignment = async (assignmentId, trainerId) => {
  try {
    // Verify assignment exists and belongs to trainer
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify trainer owns this assignment
    if (assignment.trainer_id !== trainerId) {
      throw new UnauthorizedError('You are not authorized to view submissions for this assignment');
    }

    // Fetch submissions with student profile information
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:student_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      logger.error('Error fetching submissions:', error);
      throw new BadRequestError('Failed to fetch submissions');
    }

    return data || [];
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error fetching submissions:', error);
    throw new BadRequestError('Failed to fetch submissions');
  }
};

/**
 * Get student's own submissions
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} List of student's submissions
 */
export const getStudentSubmissions = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments (
          id,
          title,
          description,
          due_date,
          course_id
        )
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student submissions:', error);
      throw new BadRequestError('Failed to fetch submissions');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching student submissions:', error);
    throw new BadRequestError('Failed to fetch submissions');
  }
};
