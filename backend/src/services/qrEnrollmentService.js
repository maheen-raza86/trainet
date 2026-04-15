/**
 * QR Enrollment Service
 * Handle QR code generation for course enrollment
 */

import supabase from '../config/supabaseClient.js';
import { supabaseAdminClient } from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import crypto from 'crypto';

/**
 * Generate QR enrollment token for a course offering
 * @param {string} trainerId - Trainer user ID
 * @param {string} offeringId - Course offering ID
 * @param {Object} options - Token options
 * @param {number} options.expiryDays - Days until token expires (default: 30)
 * @param {boolean} options.isSingleUse - Whether token can only be used once (default: false)
 * @returns {Promise<Object>} QR token data
 */
export const generateQRToken = async (trainerId, offeringId, options = {}) => {
  try {
    const { expiryDays = 30, isSingleUse = false } = options;

    // Verify offering exists and belongs to trainer
    const { data: offering, error: offeringError } = await supabase
      .from('course_offerings')
      .select('id, trainer_id, status')
      .eq('id', offeringId)
      .single();

    if (offeringError || !offering) {
      throw new NotFoundError('Course offering not found');
    }

    if (offering.trainer_id !== trainerId) {
      throw new ForbiddenError('You can only generate QR codes for your own course offerings');
    }

    // Generate unique token
    const token = `QR-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create QR token in database — use admin client to bypass RLS
    const insertPayload = {
      offering_id: offeringId,
      token,
      expires_at: expiresAt.toISOString(),
      is_single_use: isSingleUse,
    };
    logger.info(`Inserting QR token payload: ${JSON.stringify(insertPayload)}`);

    const { data, error } = await supabaseAdminClient
      .from('enrollment_qr_tokens')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      logger.error('Error creating QR token (full error):', JSON.stringify(error));
      throw new BadRequestError(`Failed to generate QR code: ${error.message || error.code || 'Unknown error'}`);
    }

    logger.info(`QR token generated for offering ${offeringId} by trainer ${trainerId}`);

    return {
      ...data,
      enrollUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/enroll?token=${token}`,
    };
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ForbiddenError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error generating QR token:', error);
    throw new BadRequestError('Failed to generate QR code');
  }
};

/**
 * Get active QR tokens for a course offering
 * @param {string} trainerId - Trainer user ID
 * @param {string} offeringId - Course offering ID
 * @returns {Promise<Array>} List of active QR tokens
 */
export const getOfferingQRTokens = async (trainerId, offeringId) => {
  try {
    // Verify offering belongs to trainer
    const { data: offering, error: offeringError } = await supabase
      .from('course_offerings')
      .select('id, trainer_id')
      .eq('id', offeringId)
      .single();

    if (offeringError || !offering) {
      throw new NotFoundError('Course offering not found');
    }

    if (offering.trainer_id !== trainerId) {
      throw new ForbiddenError('You can only view QR codes for your own course offerings');
    }

    // Get active (non-expired) tokens
    const { data, error } = await supabase
      .from('enrollment_qr_tokens')
      .select('*')
      .eq('offering_id', offeringId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching QR tokens:', error);
      throw new BadRequestError('Failed to fetch QR codes');
    }

    // Add enroll URLs
    const tokensWithUrls = (data || []).map(token => ({
      ...token,
      enrollUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/enroll?token=${token.token}`,
    }));

    return tokensWithUrls;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ForbiddenError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error fetching QR tokens:', error);
    throw new BadRequestError('Failed to fetch QR codes');
  }
};

/**
 * Delete/revoke a QR token
 * @param {string} trainerId - Trainer user ID
 * @param {string} tokenId - QR token ID
 * @returns {Promise<boolean>} Success status
 */
export const revokeQRToken = async (trainerId, tokenId) => {
  try {
    // Get token with offering info
    const { data: token, error: tokenError } = await supabase
      .from('enrollment_qr_tokens')
      .select(`
        *,
        course_offerings (trainer_id)
      `)
      .eq('id', tokenId)
      .single();

    if (tokenError || !token) {
      throw new NotFoundError('QR token not found');
    }

    if (token.course_offerings?.trainer_id !== trainerId) {
      throw new ForbiddenError('You can only revoke your own QR codes');
    }

    // Delete token
    const { error } = await supabase
      .from('enrollment_qr_tokens')
      .delete()
      .eq('id', tokenId);

    if (error) {
      logger.error('Error revoking QR token:', error);
      throw new BadRequestError('Failed to revoke QR code');
    }

    logger.info(`QR token ${tokenId} revoked by trainer ${trainerId}`);

    return true;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ForbiddenError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error revoking QR token:', error);
    throw new BadRequestError('Failed to revoke QR code');
  }
};
