/**
 * QR Enrollment Controller
 * Handle QR enrollment-related HTTP requests
 */

import * as qrEnrollmentService from '../services/qrEnrollmentService.js';

/**
 * Generate QR token for course offering
 * POST /api/qr-enrollment/generate
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const generateQRToken = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { offeringId, expiryDays, isSingleUse } = req.body;

    if (!offeringId) {
      return res.status(400).json({
        success: false,
        message: 'Course offering ID is required',
        error: 'Validation Error',
      });
    }

    const qrToken = await qrEnrollmentService.generateQRToken(trainerId, offeringId, {
      expiryDays,
      isSingleUse,
    });

    res.status(201).json({
      success: true,
      message: 'QR code generated successfully',
      data: qrToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get QR tokens for course offering
 * GET /api/qr-enrollment/offering/:offeringId
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const getOfferingQRTokens = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { offeringId } = req.params;

    const tokens = await qrEnrollmentService.getOfferingQRTokens(trainerId, offeringId);

    res.status(200).json({
      success: true,
      message: 'QR codes retrieved successfully',
      data: {
        tokens,
        count: tokens.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke QR token
 * DELETE /api/qr-enrollment/:tokenId
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const revokeQRToken = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { tokenId } = req.params;

    await qrEnrollmentService.revokeQRToken(trainerId, tokenId);

    res.status(200).json({
      success: true,
      message: 'QR code revoked successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
