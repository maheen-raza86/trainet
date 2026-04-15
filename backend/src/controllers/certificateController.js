/**
 * Certificate Controller
 * SRDS FR-CV-1 through FR-CV-5
 */

import * as certificateService from '../services/certificateService.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Issue a certificate for the authenticated student.
 * POST /api/certificates/issue
 * Body: { offeringId }
 */
export const issueCertificate = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { offeringId } = req.body;

    if (!offeringId) throw new BadRequestError('offeringId is required');

    const cert = await certificateService.issueCertificate(studentId, offeringId);

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: cert,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all certificates for the authenticated student.
 * GET /api/certificates/my
 */
export const getMyCertificates = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const certs = await certificateService.getStudentCertificates(studentId);

    res.status(200).json({
      success: true,
      message: 'Certificates retrieved successfully',
      data: { certificates: certs, count: certs.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public certificate verification endpoint.
 * GET /api/certificates/verify/:certificateUuid
 * No authentication required.
 */
export const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateUuid } = req.params;

    if (!certificateUuid) throw new BadRequestError('Certificate UUID is required');

    const result = await certificateService.verifyCertificate(certificateUuid);

    // Log the IP for audit purposes
    logger.info(`Certificate verification: ${certificateUuid} → ${result.status} from ${req.ip}`);

    // Always 200 — the status field tells the client the result
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trainer issues certificate for a specific student.
 * POST /api/certificates/trainer/issue
 * Body: { studentId, offeringId }
 */
export const trainerIssueCertificate = async (req, res, next) => {
  try {
    const { studentId, offeringId } = req.body;
    if (!studentId || !offeringId) throw new BadRequestError('studentId and offeringId are required');

    const cert = await certificateService.issueCertificate(studentId, offeringId);

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: cert,
    });
  } catch (error) {
    next(error);
  }
};
export const checkEligibility = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { offeringId } = req.params;

    const result = await certificateService.checkEligibility(studentId, offeringId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
