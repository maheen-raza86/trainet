/**
 * Trainer Verification Middleware
 * Blocks trainer actions if trainer_status is not 'approved'.
 * Must be used AFTER verifyToken + authorizeRoles('trainer').
 *
 * Backward compatibility: trainer_status = null means legacy trainer → approved.
 */

import { ForbiddenError } from '../utils/errors.js';

export const requireApprovedTrainer = (req, res, next) => {
  try {
    const status = req.user?.trainerStatus;

    // null = legacy trainer (existed before this feature) → treat as approved
    if (status === null || status === 'approved') {
      return next();
    }

    if (status === 'pending') {
      throw new ForbiddenError(
        'Your trainer account is under review by admin. You will be notified once approved.'
      );
    }

    if (status === 'rejected') {
      throw new ForbiddenError(
        'Your trainer application was not approved. Please contact support for more information.'
      );
    }

    // Unknown status — block by default
    throw new ForbiddenError('Trainer account not approved.');
  } catch (error) {
    next(error);
  }
};
