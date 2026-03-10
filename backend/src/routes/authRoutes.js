/**
 * Authentication Routes
 * Define authentication endpoints
 */

import express from 'express';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * Sign up a new user
 * POST /api/auth/signup
 */
router.post('/signup', authLimiter, authController.signup);

/**
 * Sign in a user
 * POST /api/auth/login
 */
router.post('/login', authLimiter, authController.login);

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
router.post('/verify-email', userController.verifyEmail);

export default router;
