/**
 * QR Enrollment Routes
 * Define QR enrollment-related endpoints
 */

import express from 'express';
import * as qrEnrollmentController from '../controllers/qrEnrollmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * Generate QR token for course offering
 * POST /api/qr-enrollment/generate
 * Protected route - requires trainer role
 */
router.post('/generate', verifyToken, authorizeRoles('trainer'), qrEnrollmentController.generateQRToken);

/**
 * Get QR tokens for course offering
 * GET /api/qr-enrollment/offering/:offeringId
 * Protected route - requires trainer role
 */
router.get('/offering/:offeringId', verifyToken, authorizeRoles('trainer'), qrEnrollmentController.getOfferingQRTokens);

/**
 * Revoke QR token
 * DELETE /api/qr-enrollment/:tokenId
 * Protected route - requires trainer role
 */
router.delete('/:tokenId', verifyToken, authorizeRoles('trainer'), qrEnrollmentController.revokeQRToken);

export default router;
