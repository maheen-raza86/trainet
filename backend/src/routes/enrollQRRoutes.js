/**
 * QR Enrollment Routes
 * Define QR-based enrollment endpoints
 */

import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Enroll via QR code
 * GET /api/enroll/qr/:token
 * Protected route - requires authentication
 */
router.get('/qr/:token', verifyToken, userController.enrollViaQR);

export default router;
