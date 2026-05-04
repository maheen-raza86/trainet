/**
 * Trainer Application Controller
 */

import * as trainerAppService from '../services/trainerApplicationService.js';
import logger from '../utils/logger.js';

/**
 * POST /api/trainer-application
 * Trainer submits (or re-submits) their verification application.
 */
export const submitApplication = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { experience, skills, bio } = req.body;
    const cvFile = req.file || null;

    const app = await trainerAppService.submitApplication(
      trainerId,
      { experience, skills, bio },
      cvFile
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. An admin will review it shortly.',
      data: app,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trainer-application/status
 * Trainer checks their own application status.
 */
export const getMyStatus = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const result = await trainerAppService.getMyApplication(trainerId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/trainer-applications
 * Admin lists all trainer applications.
 * Optional query param: ?status=pending|approved|rejected
 */
export const listApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const apps = await trainerAppService.listApplications(status || null);

    res.status(200).json({
      success: true,
      data: { applications: apps, count: apps.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/trainers
 * Admin lists all trainers with their status and application.
 */
export const listAllTrainers = async (req, res, next) => {
  try {
    const trainers = await trainerAppService.listAllTrainers();

    res.status(200).json({
      success: true,
      data: { trainers, count: trainers.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/trainer-applications/:trainerId/review
 * Admin approves or rejects a trainer.
 * Body: { decision: 'approved' | 'rejected', adminNotes?: string }
 */
export const reviewApplication = async (req, res, next) => {
  try {
    const { trainerId } = req.params;
    const adminId = req.user.id;
    const { decision, adminNotes } = req.body;

    if (!decision) {
      return res.status(400).json({
        success: false,
        message: 'decision is required (approved or rejected)',
        error: 'Validation Error',
      });
    }

    const result = await trainerAppService.reviewApplication(
      trainerId,
      adminId,
      decision,
      adminNotes || ''
    );

    res.status(200).json({
      success: true,
      message: `Trainer ${decision} successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
