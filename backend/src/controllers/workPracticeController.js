/**
 * Work & Practice Controller
 * SRDS FR-WP-1 through FR-WP-4
 */

import * as wpService from '../services/workPracticeService.js';
import { BadRequestError } from '../utils/errors.js';

// ── Tasks ──────────────────────────────────────────────────────────────────

export const createTask = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { title, description, instructions, resourceUrl, taskType, deadline, offeringId } = req.body;
    const file = req.file;

    // If a resource file was uploaded, use its URL
    const finalResourceUrl = file
      ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`
      : resourceUrl || null;

    const task = await wpService.createTask(trainerId, {
      title, description, instructions, resourceUrl: finalResourceUrl,
      taskType, deadline, offeringId,
    });

    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error) { next(error); }
};

export const getTrainerTasks = async (req, res, next) => {
  try {
    const tasks = await wpService.getTrainerTasks(req.user.id);
    res.status(200).json({ success: true, data: { tasks, count: tasks.length } });
  } catch (error) { next(error); }
};

export const getStudentTasks = async (req, res, next) => {
  try {
    const tasks = await wpService.getStudentTasks(req.user.id);
    res.status(200).json({ success: true, data: { tasks, count: tasks.length } });
  } catch (error) { next(error); }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await wpService.getTaskById(req.params.id);
    res.status(200).json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await wpService.updateTask(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Task updated', data: task });
  } catch (error) { next(error); }
};

export const deleteTask = async (req, res, next) => {
  try {
    await wpService.deleteTask(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
};

// ── Submissions ────────────────────────────────────────────────────────────

export const submitTask = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const taskId = req.params.id;
    const { submissionContent } = req.body;
    const file = req.file;

    let fileUrl = null, fileName = null, fileSize = null;
    if (file) {
      fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
      fileName = file.originalname;
      fileSize = file.size;
    }

    const submission = await wpService.submitTask(taskId, studentId, {
      submissionContent, fileUrl, fileName, fileSize,
    });

    res.status(201).json({ success: true, message: 'Task submitted successfully', data: submission });
  } catch (error) { next(error); }
};

export const getSubmissionsByTask = async (req, res, next) => {
  try {
    const submissions = await wpService.getSubmissionsByTask(req.params.taskId, req.user.id);
    res.status(200).json({ success: true, data: { submissions, count: submissions.length } });
  } catch (error) { next(error); }
};

export const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await wpService.getMySubmissions(req.user.id);
    res.status(200).json({ success: true, data: { submissions, count: submissions.length } });
  } catch (error) { next(error); }
};

export const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await wpService.getSubmissionById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: submission });
  } catch (error) { next(error); }
};

export const gradeSubmission = async (req, res, next) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await wpService.gradeSubmission(req.params.id, req.user.id, { grade, feedback });
    res.status(200).json({ success: true, message: 'Submission graded', data: submission });
  } catch (error) { next(error); }
};
