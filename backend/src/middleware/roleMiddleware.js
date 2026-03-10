/**
 * Role Authorization Middleware
 * Restrict access based on user roles
 */

import { ForbiddenError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Authorize specific roles
 * Must be used after authMiddleware.verifyToken
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is attached to request (should be set by authMiddleware)
      if (!req.user) {
        logger.error('authorizeRoles called without authenticated user');
        throw new ForbiddenError('Authentication required');
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          `Access denied for user ${req.user.id} with role ${req.user.role}. Required: ${allowedRoles.join(', ')}`
        );
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
