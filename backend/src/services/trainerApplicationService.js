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
 * Optionally filter by status.
 */
export const listApplications = async (statusFilter = null) => {
  let query = supabaseAdminClient
    .from('trainer_applications')
    .select(`
      *,
      profiles!trainer_applications_trainer_id_fkey (
        id, first_name, last_name, email, trainer_status, created_at
      )
    `)
    .order('submitted_at', { ascending: false });

  if (statusFilter) {
    // Filter by the trainer's current status in profiles
    query = query.eq('profiles.trainer_status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('Error listing trainer applications:', error);
    throw new BadRequestError('Failed to fetch applications');
  }

  // If statusFilter is provided, filter in JS (Supabase join filters can be unreliable)
  let result = data || [];
  if (statusFilter) {
    result = result.filter(a => a.profiles?.trainer_status === statusFilter);
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
 */
export const listAllTrainers = async () => {
  const { data, error } = await supabaseAdminClient
    .from('profiles')
    .select(`
      id, first_name, last_name, email, trainer_status, created_at,
      trainer_applications (
        id, experience, skills, bio, cv_url, submitted_at, reviewed_at, admin_notes
      )
    `)
    .eq('role', 'trainer')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error listing trainers:', error);
    throw new BadRequestError('Failed to fetch trainers');
  }

  // Normalize: null trainer_status = legacy approved
  return (data || []).map(t => ({
    ...t,
    trainer_status: t.trainer_status ?? 'approved',
    application: t.trainer_applications?.[0] || null,
  }));
};
