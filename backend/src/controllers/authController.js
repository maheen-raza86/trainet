/**
 * Authentication Controller
 * Handle authentication HTTP requests
 */

import * as authService from '../services/authService.js';
import logger from '../utils/logger.js';
import { supabaseAuthClient, supabaseAdminClient } from '../config/supabaseClient.js';
import config from '../config/env.js';

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

/**
 * Sign out — clears the Supabase session on the server side
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    // Sign out from Supabase auth client so the session is invalidated server-side.
    // This prevents stale sessions from interfering with the next login.
    await supabaseAuthClient.auth.signOut();
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    // Non-critical — always return success so the client can proceed
    res.status(200).json({ success: true, message: 'Logged out' });
  }
};
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'Validation Error',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Validation Error',
      });
    }

    const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;

    const { error } = await supabaseAuthClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      logger.error('Supabase resetPasswordForEmail error:', error);
      // Still return success to avoid email enumeration
    }

    logger.info(`Password reset email requested for: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using Supabase session token
 * POST /api/auth/reset-password
 * Body: { accessToken, password }
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { accessToken, password } = req.body;

    if (!accessToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Access token and password are required',
        error: 'Validation Error',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        error: 'Validation Error',
      });
    }

    // Verify the access token and get the user
    const { data: { user }, error: userError } = await supabaseAuthClient.auth.getUser(accessToken);

    if (userError || !user) {
      logger.error('Invalid or expired reset token:', userError);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.',
        error: 'Invalid Token',
      });
    }

    // Update the password using the admin client
    const { error: updateError } = await supabaseAdminClient.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      logger.error('Error updating password:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset password. Please try again.',
        error: 'Internal Server Error',
      });
    }

    logger.info(`Password reset successful for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};