/**
 * Course Material Service
 * Handle course material business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Add a material to a course offering
 */
export const addMaterial = async (trainerId, data) => {
  const { offeringId, title, description, materialType, fileUrl, externalUrl, fileName, fileSize, sortOrder } = data;

  // Verify trainer owns the offering
  const { data: offering, error: offeringError } = await supabase
    .from('course_offerings')
    .select('id, trainer_id')
    .eq('id', offeringId)
    .single();

  if (offeringError || !offering) throw new NotFoundError('Course offering not found');
  if (offering.trainer_id !== trainerId) throw new ForbiddenError('Not authorized to add materials to this offering');

  const { data: material, error } = await supabase
    .from('course_materials')
    .insert([{
      offering_id: offeringId,
      trainer_id: trainerId,
      title,
      description: description || null,
      material_type: materialType || 'file',
      file_url: fileUrl || null,
      external_url: externalUrl || null,
      file_name: fileName || null,
      file_size: fileSize || null,
      sort_order: sortOrder || 0,
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error adding material:', error);
    throw new BadRequestError('Failed to add material');
  }

  return material;
};

/**
 * Get all materials for a course offering
 */
export const getMaterialsByOffering = async (offeringId) => {
  const { data, error } = await supabase
    .from('course_materials')
    .select('*')
    .eq('offering_id', offeringId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error fetching materials:', error);
    throw new BadRequestError('Failed to fetch materials');
  }

  return data || [];
};

/**
 * Delete a material
 */
export const deleteMaterial = async (materialId, trainerId) => {
  const { data: material, error: fetchError } = await supabase
    .from('course_materials')
    .select('id, trainer_id')
    .eq('id', materialId)
    .single();

  if (fetchError || !material) throw new NotFoundError('Material not found');
  if (material.trainer_id !== trainerId) throw new ForbiddenError('Not authorized to delete this material');

  const { error } = await supabase
    .from('course_materials')
    .delete()
    .eq('id', materialId);

  if (error) {
    logger.error('Error deleting material:', error);
    throw new BadRequestError('Failed to delete material');
  }

  return true;
};

/**
 * Update live session link for a course offering
 */
export const updateLiveSession = async (offeringId, trainerId, liveSessionLink, liveSessionNotes) => {
  const { data: offering, error: offeringError } = await supabase
    .from('course_offerings')
    .select('id, trainer_id')
    .eq('id', offeringId)
    .single();

  if (offeringError || !offering) throw new NotFoundError('Course offering not found');
  if (offering.trainer_id !== trainerId) throw new ForbiddenError('Not authorized to update this offering');

  const { data, error } = await supabase
    .from('course_offerings')
    .update({
      live_session_link: liveSessionLink || null,
      live_session_notes: liveSessionNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offeringId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating live session:', error);
    throw new BadRequestError('Failed to update live session');
  }

  return data;
};

/**
 * Get a single course offering with materials and live session (for student/trainer view)
 */
export const getOfferingDetail = async (offeringId) => {
  const { data, error } = await supabase
    .from('course_offerings')
    .select(`
      *,
      courses (id, title, description),
      profiles!course_offerings_trainer_id_fkey (id, first_name, last_name, email)
    `)
    .eq('id', offeringId)
    .single();

  if (error || !data) throw new NotFoundError('Course offering not found');

  // Fetch materials
  const materials = await getMaterialsByOffering(offeringId);

  return { ...data, materials };
};
