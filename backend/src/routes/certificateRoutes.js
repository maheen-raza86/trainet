/**
 * Certificate Routes
 * SRDS FR-CV-1 through FR-CV-5
 */

import express from 'express';
import * as certificateController from '../controllers/certificateController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Issue a certificate (student only)
router.post('/issue', verifyToken, authorizeRoles('student'), certificateController.issueCertificate);

// Trainer issues certificate for a student
router.post('/trainer/issue', verifyToken, authorizeRoles('trainer'), certificateController.trainerIssueCertificate);

// Get my certificates (student only)
router.get('/my', verifyToken, authorizeRoles('student'), certificateController.getMyCertificates);

// Check eligibility for a specific offering (student only)
router.get('/eligibility/:offeringId', verifyToken, authorizeRoles('student'), certificateController.checkEligibility);

// PUBLIC verification endpoint — no auth required (FR-CV-3, FR-CV-4)
router.get('/verify/:certificateUuid', certificateController.verifyCertificate);

export default router;
