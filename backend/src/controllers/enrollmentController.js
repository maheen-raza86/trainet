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
    // SRDS: direct enrollment is disabled — must use QR token
    return res.status(410).json({
      success: false,
      message: 'Direct enrollment is disabled. Students must enroll via QR code. Use POST /api/enroll/qr with a valid token.',
      error: 'Gone',
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
