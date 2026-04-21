import express from 'express';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/verify-email', userController.verifyEmail);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

export default router;
