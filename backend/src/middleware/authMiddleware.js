/**
 * Authentication Middleware
 * Verify JWT tokens and attach user to request
 */

import supabase from '../config/supabaseClient.js';
import { UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Verify authentication token
 * Extracts token from Authorization header, verifies it, and attaches user to req.user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Step 1: Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided. Authorization header must be: Bearer <token>');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new UnauthorizedError('Token is missing');
    }

    // Step 2: Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.warn('Invalid token attempt:', authError?.message);
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Step 3: Fetch user profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      logger.error('User profile not found for authenticated user:', user.id);
      throw new UnauthorizedError('User profile not found');
    }

    // Step 4: Attach user object to request
    req.user = {
      id: profileData.id,
      email: profileData.email,
      firstName: profileData.first_name,
      lastName: profileData.last_name,
      role: profileData.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
