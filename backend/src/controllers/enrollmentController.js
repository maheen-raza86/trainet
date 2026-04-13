/**
 * Enrollment Controller
 * Handle enrollment-related HTTP requests
 */

import * as enrollmentService from '../services/enrollmentService.js';

/**
 * Enroll in course
 * POST /api/enrollments
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    // Validate required fields
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
        error: 'Validation Error',
      });
    }

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can enroll in courses',
        error: 'Forbidden',
      });
    }

    const enrollment = await enrollmentService.enrollStudent(studentId, courseId);

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
 * Get enrollments for a course offering (trainer use)
 * GET /api/enrollments/offering/:offeringId
 */
export const getEnrollmentsByOffering = async (req, res, next) => {
  try {
    const { offeringId } = req.params;
    const enrollments = await enrollmentService.getEnrollmentsByOffering(offeringId);
    res.status(200).json({
      success: true,
      message: 'Enrollments retrieved successfully',
      data: { enrollments, count: enrollments.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my enrollments
 * GET /api/enrollments/my
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getMyEnrollments = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const enrollments = await enrollmentService.getStudentEnrollments(studentId);

    res.status(200).json({
      success: true,
      message: 'Enrollments retrieved successfully',
      data: {
        enrollments,
        count: enrollments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
