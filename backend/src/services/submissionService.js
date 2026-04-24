/**
 * Submission Service
 * Handle submission-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
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
import { downloadFile, isSupabaseUrl } from '../utils/storageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract text content from a file.
 * Supports Supabase Storage URLs (new) and legacy local paths (backward compat).
 * Returns empty string on failure — never throws.
 */
const readFileContent = async (fileUrl) => {
  try {
    if (!fileUrl) return '';

    let buffer, ext;

    if (isSupabaseUrl(fileUrl)) {
      // ── New path: download from Supabase Storage ──────────────────────
      const result = await downloadFile(fileUrl);
      if (!result) return '';
      buffer = result.buffer;
      ext = result.ext;
    } else {
      // ── Legacy path: read from local disk (backward compat) ───────────
      const filePath = path.join(__dirname, '../../', fileUrl);
      if (!fs.existsSync(filePath)) {
        logger.warn(`[readFileContent] Local file not found: ${filePath}`);
        return '';
      }
      ext = path.extname(filePath).toLowerCase();
      buffer = fs.readFileSync(filePath);
    }

    // ── DOCX ──────────────────────────────────────────────────────────────
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || '').trim();
      console.log(`[readFileContent] DOCX extracted ${text.length} chars`);
      return text.slice(0, 20000);
    }

    // ── PDF ───────────────────────────────────────────────────────────────
    if (ext === '.pdf') {
      const data = await pdfParse(buffer);
      const text = (data.text || '').trim();
      console.log(`[readFileContent] PDF extracted ${text.length} chars`);
      return text.slice(0, 20000);
    }

    // ── Plain text ────────────────────────────────────────────────────────
    const textExts = ['.txt', '.md', '.js', '.py', '.java', '.cpp', '.c', '.ts', '.html', '.css', '.json'];
    if (textExts.includes(ext)) {
      const content = buffer.toString('utf8');
      console.log(`[readFileContent] Text file extracted ${content.length} chars`);
      return content.slice(0, 20000);
    }

    logger.warn(`[readFileContent] Unsupported file type: ${ext}`);
    return '';
  } catch (err) {
    logger.error(`[readFileContent] Failed to extract text: ${err.message}`);
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
      const { data: otherSubs } = await supabase
        .from('submissions')
        .select('id, attachment_url')
        .eq('assignment_id', assignmentId)
        .neq('id', data.id);

      const otherSubmissions = await Promise.all((otherSubs || []).map(async (s) => ({
        id: s.id,
        content: await readFileContent(s.attachment_url),
      })));

      const submissionContent = await readFileContent(data.attachment_url) || '';

      // If file content is empty (PDF/DOCX), pass a placeholder so Groq can still grade
      const effectiveContent = submissionContent ||
        `[Student submitted file: ${data.file_name || data.attachment_url || 'unknown file'}. File content could not be extracted for automated grading.]`;

      console.log('[submissionService] submissionContent length:', submissionContent.length);
      console.log('[submissionService] attachment_url:', data.attachment_url);
      console.log('[submissionService] Starting AI evaluation...');

      const result = evaluateSubmission({
        submissionContent: effectiveContent,
        assignmentTitle: assignment.title,
        assignmentDescription: assignment.description || '',
        otherSubmissions,
      });

      const newStatus = result.flagged ? 'flagged' : 'submitted';
      const missingConceptsJson = JSON.stringify(result.missingConcepts || []);

      console.log('[submissionService] Evaluation result:', {
        aiScore: result.aiScore,
        aiStatus: result.aiStatus,
        plagiarismPercentage: result.plagiarismPercentage,
        plagiarismStatus: result.plagiarismStatus,
        flagged: result.flagged,
      });

      const { data: updatedSub, error: updateErr } = await supabase
        .from('submissions')
        .update({
          ai_score:               result.aiScore,
          final_score:            result.aiScore,          // initially equals ai_score
          ai_feedback:            result.aiFeedback,
          missing_concepts:       missingConceptsJson,
          plagiarism_percentage:  result.plagiarismPercentage,
          plagiarism_status:      result.plagiarismStatus,
          ai_status:              result.aiStatus,
          status:                 newStatus,
          ...(result.flagged ? { grade: 0, graded_at: new Date().toISOString() } : {}),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (!updateErr && updatedSub) {
        logger.info(`Auto-evaluation completed for submission ${data.id}: plagiarism=${result.plagiarismPercentage}%, ai=${result.aiScore}`);
        console.log('[submissionService] DB update SUCCESS — ai_status saved:', updatedSub.ai_status);
        autoIssueCertificateIfEligible(studentId, assignment.course_offering_id);
        return updatedSub;
      } else if (updateErr) {
        console.error('[submissionService] DB update FAILED:', updateErr);
      }
    } catch (evalErr) {
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

    // Update submission — only use columns that exist in the DB
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('submissions')
      .update({
        final_score:           grade,
        trainer_feedback:      feedback,
        trainer_override:      true,
        reviewed_by_trainer:   true,
        reviewed_at:           new Date().toISOString(),
        ai_status:             'Finalized',
        status:                'graded',
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

    const otherSubmissions = await Promise.all((otherSubs || []).map(async (s) => ({
      id: s.id,
      content: await readFileContent(s.attachment_url),
    })));

    const submissionContent = await readFileContent(submission.attachment_url);

    // If file content is empty (PDF/DOCX), use the file name as a hint
    // so Groq can still provide partial feedback
    const effectiveContent = submissionContent ||
      `[Student submitted file: ${submission.file_name || submission.attachment_url || 'unknown file'}. File content could not be extracted for automated grading.]`;

    console.log('[runAiEvaluation] submissionContent length:', submissionContent.length);
    console.log('[runAiEvaluation] effectiveContent length:', effectiveContent.length);

    const result = evaluateSubmission({
      submissionContent: effectiveContent,
      assignmentTitle: submission.assignments.title,
      assignmentDescription: submission.assignments.description || '',
      otherSubmissions,
    });

    const newStatus = result.flagged ? 'flagged' : submission.status === 'submitted' ? 'submitted' : submission.status;
    const missingConceptsJson = JSON.stringify(result.missingConcepts || []);

    console.log('[runAiEvaluation] Saving to DB:', {
      ai_score: result.aiScore,
      ai_status: result.aiStatus,
      plagiarism_percentage: result.plagiarismPercentage,
      plagiarism_status: result.plagiarismStatus,
    });

    const { data: updated, error: updateError } = await supabase
      .from('submissions')
      .update({
        ai_score:              result.aiScore,
        final_score:           result.aiScore,
        ai_feedback:           result.aiFeedback,
        missing_concepts:      missingConceptsJson,
        plagiarism_percentage: result.plagiarismPercentage,
        plagiarism_status:     result.plagiarismStatus,
        ai_status:             result.aiStatus,
        status:                newStatus,
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

    logger.info(`AI evaluation completed for submission ${submissionId}: plagiarism=${result.plagiarismPercentage}%, ai=${result.aiScore}`);
    return updated;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error in AI evaluation:', error);
    throw new BadRequestError('Failed to run AI evaluation');
  }
};

/**
 * Trainer finalizes a submission with optional score override and feedback.
 * Sets trainer_override=true, ai_status='Finalized'.
 */
export const finalizeSubmission = async (submissionId, trainerId, { finalScore, trainerFeedback }) => {
  try {
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*, assignments(id, title, trainer_id, course_offering_id)')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) throw new NotFoundError('Submission not found');
    if (submission.assignments.trainer_id !== trainerId) {
      throw new UnauthorizedError('Not authorized to finalize this submission');
    }

    // Resolve the final score: use override if provided, else keep existing ai_score
    const resolvedScore = (finalScore !== undefined && finalScore !== null && finalScore !== '')
      ? parseInt(finalScore, 10)
      : (submission.ai_score ?? null);

    const updatePayload = {
      reviewed_by_trainer: true,
      reviewed_at:         new Date().toISOString(),
      ai_status:           'Finalized',
      status:              'graded',
      final_score:         resolvedScore,
      trainer_override:    (finalScore !== undefined && finalScore !== null && finalScore !== ''),
    };

    if (trainerFeedback !== undefined && trainerFeedback !== null && trainerFeedback !== '') {
      updatePayload.trainer_feedback = trainerFeedback;
    }

    console.log('[finalizeSubmission] submissionId:', submissionId);
    console.log('[finalizeSubmission] updatePayload:', JSON.stringify(updatePayload));

    const { data: updated, error: updateError } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      logger.error('[finalizeSubmission] Supabase error:', JSON.stringify(updateError));
      throw new BadRequestError(`Failed to finalize submission: ${updateError.message}`);
    }

    // Fresh SELECT to guarantee the returned object reflects the saved state
    const { data: fresh, error: freshError } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:student_id ( id, email, first_name, last_name )
      `)
      .eq('id', submissionId)
      .single();

    if (freshError || !fresh) {
      logger.error('[finalizeSubmission] Fresh select error:', JSON.stringify(freshError));
      // Fall back to the update result if fresh select fails
    }

    const result = fresh || updated;

    console.log('[finalizeSubmission] Returning — ai_status:', result.ai_status,
      '| final_score:', result.final_score,
      '| trainer_feedback:', result.trainer_feedback,
      '| reviewed_by_trainer:', result.reviewed_by_trainer);

    // Notify student (non-blocking)
    createNotification(result.student_id, {
      title: 'Submission Finalized',
      message: `Your submission for "${submission.assignments.title}" has been reviewed. Final score: ${result.final_score ?? result.ai_score}/100`,
      type: 'grade',
    }).catch(() => {});

    autoIssueCertificateIfEligible(result.student_id, submission.assignments.course_offering_id);

    return result;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof BadRequestError) throw error;
    logger.error('Unexpected error finalizing submission:', error);
    throw new BadRequestError('Failed to finalize submission');
  }
};;

/**
 * Get a single submission by ID (student can only fetch their own).
 */
export const getSubmissionById = async (submissionId, studentId) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('student_id', studentId)
      .single();

    if (error || !data) throw new NotFoundError('Submission not found');
    return data;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    logger.error('Error fetching submission by id:', err);
    throw new BadRequestError('Failed to fetch submission');
  }
};
