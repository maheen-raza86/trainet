/**
 * Work & Practice Service
 * SRDS FR-WP-1 through FR-WP-4
 * Follows same patterns as assignmentService / submissionService
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';

// ─────────────────────────────────────────────
// TASK MANAGEMENT (FR-WP-1)
// ─────────────────────────────────────────────

/**
 * Create a Work & Practice task (trainer only)
 */
export const createTask = async (trainerId, taskData) => {
  const { title, description, instructions, resourceUrl, taskType, deadline, offeringId } = taskData;

  if (!title || !description) {
    throw new BadRequestError('Title and description are required');
  }
  if (title.length < 3) throw new BadRequestError('Title must be at least 3 characters');
  if (description.length < 10) throw new BadRequestError('Description must be at least 10 characters');

  // If offering_id provided, verify trainer owns it
  if (offeringId) {
    const { data: offering } = await supabase
      .from('course_offerings')
      .select('id, trainer_id')
      .eq('id', offeringId)
      .single();

    if (!offering) throw new NotFoundError('Course offering not found');
    if (offering.trainer_id !== trainerId) {
      throw new ForbiddenError('You can only create tasks for your own course offerings');
    }
  }

  const { data, error } = await supabase
    .from('work_practice_tasks')
    .insert([{
      trainer_id: trainerId,
      offering_id: offeringId || null,
      title,
      description,
      instructions: instructions || null,
      resource_url: resourceUrl || null,
      task_type: taskType || 'project',
      deadline: deadline || null,
      status: 'published',
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error creating WP task:', error);
    throw new BadRequestError('Failed to create task');
  }

  logger.info(`Work & Practice task created: ${data.id} by trainer ${trainerId}`);
  return data;
};

/**
 * Get all tasks created by a trainer
 */
export const getTrainerTasks = async (trainerId) => {
  const { data, error } = await supabase
    .from('work_practice_tasks')
    .select(`
      *,
      course_offerings (
        id,
        courses (id, title)
      )
    `)
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) throw new BadRequestError('Failed to fetch tasks');
  return data || [];
};

/**
 * Get published tasks visible to a student (enrolled offerings only)
 */
export const getStudentTasks = async (studentId) => {
  // Get student's enrolled offering IDs
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('offering_id')
    .eq('student_id', studentId);

  const enrolledOfferingIds = (enrollments || []).map(e => e.offering_id).filter(Boolean);

  // Fetch published tasks: either linked to enrolled offerings or open (no offering)
  let query = supabase
    .from('work_practice_tasks')
    .select(`
      *,
      profiles!work_practice_tasks_trainer_id_fkey (id, first_name, last_name),
      course_offerings (
        id,
        courses (id, title)
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Filter: offering_id is null OR offering_id in enrolled list
  if (enrolledOfferingIds.length > 0) {
    query = query.or(`offering_id.is.null,offering_id.in.(${enrolledOfferingIds.join(',')})`);
  } else {
    query = query.is('offering_id', null);
  }

  const { data, error } = await query;
  if (error) throw new BadRequestError('Failed to fetch tasks');
  return data || [];
};

/**
 * Get a single task by ID
 */
export const getTaskById = async (taskId) => {
  const { data, error } = await supabase
    .from('work_practice_tasks')
    .select(`
      *,
      profiles!work_practice_tasks_trainer_id_fkey (id, first_name, last_name),
      course_offerings (
        id,
        courses (id, title)
      )
    `)
    .eq('id', taskId)
    .single();

  if (error || !data) throw new NotFoundError('Task not found');
  return data;
};

/**
 * Update a task (trainer only)
 */
export const updateTask = async (taskId, trainerId, updateData) => {
  const { data: task } = await supabase
    .from('work_practice_tasks')
    .select('id, trainer_id')
    .eq('id', taskId)
    .single();

  if (!task) throw new NotFoundError('Task not found');
  if (task.trainer_id !== trainerId) throw new ForbiddenError('Not authorized to edit this task');

  const fields = { updated_at: new Date().toISOString() };
  if (updateData.title !== undefined) fields.title = updateData.title;
  if (updateData.description !== undefined) fields.description = updateData.description;
  if (updateData.instructions !== undefined) fields.instructions = updateData.instructions;
  if (updateData.resourceUrl !== undefined) fields.resource_url = updateData.resourceUrl;
  if (updateData.deadline !== undefined) fields.deadline = updateData.deadline;
  if (updateData.status !== undefined) fields.status = updateData.status;
  if (updateData.taskType !== undefined) fields.task_type = updateData.taskType;

  const { data, error } = await supabase
    .from('work_practice_tasks')
    .update(fields)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new BadRequestError('Failed to update task');
  return data;
};

/**
 * Delete a task (trainer only)
 */
export const deleteTask = async (taskId, trainerId) => {
  const { data: task } = await supabase
    .from('work_practice_tasks')
    .select('id, trainer_id')
    .eq('id', taskId)
    .single();

  if (!task) throw new NotFoundError('Task not found');
  if (task.trainer_id !== trainerId) throw new ForbiddenError('Not authorized to delete this task');

  const { error } = await supabase.from('work_practice_tasks').delete().eq('id', taskId);
  if (error) throw new BadRequestError('Failed to delete task');
  return true;
};

// ─────────────────────────────────────────────
// SUBMISSIONS (FR-WP-2)
// ─────────────────────────────────────────────

/**
 * Submit a solution for a task (student only)
 */
export const submitTask = async (taskId, studentId, submissionData) => {
  const { submissionContent, fileUrl, fileName, fileSize } = submissionData;

  // Verify task exists and is published
  const { data: task, error: taskError } = await supabase
    .from('work_practice_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (taskError || !task) throw new NotFoundError('Task not found');
  if (task.status !== 'published') throw new BadRequestError('This task is not accepting submissions');

  // Deadline check
  if (task.deadline && new Date() > new Date(task.deadline)) {
    throw new BadRequestError('Deadline has passed. Submission not allowed.');
  }

  // Enrollment check (if task is linked to an offering)
  if (task.offering_id) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('offering_id', task.offering_id)
      .single();

    if (!enrollment) {
      throw new ForbiddenError('You must be enrolled in the course to submit this task');
    }
  }

  // Duplicate check
  const { data: existing } = await supabase
    .from('work_practice_submissions')
    .select('id')
    .eq('task_id', taskId)
    .eq('student_id', studentId)
    .single();

  if (existing) throw new ConflictError('You have already submitted this task');

  if (!submissionContent && !fileUrl) {
    throw new BadRequestError('Submission must include either text content or a file');
  }

  const { data, error } = await supabase
    .from('work_practice_submissions')
    .insert([{
      task_id: taskId,
      student_id: studentId,
      submission_content: submissionContent || null,
      file_url: fileUrl || null,
      file_name: fileName || null,
      file_size: fileSize || null,
      status: 'submitted',
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error creating WP submission:', error);
    throw new BadRequestError('Failed to submit task');
  }

  logger.info(`WP task ${taskId} submitted by student ${studentId}`);

  // ── Auto-run AI evaluation (non-blocking) ─────────────────────────────
  setImmediate(async () => {
    try {
      // We need the trainer ID to call runAiEvaluation — fetch from task
      const trainerId = task.trainer_id;
      await runAiEvaluation(data.id, trainerId);
    } catch (evalErr) {
      logger.error('[WP Auto-AI] Evaluation failed (non-blocking):', evalErr.message);
    }
  });

  return data;
};

/**
 * Get all submissions for a task (trainer only)
 */
export const getSubmissionsByTask = async (taskId, trainerId) => {
  const { data: task } = await supabase
    .from('work_practice_tasks')
    .select('id, trainer_id')
    .eq('id', taskId)
    .single();

  if (!task) throw new NotFoundError('Task not found');
  if (task.trainer_id !== trainerId) throw new ForbiddenError('Not authorized to view these submissions');

  const { data, error } = await supabase
    .from('work_practice_submissions')
    .select(`
      *,
      profiles!work_practice_submissions_student_id_fkey (id, first_name, last_name, email)
    `)
    .eq('task_id', taskId)
    .order('submitted_at', { ascending: false });

  if (error) throw new BadRequestError('Failed to fetch submissions');
  return data || [];
};

/**
 * Get a student's own submissions
 */
export const getMySubmissions = async (studentId) => {
  const { data, error } = await supabase
    .from('work_practice_submissions')
    .select(`
      *,
      work_practice_tasks (id, title, description, deadline, task_type)
    `)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });

  if (error) throw new BadRequestError('Failed to fetch submissions');
  return data || [];
};

/**
 * Get a single submission by ID
 */
export const getSubmissionById = async (submissionId, userId) => {
  const { data, error } = await supabase
    .from('work_practice_submissions')
    .select(`
      *,
      work_practice_tasks (id, title, description, trainer_id),
      profiles!work_practice_submissions_student_id_fkey (id, first_name, last_name, email)
    `)
    .eq('id', submissionId)
    .single();

  if (error || !data) throw new NotFoundError('Submission not found');

  // Only the student or the task's trainer can view
  const isStudent = data.student_id === userId;
  const isTrainer = data.work_practice_tasks?.trainer_id === userId;
  if (!isStudent && !isTrainer) throw new ForbiddenError('Not authorized to view this submission');

  return data;
};

// ─────────────────────────────────────────────
// GRADING (FR-WP-3, FR-WP-4)
// ─────────────────────────────────────────────

/**
 * Grade a submission (trainer only)
 */
export const gradeSubmission = async (submissionId, trainerId, gradeData) => {
  const { grade, feedback } = gradeData;

  if (grade === undefined || grade === null) throw new BadRequestError('Grade is required');
  if (grade < 0 || grade > 100) throw new BadRequestError('Grade must be between 0 and 100');

  const { data: submission } = await supabase
    .from('work_practice_submissions')
    .select('*, work_practice_tasks(trainer_id)')
    .eq('id', submissionId)
    .single();

  if (!submission) throw new NotFoundError('Submission not found');
  if (submission.work_practice_tasks?.trainer_id !== trainerId) {
    throw new ForbiddenError('Not authorized to grade this submission');
  }

  const { data, error } = await supabase
    .from('work_practice_submissions')
    .update({
      grade,
      feedback: feedback || null,
      status: 'graded',
      graded_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw new BadRequestError('Failed to grade submission');

  logger.info(`WP submission ${submissionId} graded by trainer ${trainerId}`);
  return data;
};

// ─────────────────────────────────────────────
// AI EVALUATION (FR-WP-3) — mirrors submissionService pattern
// ─────────────────────────────────────────────

import { evaluateSubmission } from './aiEvaluationService.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const AdmZip   = require('adm-zip');

const __filename_wp = fileURLToPath(import.meta.url);
const __dirname_wp  = path.dirname(__filename_wp);

// ── File type config ──────────────────────────────────────────────────────────

/** Text-readable extensions for plain files */
const TEXT_EXTS = new Set([
  '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.java',
  '.cpp', '.c', '.cs', '.php', '.html', '.css', '.json',
  '.yaml', '.yml', '.xml',
]);

/** Special filenames always included regardless of extension */
const PRIORITY_NAMES = new Set([
  'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  'jenkinsfile', 'package.json', 'readme.md', 'readme.txt',
  '.env.example', 'makefile',
]);

/** Directories to skip entirely when extracting ZIP */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'bin', 'obj',
  '.next', '__pycache__', '.venv', 'venv', 'vendor',
]);

const MAX_FILE_BYTES   = 100 * 1024;  // 100 KB per file
const MAX_FILES        = 20;          // max files to include in prompt
const MAX_TOTAL_CHARS  = 40000;       // total chars sent to AI

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve a stored URL/path to an absolute filesystem path */
const resolveFilePath = (fileUrl) => {
  if (!fileUrl) return null;
  const relative = fileUrl.replace(/^https?:\/\/[^/]+/, '');
  const abs = path.join(__dirname_wp, '../../', relative);
  return fs.existsSync(abs) ? abs : null;
};

/** Read a single plain-text or DOCX/PDF file */
const readFileContent = async (fileUrl) => {
  try {
    const filePath = resolveFilePath(fileUrl);
    if (!filePath) return '';
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return (result.value || '').trim().slice(0, 20000);
    }
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return (data.text || '').trim().slice(0, 20000);
    }
    if (TEXT_EXTS.has(ext)) {
      return fs.readFileSync(filePath, 'utf8').slice(0, 20000);
    }
    return '';
  } catch { return ''; }
};

/**
 * Extract a ZIP file and return an array of { filename, content } objects.
 * Prioritises important files, skips binaries/large files, prevents path traversal.
 * Cleans up the temp directory after reading.
 */
const extractZipContents = (zipFilePath) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-zip-'));
  const included = [];

  try {
    const zip = new AdmZip(zipFilePath);
    const entries = zip.getEntries();

    console.log(`[WP ZIP] Extracting ${entries.length} entries from ${path.basename(zipFilePath)}`);

    // Score each entry so we can prioritise
    const scored = entries
      .filter(e => {
        if (e.isDirectory) return false;
        const parts = e.entryName.replace(/\\/g, '/').split('/');
        // Skip if any path segment is a skip-dir
        if (parts.some(p => SKIP_DIRS.has(p.toLowerCase()))) return false;
        // Skip very large entries
        if (e.header.size > MAX_FILE_BYTES) return false;
        return true;
      })
      .map(e => {
        const name = path.basename(e.entryName).toLowerCase();
        const ext  = path.extname(name).toLowerCase();
        const isText     = TEXT_EXTS.has(ext);
        const isPriority = PRIORITY_NAMES.has(name);
        if (!isText && !isPriority) return null;
        return { entry: e, name, ext, isPriority, score: isPriority ? 100 : 50 };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    let totalChars = 0;

    for (const item of scored) {
      if (included.length >= MAX_FILES) break;
      if (totalChars >= MAX_TOTAL_CHARS) break;

      try {
        const raw = item.entry.getData().toString('utf8');
        const truncated = raw.slice(0, 8000); // max 8 KB per file in prompt
        included.push({ filename: item.entry.entryName, content: truncated });
        totalChars += truncated.length;
      } catch { /* skip unreadable */ }
    }

    console.log(`[WP ZIP] Included ${included.length} files, total chars: ${totalChars}`);
    console.log(`[WP ZIP] Files: ${included.map(f => f.filename).join(', ')}`);

  } finally {
    // Always clean up temp dir
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  return included;
};

/**
 * Build the AI prompt for a WP submission.
 * For project/coding tasks with a ZIP, includes extracted file contents.
 * For quiz/other tasks, uses text content only.
 */
const buildWpPrompt = (task, submissionContent, zipFiles) => {
  const taskType = (task?.task_type || 'other').toLowerCase();
  const isProjectOrCoding = taskType === 'project' || taskType === 'coding';

  let prompt = `Task Title: ${task?.title || 'Task'}\n`;
  prompt += `Task Type: ${task?.task_type || 'other'}\n`;
  prompt += `Task Description: ${task?.description || ''}\n`;
  if (task?.instructions) {
    prompt += `Task Instructions: ${task.instructions}\n`;
  }
  prompt += '\n';

  if (submissionContent && submissionContent.trim()) {
    prompt += `Student Written Explanation:\n${submissionContent.trim()}\n\n`;
  }

  if (isProjectOrCoding && zipFiles && zipFiles.length > 0) {
    prompt += `Project Files (${zipFiles.length} files extracted from ZIP):\n`;
    for (const f of zipFiles) {
      prompt += `\n--- filename: ${f.filename} ---\n${f.content}\n`;
    }
    prompt += '\n';
  }

  return prompt;
};

/**
 * Run AI evaluation on a WP submission (trainer-triggered or auto on submit).
 */
export const runAiEvaluation = async (submissionId, trainerId) => {
  const { data: submission, error: subError } = await supabase
    .from('work_practice_submissions')
    .select('*, work_practice_tasks(id, title, description, instructions, task_type, trainer_id)')
    .eq('id', submissionId)
    .single();

  if (subError || !submission) throw new NotFoundError('Submission not found');
  if (submission.work_practice_tasks?.trainer_id !== trainerId) {
    throw new ForbiddenError('Not authorized to evaluate this submission');
  }

  const task = submission.work_practice_tasks;
  const taskType = (task?.task_type || 'other').toLowerCase();
  const isProjectOrCoding = taskType === 'project' || taskType === 'coding';

  // ── Extract ZIP contents if applicable ───────────────────────────────────
  let zipFiles = [];
  if (isProjectOrCoding && submission.file_url) {
    const filePath = resolveFilePath(submission.file_url);
    if (filePath && path.extname(filePath).toLowerCase() === '.zip') {
      try {
        zipFiles = extractZipContents(filePath);
      } catch (zipErr) {
        logger.warn(`[WP AI] ZIP extraction failed (non-blocking): ${zipErr.message}`);
      }
    }
  }

  // ── Build submission content ──────────────────────────────────────────────
  const textContent = submission.submission_content || '';

  // For non-ZIP files (DOCX, PDF, plain text), read normally
  let fileTextContent = '';
  if (submission.file_url && zipFiles.length === 0) {
    fileTextContent = await readFileContent(submission.file_url);
  }

  const combinedText = [textContent, fileTextContent].filter(Boolean).join('\n\n');

  // Build the enriched prompt
  const enrichedPrompt = buildWpPrompt(task, combinedText, zipFiles);

  // Fallback if nothing was extracted
  const effectiveContent = enrichedPrompt.trim() ||
    `[Student submitted file: ${submission.file_name || 'unknown'}. Content could not be extracted.]`;

  console.log(`[WP AI] Evaluating submission ${submissionId}`);
  console.log(`[WP AI] Task type: ${taskType}, ZIP files: ${zipFiles.length}, text length: ${combinedText.length}`);
  console.log(`[WP AI] Total prompt length: ${effectiveContent.length} chars`);

  // ── Plagiarism comparison ─────────────────────────────────────────────────
  const { data: otherSubs } = await supabase
    .from('work_practice_submissions')
    .select('id, file_url, submission_content')
    .eq('task_id', submission.task_id)
    .neq('id', submissionId);

  const otherSubmissions = await Promise.all((otherSubs || []).map(async (s) => ({
    id: s.id,
    content: s.submission_content || await readFileContent(s.file_url),
  })));

  // ── Call AI ───────────────────────────────────────────────────────────────
  const question = [task?.description, task?.instructions].filter(Boolean).join('\n\n') || task?.title || 'Task';

  const result = evaluateSubmission({
    submissionContent:     effectiveContent,
    assignmentTitle:       task?.title || '',
    assignmentDescription: question,
    otherSubmissions,
  });

  const missingConceptsJson = JSON.stringify(result.missingConcepts || []);
  const newStatus = result.flagged ? 'flagged' : submission.status === 'submitted' ? 'submitted' : submission.status;

  console.log(`[WP AI] Result: score=${result.aiScore} status=${result.aiStatus} plagiarism=${result.plagiarismPercentage}%`);

  const { data: updated, error: updateError } = await supabase
    .from('work_practice_submissions')
    .update({
      ai_score:              result.aiScore,
      final_score:           result.aiScore,
      ai_feedback:           result.aiFeedback,
      missing_concepts:      missingConceptsJson,
      plagiarism_percentage: result.plagiarismPercentage,
      plagiarism_status:     result.plagiarismStatus,
      ai_status:             result.aiStatus,
      status:                newStatus,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (updateError) {
    logger.error('[WP AI] DB update error:', updateError.message);
    throw new BadRequestError(`Failed to save AI evaluation: ${updateError.message}`);
  }

  logger.info(`WP AI evaluation completed for submission ${submissionId}: ai=${result.aiScore} plagiarism=${result.plagiarismPercentage}%`);
  return updated;
};

/**
 * Trainer finalizes a WP submission with optional score override and feedback.
 */
export const finalizeWpSubmission = async (submissionId, trainerId, { finalScore, trainerFeedback }) => {
  const { data: submission, error: subError } = await supabase
    .from('work_practice_submissions')
    .select('*, work_practice_tasks(id, title, trainer_id)')
    .eq('id', submissionId)
    .single();

  if (subError || !submission) throw new NotFoundError('Submission not found');
  if (submission.work_practice_tasks?.trainer_id !== trainerId) {
    throw new ForbiddenError('Not authorized to finalize this submission');
  }

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
    updatePayload.feedback         = trainerFeedback;
  }

  console.log(`[WP Finalize] submissionId=${submissionId} payload:`, JSON.stringify(updatePayload));

  const { data: updated, error: updateError } = await supabase
    .from('work_practice_submissions')
    .update(updatePayload)
    .eq('id', submissionId)
    .select()
    .single();

  if (updateError) {
    logger.error('[WP Finalize] Supabase error:', JSON.stringify(updateError));
    throw new BadRequestError(`Failed to finalize submission: ${updateError.message}`);
  }

  // Fresh select to guarantee latest data
  const { data: fresh } = await supabase
    .from('work_practice_submissions')
    .select(`*, profiles!work_practice_submissions_student_id_fkey(id, email, first_name, last_name)`)
    .eq('id', submissionId)
    .single();

  console.log(`[WP Finalize] Done — ai_status=${fresh?.ai_status} final_score=${fresh?.final_score}`);
  return fresh || updated;
};

/**
 * Get a WP submission by ID for the student (their own only).
 */
export const getMySubmissionById = async (submissionId, studentId) => {
  const { data, error } = await supabase
    .from('work_practice_submissions')
    .select('*, work_practice_tasks(id, title, description, task_type)')
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .single();

  if (error || !data) throw new NotFoundError('Submission not found');
  return data;
};
