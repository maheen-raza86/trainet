/**
 * Mentorship Service
 * Handle mentorship request business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';

export const sendRequest = async (studentId, alumniProfileId, message) => {
  try {
    if (!message || message.trim().length < 5) {
      throw new BadRequestError('Message must be at least 5 characters');
    }

    // Verify alumni profile exists
    const { data: profile, error: profileError } = await supabase
      .from('alumni_profiles')
      .select('id, user_id, available_for_mentorship')
      .eq('id', alumniProfileId)
      .single();

    if (profileError || !profile) throw new NotFoundError('Alumni profile not found');
    if (!profile.available_for_mentorship) throw new BadRequestError('This alumni is not available for mentorship');

    // Prevent duplicate pending request
    const { data: existing } = await supabase
      .from('mentorship_requests')
      .select('id')
      .eq('student_id', studentId)
      .eq('alumni_id', alumniProfileId)
      .eq('status', 'pending')
      .single();

    if (existing) throw new ConflictError('You already have a pending request to this alumni');

    const { data, error } = await supabase
      .from('mentorship_requests')
      .insert([{
        student_id: studentId,
        alumni_id: alumniProfileId,
        message: message.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      }])
      .select(`
        *,
        profiles!mentorship_requests_student_id_fkey(id, first_name, last_name, email),
        alumni_profiles!mentorship_requests_alumni_id_fkey(
          id, headline,
          profiles!alumni_profiles_user_id_fkey(id, first_name, last_name)
        )
      `)
      .single();

    if (error) {
      logger.error('Error creating mentorship request:', error);
      throw new BadRequestError('Failed to send mentorship request');
    }

    logger.info(`Mentorship request sent by student ${studentId} to alumni ${alumniProfileId}`);
    return data;
  } catch (err) {
    if (err instanceof BadRequestError || err instanceof NotFoundError || err instanceof ConflictError) throw err;
    logger.error('Unexpected error sending mentorship request:', err);
    throw new BadRequestError('Failed to send mentorship request');
  }
};

export const getRequestsForAlumni = async (userId) => {
  try {
    // Get alumni profile id for this user
    const { data: profile } = await supabase
      .from('alumni_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) return [];

    const { data, error } = await supabase
      .from('mentorship_requests')
      .select(`
        *,
        profiles!mentorship_requests_student_id_fkey(id, first_name, last_name, email)
      `)
      .eq('alumni_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching alumni requests:', error);
      throw new BadRequestError('Failed to fetch requests');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching alumni requests:', err);
    throw new BadRequestError('Failed to fetch requests');
  }
};

export const getRequestsForStudent = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('mentorship_requests')
      .select(`
        *,
        alumni_profiles!mentorship_requests_alumni_id_fkey(
          id, headline,
          profiles!alumni_profiles_user_id_fkey(id, first_name, last_name)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student requests:', error);
      throw new BadRequestError('Failed to fetch requests');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching student requests:', err);
    throw new BadRequestError('Failed to fetch requests');
  }
};

export const updateRequestStatus = async (requestId, alumniUserId, status, scheduledAt) => {
  try {
    const allowed = ['accepted', 'rejected', 'completed'];
    if (!allowed.includes(status)) throw new BadRequestError('Invalid status');

    // Verify request belongs to this alumni
    const { data: profile } = await supabase
      .from('alumni_profiles')
      .select('id')
      .eq('user_id', alumniUserId)
      .single();

    if (!profile) throw new NotFoundError('Alumni profile not found');

    const { data: request, error: reqError } = await supabase
      .from('mentorship_requests')
      .select('id, alumni_id')
      .eq('id', requestId)
      .single();

    if (reqError || !request) throw new NotFoundError('Request not found');
    if (request.alumni_id !== profile.id) throw new ForbiddenError('Not authorized to update this request');

    const updateFields = { status };
    if (scheduledAt) updateFields.scheduled_at = scheduledAt;

    const { data, error } = await supabase
      .from('mentorship_requests')
      .update(updateFields)
      .eq('id', requestId)
      .select(`
        *,
        profiles!mentorship_requests_student_id_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      logger.error('Error updating request status:', error);
      throw new BadRequestError('Failed to update request');
    }

    return data;
  } catch (err) {
    if (err instanceof BadRequestError || err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
    logger.error('Unexpected error updating request:', err);
    throw new BadRequestError('Failed to update request');
  }
};
