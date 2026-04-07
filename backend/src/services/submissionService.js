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
 * @param {string} submissionData.fileName - Original file name
 * @param {number} submissionData.fileSize - File size in bytes
 * @returns {Promise<Object>} Created submission
 */
export const submitAssignment = async (submissionData) => {
  const { assignmentId, studentId, attachmentUrl, fileName, fileSize } = submissionData;

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

    // Verify student is enrolled in the course offering
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('offering_id', assignment.course_offering_id)
      .single();

    if (enrollmentError || !enrollment) {
      throw new BadRequestError('You must be enrolled in the course offering to submit this assignment');
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
    const submissionRecord = {
      assignment_id: assignmentId,
      student_id: studentId,
      attachment_url: attachmentUrl,
      status: 'submitted',
    };

    // Add file metadata if provided
    if (fileName) submissionRecord.file_name = fileName;
    if (fileSize) submissionRecord.file_size = fileSize;

    const { data, error } = await supabase
      .from('submissions')
      .insert([submissionRecord])
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
 * Grade submission
 * @param {string} submissionId - Submission ID
 * @param {string} trainerId - Trainer ID (for authorization)
 * @param {Object} gradeData - Grade data
 * @param {number} gradeData.grade - Grade (0-100)
 * @param {string} gradeData.feedback - Feedback text
 * @returns {Promise<Object>} Updated submission
 */
export const gradeSubmission = async (submissionId, trainerId, gradeData) => {
  const { grade, feedback } = gradeData;

  try {
    // Find submission by ID
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      throw new NotFoundError('Submission not found');
    }

    // Find the related assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', submission.assignment_id)
      .single();

    if (assignmentError || !assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify trainer owns the assignment
    if (assignment.trainer_id !== trainerId) {
      throw new UnauthorizedError('You are not authorized to grade this submission');
    }

    // Update submission with grade, feedback, status, and graded_at timestamp
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('submissions')
      .update({
        grade,
        feedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error grading submission:', updateError);
      throw new BadRequestError('Failed to grade submission');
    }

    logger.info(`Submission ${submissionId} graded by trainer ${trainerId}`);

    return updatedSubmission;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error grading submission:', error);
    throw new BadRequestError('Failed to grade submission');
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

/**
 * Run simulated AI evaluation + plagiarism check on a submission
 * @param {string} submissionId - Submission ID
 * @param {string} trainerId - Trainer ID (for authorization)
 * @returns {Promise<Object>} Updated submission with AI results
 */
export const runAiEvaluation = async (submissionId, trainerId) => {
  try {
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*, assignments(trainer_id)')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) throw new NotFoundError('Submission not found');
    if (submission.assignments.trainer_id !== trainerId) {
      throw new UnauthorizedError('Not authorized to evaluate this submission');
    }

    // Simulated AI scoring (placeholder for real AI integration)
    const aiScore = Math.floor(Math.random() * 31) + 65; // 65–95 range
    const plagiarismScore = Math.floor(Math.random() * 20); // 0–19%
    const plagiarismStatus = plagiarismScore < 10 ? 'clean' : plagiarismScore < 15 ? 'suspicious' : 'flagged';

    const aiFeedbackOptions = [
      'Good structure and clear explanation. Consider adding more examples.',
      'Well-organized submission. Some sections could benefit from deeper analysis.',
      'Solid work overall. The conclusion could be strengthened.',
      'Good effort. Ensure all requirements are addressed in future submissions.',
      'Clear and concise. Consider expanding on key concepts.',
    ];
    const aiFeedback = aiFeedbackOptions[Math.floor(Math.random() * aiFeedbackOptions.length)];

    const { data: updated, error: updateError } = await supabase
      .from('submissions')
      .update({
        ai_score: aiScore,
        ai_feedback: aiFeedback,
        plagiarism_score: plagiarismScore,
        plagiarism_status: plagiarismStatus,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating AI evaluation:', updateError);
      throw new BadRequestError('Failed to run AI evaluation');
    }

    logger.info(`AI evaluation completed for submission ${submissionId}`);
    return updated;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error in AI evaluation:', error);
    throw new BadRequestError('Failed to run AI evaluation');
  }
};
