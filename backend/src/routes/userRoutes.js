/**
 * User Routes
 * Define user-related endpoints
 */

import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Get current authenticated user
 * GET /api/users/me
 * Protected route - requires authentication
 */
router.get('/me', verifyToken, userController.getCurrentUser);

/**
 * Get user profile
 * GET /api/users/profile
 * Protected route - requires authentication
 */
router.get('/profile', verifyToken, userController.getUserProfile);

/**
 * Update user profile
 * PUT /api/users/profile
 * Protected route - requires authentication
 */
router.put('/profile', verifyToken, userController.updateProfile);

/**
 * Change password
 * PUT /api/users/password
 * Protected route - requires authentication
 */
router.put('/password', verifyToken, userController.changePassword);

export default router;
