/**
 * User Controller
 * Handle user-related HTTP requests
 */

import logger from '../utils/logger.js';
import * as userService from '../services/userService.js';
import * as enrollmentService from '../services/enrollmentService.js';

/**
 * Get current authenticated user
 * GET /api/users/me
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // User is already attached to req.user by authMiddleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'Unauthorized',
      });
    }

    logger.info(`User profile retrieved: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 * GET /api/users/profile
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profile = await userService.getUserProfile(userId);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile (PUT — full update, kept for backward compat)
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, bio, skills, avatar_url } = req.body;

    if (req.body.role) {
      return res.status(403).json({
        success: false,
        message: 'Role cannot be modified through profile update',
        error: 'Forbidden',
      });
    }

    const updatedProfile = await userService.updateUserProfile(userId, {
      firstName, lastName, bio, skills, avatar_url,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile (PATCH — partial update with optional avatar upload)
 * PATCH /api/users/profile
 */
export const patchProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, bio, skills } = req.body;
    const file = req.file;

    if (req.body.role) {
      return res.status(403).json({
        success: false,
        message: 'Role cannot be modified through profile update',
        error: 'Forbidden',
      });
    }

    const updatePayload = { firstName, lastName, bio, skills };

    // If a file was uploaded, build the full absolute URL and store it
    if (file) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      updatePayload.profile_picture_url = `${backendUrl}/uploads/avatars/${file.filename}`;
    }

    const updatedProfile = await userService.updateUserProfile(userId, updatePayload);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll via QR code (POST — token in body)
 * POST /api/enroll/qr
 */
export const enrollViaQRPost = async (req, res, next) => {
  try {
    const { token } = req.body;
    const studentId = req.user.id;
    const studentRole = req.user.role;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'QR token is required',
        error: 'Validation Error',
      });
    }

    const result = await userService.validateAndEnrollViaQR(studentId, token, studentRole);

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled via QR code',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * PUT /api/users/password
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        error: 'Validation Error',
      });
    }

    await userService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email with token
 * POST /api/auth/verify-email
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
        error: 'Validation Error',
      });
    }

    const result = await userService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll via QR code
 * GET /api/enroll/qr/:token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const enrollViaQR = async (req, res, next) => {
  try {
    const { token } = req.params;
    const studentId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'QR token is required',
        error: 'Validation Error',
      });
    }

    // Validate QR token and get course
    const { courseId, course } = await userService.validateQREnrollmentToken(token);

    // Enroll student in the course
    const enrollment = await enrollmentService.enrollStudent(studentId, courseId);

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course via QR code',
      data: {
        enrollment,
        course,
      },
    });
  } catch (error) {
    next(error);
  }
};
