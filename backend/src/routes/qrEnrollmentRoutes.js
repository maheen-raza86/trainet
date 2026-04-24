/**
 * QR Enrollment Routes
 * Define QR enrollment-related endpoints
 */

import express from 'express';
import * as qrEnrollmentController from '../controllers/qrEnrollmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import config from '../config/env.js';

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
 * Get active QR token for a course offering (student-accessible)
 * GET /api/qr-enrollment/enroll-token/:offeringId
 * Returns the enrollment URL for the student to use
 */
router.get('/enroll-token/:offeringId', verifyToken, authorizeRoles('student'), async (req, res, next) => {
  try {
    const { offeringId } = req.params;
    const { supabaseAdminClient } = await import('../config/supabaseClient.js');
    const { data, error } = await supabaseAdminClient
      .from('enrollment_qr_tokens')
      .select('id, token, expires_at')
      .eq('offering_id', offeringId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'No active QR token found for this offering' });
    }

    const enrollUrl = `${config.frontendUrl}/enroll?token=${data.token}`;
    res.status(200).json({ success: true, data: { token: data.token, enrollUrl, expires_at: data.expires_at } });
  } catch (err) { next(err); }
});

/**
 * Revoke QR token
 * DELETE /api/qr-enrollment/:tokenId
 * Protected route - requires trainer role
 */
router.delete('/:tokenId', verifyToken, authorizeRoles('trainer'), qrEnrollmentController.revokeQRToken);

export default router;
