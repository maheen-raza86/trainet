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
