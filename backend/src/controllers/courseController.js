/**
 * Course Controller
 * Handle course-related HTTP requests
 */

import * as courseService from '../services/courseService.js';
import logger from '../utils/logger.js';

/**
 * Get all courses
 * GET /api/courses
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getAllCourses();

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: {
        courses,
        count: courses.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course by ID
 * GET /api/courses/:id
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
        error: 'Validation Error',
      });
    }

    const course = await courseService.getCourseById(id);

    res.status(200).json({
      success: true,
      message: 'Course retrieved successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll student in course
 * POST /api/courses/enroll
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
        error: 'Validation Error',
      });
    }

    const enrollment = await courseService.enrollStudent(studentId, courseId);

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's enrolled courses
 * GET /api/courses/my-courses
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getMyEnrolledCourses = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const enrollments = await courseService.getStudentCourses(studentId);

    res.status(200).json({
      success: true,
      message: 'Enrolled courses retrieved successfully',
      data: {
        enrollments,
        count: enrollments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create assignment for a course
 * POST /api/courses/:courseId/assignments
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const trainerId = req.user.id;
    const { title, description, dueDate, maxScore } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
        error: 'Validation Error',
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
        error: 'Validation Error',
      });
    }

    const assignment = await courseService.createAssignment(courseId, trainerId, {
      title,
      description,
      dueDate,
      maxScore,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit assignment
 * POST /api/assignments/:assignmentId/submit
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const { content, attachmentUrl } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Submission content is required',
        error: 'Validation Error',
      });
    }

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required',
        error: 'Validation Error',
      });
    }

    const submission = await courseService.submitAssignment(assignmentId, studentId, {
      content,
      attachmentUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};
