/**
 * Authentication Controller
 * Handle authentication HTTP requests
 */

import * as authService from '../services/authService.js';
import logger from '../utils/logger.js';

/**
 * Sign up a new user
 * POST /api/auth/signup
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const signup = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'Validation Error',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Validation Error',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        error: 'Validation Error',
      });
    }

    // Validate name lengths
    if (firstName.length < 2 || firstName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'First name must be between 2 and 50 characters',
        error: 'Validation Error',
      });
    }

    if (lastName.length < 2 || lastName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be between 2 and 50 characters',
        error: 'Validation Error',
      });
    }

    // Validate role if provided
    const validRoles = ['student', 'trainer', 'alumni', 'recruiter', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: student, trainer, alumni, recruiter, admin',
        error: 'Validation Error',
      });
    }

    const result = await authService.signUp({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign in a user
 * POST /api/auth/login
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Validation Error',
      });
    }

    const result = await authService.signIn({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
