/**
 * Alumni Service
 * Handle alumni profile business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

export const createOrUpdateProfile = async (userId, profileData) => {
  try {
    const { headline, bio, experience, skills, achievements, linkedinUrl, portfolioUrl, availableForMentorship } = profileData;

    const { data: existing } = await supabase
      .from('alumni_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const fields = {
      user_id: userId,
      headline: headline || null,
      bio: bio || null,
      experience: experience || null,
      skills: skills || null,
      achievements: achievements || null,
      linkedin_url: linkedinUrl || null,
      portfolio_url: portfolioUrl || null,
      available_for_mentorship: availableForMentorship ?? true,
      updated_at: new Date().toISOString(),
    };

    let data, error;
    if (existing) {
      ({ data, error } = await supabase
        .from('alumni_profiles')
        .update(fields)
        .eq('user_id', userId)
        .select(`*, profiles!alumni_profiles_user_id_fkey(id, first_name, last_name, email)`)
        .single());
    } else {
      ({ data, error } = await supabase
        .from('alumni_profiles')
        .insert([{ ...fields, created_at: new Date().toISOString() }])
        .select(`*, profiles!alumni_profiles_user_id_fkey(id, first_name, last_name, email)`)
        .single());
    }

    if (error) {
      logger.error('Error saving alumni profile:', error);
      throw new BadRequestError('Failed to save alumni profile');
    }

    return data;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error saving alumni profile:', err);
    throw new BadRequestError('Failed to save alumni profile');
  }
};

export const getMyProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select(`*, profiles!alumni_profiles_user_id_fkey(id, first_name, last_name, email)`)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching alumni profile:', error);
      throw new BadRequestError('Failed to fetch profile');
    }

    return data || null;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching alumni profile:', err);
    throw new BadRequestError('Failed to fetch profile');
  }
};

export const getAllAlumni = async () => {
  try {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select(`*, profiles!alumni_profiles_user_id_fkey(id, first_name, last_name, email)`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching alumni list:', error);
      throw new BadRequestError('Failed to fetch alumni');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching alumni:', err);
    throw new BadRequestError('Failed to fetch alumni');
  }
};

export const getAlumniById = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select(`*, profiles!alumni_profiles_user_id_fkey(id, first_name, last_name, email)`)
      .eq('id', profileId)
      .single();

    if (error || !data) throw new NotFoundError('Alumni profile not found');

    return data;
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching alumni by id:', err);
    throw new BadRequestError('Failed to fetch alumni profile');
  }
};
