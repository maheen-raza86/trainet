/**
 * Trainer Application Service
 * Handles trainer verification application submission and admin review.
 */

import { supabaseAdminClient } from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { uploadFile } from '../utils/storageService.js';

/**
 * Submit or update a trainer application.
 * A trainer can re-submit after rejection.
 */
export const submitApplication = async (trainerId, data, cvFile = null) => {
  const { experience, skills, bio } = data;

  if (!experience || !skills || !bio) {
    throw new BadRequestError('experience, skills, and bio are required');
  }
  if (bio.length < 20) {
    throw new BadRequestError('Bio must be at least 20 characters');
  }

  let cvUrl = null;
  if (cvFile) {
    cvUrl = await uploadFile({
      buffer: cvFile.buffer,
      folder: 'trainer-cvs',
      originalName: cvFile.originalname,
      mimeType: cvFile.mimetype,
      userId: trainerId,
    });
  }

  // Upsert — trainer can re-submit after rejection
  const { data: app, error } = await supabaseAdminClient
    .from('trainer_applications')
    .upsert(
      {
        trainer_id: trainerId,
        experience,
        skills,
        bio,
        cv_url: cvUrl,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        admin_notes: null,
      },
      { onConflict: 'trainer_id' }
    )
    .select()
    .single();

  if (error) {
    logger.error('Error submitting trainer application:', error);
    throw new BadRequestError('Failed to submit application');
  }

  // Reset status to pending on re-submission
  const { error: profileErr } = await supabaseAdminClient
    .from('profiles')
    .update({ trainer_status: 'pending' })
    .eq('id', trainerId);

  if (profileErr) {
    logger.error('Error resetting trainer_status to pending:', profileErr);
  }

  logger.info(`Trainer application submitted by ${trainerId}`);
  return app;
};

/**
 * Get the current trainer's own application status.
 */
export const getMyApplication = async (trainerId) => {
  const { data: profile } = await supabaseAdminClient
    .from('profiles')
    .select('trainer_status')
    .eq('id', trainerId)
    .single();

  const { data: app } = await supabaseAdminClient
    .from('trainer_applications')
    .select('*')
    .eq('trainer_id', trainerId)
    .single();

  return {
    trainerStatus: profile?.trainer_status ?? 'approved',
    application: app || null,
  };
};

/**
 * Admin: list all trainer applications with trainer profile info.
 * Uses two separate queries instead of a join to avoid PostgREST schema cache issues.
 * Optionally filter by status.
 */
export const listApplications = async (statusFilter = null) => {
  // Query 1: all applications
  const { data: applications, error: appsErr } = await supabaseAdminClient
    .from('trainer_applications')
    .select('id, trainer_id, experience, skills, bio, cv_url, submitted_at, reviewed_at, admin_notes')
    .order('submitted_at', { ascending: false });

  if (appsErr) {
    logger.error('Error listing trainer applications:', appsErr);
    throw new BadRequestError('Failed to fetch applications');
  }

  const appList = applications || [];
  if (appList.length === 0) return [];

  // Query 2: profiles for those trainers
  const trainerIds = [...new Set(appList.map(a => a.trainer_id))];
  const { data: profiles, error: profilesErr } = await supabaseAdminClient
    .from('profiles')
    .select('id, first_name, last_name, email, trainer_status, created_at')
    .in('id', trainerIds);

  const profilesById = {};
  if (!profilesErr && profiles) {
    for (const p of profiles) {
      profilesById[p.id] = p;
    }
  }

  // Merge and optionally filter by status
  let result = appList.map(app => ({
    ...app,
    profiles: profilesById[app.trainer_id] || null,
  }));

  if (statusFilter) {
    result = result.filter(a => (a.profiles?.trainer_status ?? 'approved') === statusFilter);
  }

  return result;
};

/**
 * Admin: approve or reject a trainer.
 */
export const reviewApplication = async (trainerId, adminId, decision, adminNotes = '') => {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new BadRequestError('decision must be "approved" or "rejected"');
  }

  // Update trainer_status in profiles
  const { error: profileErr } = await supabaseAdminClient
    .from('profiles')
    .update({ trainer_status: decision })
    .eq('id', trainerId);

  if (profileErr) {
    logger.error('Error updating trainer_status:', profileErr);
    throw new BadRequestError('Failed to update trainer status');
  }

  // Update application review metadata
  const { data: app, error: appErr } = await supabaseAdminClient
    .from('trainer_applications')
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      admin_notes: adminNotes || null,
    })
    .eq('trainer_id', trainerId)
    .select()
    .single();

  if (appErr) {
    // Application may not exist (admin manually reviewing) — not fatal
    logger.warn('Could not update trainer application review metadata:', appErr.message);
  }

  logger.info(`Trainer ${trainerId} ${decision} by admin ${adminId}`);
  return { trainerId, decision, app: app || null };
};

/**
 * Admin: get all trainers (with or without applications) and their status.
 * Uses two separate queries instead of a join to avoid PostgREST schema cache issues
 * after migrations add new tables/columns.
 */
export const listAllTrainers = async () => {
  // Query 1: all trainer profiles
  const { data: profiles, error: profilesErr } = await supabaseAdminClient
    .from('profiles')
    .select('id, first_name, last_name, email, trainer_status, created_at')
    .eq('role', 'trainer')
    .order('created_at', { ascending: false });

  if (profilesErr) {
    logger.error('Error listing trainer profiles:', profilesErr);
    throw new BadRequestError('Failed to fetch trainers');
  }

  const trainerList = profiles || [];
  if (trainerList.length === 0) {
    return [];
  }

  // Query 2: all applications for those trainers (separate query — no join)
  const trainerIds = trainerList.map(t => t.id);
  const { data: applications, error: appsErr } = await supabaseAdminClient
    .from('trainer_applications')
    .select('id, trainer_id, experience, skills, bio, cv_url, submitted_at, reviewed_at, admin_notes')
    .in('trainer_id', trainerIds);

  // If trainer_applications table doesn't exist yet, continue without application data
  const appsByTrainerId = {};
  if (!appsErr && applications) {
    for (const app of applications) {
      appsByTrainerId[app.trainer_id] = app;
    }
  } else if (appsErr) {
    logger.warn('Could not fetch trainer_applications (table may not exist yet):', appsErr.message);
  }

  // Merge: normalize null trainer_status = legacy approved
  return trainerList.map(t => ({
    ...t,
    trainer_status: t.trainer_status ?? 'approved',
    application: appsByTrainerId[t.id] || null,
  }));
};
