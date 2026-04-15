/**
 * Submission Service
 * Handle submission-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
} from '../utils/errors.js';
import { evaluateSubmission } from './aiEvaluationService.js';
import { autoIssueCertificateIfEligible } from './certificateService.js';
import { updateLastActivity } from './adminService.js';
import { createNotification } from './notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Attempt to read text content from an uploaded file.
 * Only works for plain-text files (.txt, .md, .js, .py, .java, .cpp, .c).
 * For binary files (PDF, DOCX) returns empty string — AI will grade on metadata only.
 */
const readFileContent = (fileUrl) => {
  try {
    if (!fileUrl) return '';
    const filePath = path.join(__dirname, '../../', fileUrl);
    if (!fs.existsSync(filePath)) return '';
    const ext = path.extname(filePath).toLowerCase();
    const textExts = ['.txt', '.md', '.js', '.py', '.java', '.cpp', '.c', '.ts', '.html', '.css', '.json'];
    if (!textExts.includes(ext)) return '';
    const content = fs.readFileSync(filePath, 'utf8');
    return content.slice(0, 20000); // cap at 20k chars
  } catch {
    return '';
  }
};

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

    // Deadline validation
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
      throw new BadRequestError('Deadline has passed. Submission not allowed.');
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

    // Track student activity (non-blocking)
    updateLastActivity(studentId);

    // Notify trainer that a submission was received (non-blocking)
    createNotification(assignment.trainer_id, {
      title: 'New Submission Received',
      message: `A student submitted "${assignment.title}"`,
      type: 'submission',
    }).catch(() => {});

    // ── Auto-run plagiarism + AI evaluation ──────────────────────────────
    try {
      // Fetch all other submissions for this assignment (for plagiarism comparison)
      const { data: otherSubs } = await supabase
        .from('submissions')
        .select('id, attachment_url')
        .eq('assignment_id', assignmentId)
        .neq('id', data.id);

      const otherSubmissions = (otherSubs || []).map((s) => ({
        id: s.id,
        content: readFileContent(s.attachment_url),
      }));

      const submissionContent = readFileContent(data.attachment_url);

      const result = evaluateSubmission({
        submissionContent,
        assignmentTitle: assignment.title,
        assignmentDescription: assignment.description || '',
        otherSubmissions,
      });

      // Determine new status
      const newStatus = result.flagged ? 'flagged' : 'submitted';

      const { data: updatedSub, error: updateErr } = await supabase
        .from('submissions')
        .update({
          ai_score: result.aiScore,
          ai_feedback: result.aiFeedback,
          plagiarism_score: result.plagiarismScore,
          plagiarism_status: result.plagiarismStatus,
          status: newStatus,
          // If flagged, auto-set grade to 0
          ...(result.flagged ? { grade: 0, graded_at: new Date().toISOString() } : {}),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (!updateErr && updatedSub) {
        logger.info(`Auto-evaluation completed for submission ${data.id}: plagiarism=${result.plagiarismScore}%, ai=${result.aiScore}`);
        // Auto-issue certificate if eligible (non-blocking)
        autoIssueCertificateIfEligible(studentId, assignment.course_offering_id);
        return updatedSub;
      }
    } catch (evalErr) {
      // Evaluation failure must NOT block the submission
      logger.error('Auto-evaluation failed (non-blocking):', evalErr);
    }

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

    // Notify student that submission was graded (non-blocking)
    createNotification(updatedSubmission.student_id, {
      title: 'Submission Graded',
      message: `Your submission for "${assignment.title}" has been graded. Score: ${grade}/100`,
      type: 'grade',
    }).catch(() => {});

    // Auto-issue certificate if student just became eligible (non-blocking)
    autoIssueCertificateIfEligible(updatedSubmission.student_id, assignment.course_offering_id);

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
 * Run rule-based AI evaluation + plagiarism check on a submission.
 * Trainer-triggered re-evaluation (also runs automatically on submit).
 *
 * @param {string} submissionId - Submission ID
 * @param {string} trainerId    - Trainer ID (for authorization)
 * @returns {Promise<Object>}   Updated submission with AI results
 */
export const runAiEvaluation = async (submissionId, trainerId) => {
  try {
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*, assignments(id, title, description, trainer_id, course_offering_id)')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) throw new NotFoundError('Submission not found');
    if (submission.assignments.trainer_id !== trainerId) {
      throw new UnauthorizedError('Not authorized to evaluate this submission');
    }

    // Fetch all other submissions for plagiarism comparison
    const { data: otherSubs } = await supabase
      .from('submissions')
      .select('id, attachment_url')
      .eq('assignment_id', submission.assignment_id)
      .neq('id', submissionId);

    const otherSubmissions = (otherSubs || []).map((s) => ({
      id: s.id,
      content: readFileContent(s.attachment_url),
    }));

    const submissionContent = readFileContent(submission.attachment_url);

    const result = evaluateSubmission({
      submissionContent,
      assignmentTitle: submission.assignments.title,
      assignmentDescription: submission.assignments.description || '',
      otherSubmissions,
    });

    const newStatus = result.flagged ? 'flagged' : submission.status === 'submitted' ? 'submitted' : submission.status;

    const { data: updated, error: updateError } = await supabase
      .from('submissions')
      .update({
        ai_score: result.aiScore,
        ai_feedback: result.aiFeedback,
        plagiarism_score: result.plagiarismScore,
        plagiarism_status: result.plagiarismStatus,
        status: newStatus,
        ...(result.flagged && submission.grade === null
          ? { grade: 0, graded_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating AI evaluation:', updateError);
      throw new BadRequestError('Failed to run AI evaluation');
    }

    logger.info(`AI evaluation completed for submission ${submissionId}: plagiarism=${result.plagiarismScore}%, ai=${result.aiScore}`);
    return updated;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error in AI evaluation:', error);
    throw new BadRequestError('Failed to run AI evaluation');
  }
};
