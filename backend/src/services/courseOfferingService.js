/**
 * Course Offering Service
 * Handle course offering-related business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js';

/**
 * Get course catalog
 * Returns all courses from the catalog (same as getAllCourses in courseService)
 * @returns {Promise<Array>} List of all courses in catalog
 */
export const getCourseCatalog = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      logger.error('Error fetching course catalog:', error);
      throw new BadRequestError('Failed to fetch course catalog');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching course catalog:', error);
    throw new BadRequestError('Failed to fetch course catalog');
  }
};

/**
 * Create course offering
 * @param {string} trainerId - Trainer user ID
 * @param {Object} offeringData - Course offering data
 * @returns {Promise<Object>} Created course offering
 */
export const createCourseOffering = async (trainerId, offeringData) => {
  try {
    const { courseId, durationWeeks, hoursPerWeek, outline, startDate, endDate } = offeringData;

    // Validate required fields
    if (!courseId || !durationWeeks || !hoursPerWeek || !outline) {
      throw new BadRequestError('courseId, durationWeeks, hoursPerWeek, and outline are required');
    }

    // Validate durationWeeks
    const allowedDurations = [4, 6, 8, 12];
    if (!allowedDurations.includes(durationWeeks)) {
      throw new BadRequestError('durationWeeks must be one of: 4, 6, 8, 12');
    }

    // Validate hoursPerWeek
    if (hoursPerWeek < 1 || hoursPerWeek > 10) {
      throw new BadRequestError('hoursPerWeek must be between 1 and 10');
    }

    // Validate outline length
    if (outline.length < 20) {
      throw new BadRequestError('outline must be at least 20 characters');
    }

    // Verify course exists in catalog
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new NotFoundError('Course not found in catalog');
    }

    // Check trainer's active offerings count
    const { data: activeOfferings, error: countError } = await supabase
      .from('course_offerings')
      .select('id')
      .eq('trainer_id', trainerId)
      .eq('status', 'open');

    if (countError) {
      logger.error('Error checking trainer offerings:', countError);
      throw new BadRequestError('Failed to check trainer offerings');
    }

    if (activeOfferings && activeOfferings.length >= 5) {
      throw new ForbiddenError('You cannot create more than 5 active course offerings');
    }

    // Create course offering
    const { data, error } = await supabase
      .from('course_offerings')
      .insert([
        {
          course_id: courseId,
          trainer_id: trainerId,
          duration_weeks: durationWeeks,
          hours_per_week: hoursPerWeek,
          outline,
          start_date: startDate || null,
          end_date: endDate || null,
          status: 'open',
        },
      ])
      .select(`
        *,
        courses (
          id,
          title,
          description
        )
      `)
      .single();

    if (error) {
      logger.error('Error creating course offering:', error);
      throw new BadRequestError('Failed to create course offering');
    }

    logger.info(`Course offering created: ${data.id} by trainer ${trainerId}`);

    return data;
  } catch (error) {
    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError ||
      error instanceof ForbiddenError
    ) {
      throw error;
    }
    logger.error('Unexpected error creating course offering:', error);
    throw new BadRequestError('Failed to create course offering');
  }
};

/**
 * Get trainer's course offerings
 * @param {string} trainerId - Trainer user ID
 * @returns {Promise<Array>} List of trainer's course offerings
 */
export const getTrainerOfferings = async (trainerId) => {
  try {
    const { data, error } = await supabase
      .from('course_offerings')
      .select(`
        *,
        courses (
          id,
          title,
          description
        )
      `)
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching trainer offerings:', error);
      throw new BadRequestError('Failed to fetch trainer offerings');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching trainer offerings:', error);
    throw new BadRequestError('Failed to fetch trainer offerings');
  }
};

/**
 * Update course offering
 * @param {string} offeringId - Course offering ID
 * @param {string} trainerId - Trainer user ID (for authorization)
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated course offering
 */
export const updateCourseOffering = async (offeringId, trainerId, updateData) => {
  try {
    const { durationWeeks, hoursPerWeek, outline, startDate, endDate, status } = updateData;

    // Verify offering exists
    const { data: offering, error: offeringError } = await supabase
      .from('course_offerings')
      .select('*')
      .eq('id', offeringId)
      .single();

    if (offeringError || !offering) {
      throw new NotFoundError('Course offering not found');
    }

    // Verify trainer owns the offering
    if (offering.trainer_id !== trainerId) {
      throw new ForbiddenError('You are not authorized to edit this course offering');
    }

    // Validate durationWeeks if provided
    if (durationWeeks !== undefined) {
      const allowedDurations = [4, 6, 8, 12];
      if (!allowedDurations.includes(durationWeeks)) {
        throw new BadRequestError('durationWeeks must be one of: 4, 6, 8, 12');
      }
    }

    // Validate hoursPerWeek if provided
    if (hoursPerWeek !== undefined && (hoursPerWeek < 1 || hoursPerWeek > 10)) {
      throw new BadRequestError('hoursPerWeek must be between 1 and 10');
    }

    // Validate outline length if provided
    if (outline !== undefined && outline.length < 20) {
      throw new BadRequestError('outline must be at least 20 characters');
    }

    // Validate status if provided
    if (status !== undefined && !['open', 'closed'].includes(status)) {
      throw new BadRequestError('status must be either "open" or "closed"');
    }

    // Prepare update object
    const updateFields = {
      updated_at: new Date().toISOString(),
    };

    if (durationWeeks !== undefined) updateFields.duration_weeks = durationWeeks;
    if (hoursPerWeek !== undefined) updateFields.hours_per_week = hoursPerWeek;
    if (outline !== undefined) updateFields.outline = outline;
    if (startDate !== undefined) updateFields.start_date = startDate;
    if (endDate !== undefined) updateFields.end_date = endDate;
    if (status !== undefined) updateFields.status = status;

    // Update course offering
    const { data: updatedOffering, error: updateError } = await supabase
      .from('course_offerings')
      .update(updateFields)
      .eq('id', offeringId)
      .select(`
        *,
        courses (
          id,
          title,
          description
        )
      `)
      .single();

    if (updateError) {
      logger.error('Error updating course offering:', updateError);
      throw new BadRequestError('Failed to update course offering');
    }

    logger.info(`Course offering ${offeringId} updated by trainer ${trainerId}`);

    return updatedOffering;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ForbiddenError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error updating course offering:', error);
    throw new BadRequestError('Failed to update course offering');
  }
};

/**
 * Get available course offerings (open for enrollment)
 * @returns {Promise<Array>} List of available course offerings
 */
export const getAvailableOfferings = async () => {
  try {
    const { data, error } = await supabase
      .from('course_offerings')
      .select(`
        *,
        courses (
          id,
          title,
          description
        ),
        profiles!course_offerings_trainer_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching available offerings:', error);
      throw new BadRequestError('Failed to fetch available offerings');
    }

    return data || [];
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error fetching available offerings:', error);
    throw new BadRequestError('Failed to fetch available offerings');
  }
};

/**
 * Enroll student in course offering
 * @param {string} studentId - Student user ID
 * @param {string} offeringId - Course offering ID
 * @returns {Promise<Object>} Enrollment data
 */
export const enrollInOffering = async (studentId, offeringId) => {
  try {
    // Verify offering exists and is open
    const { data: offering, error: offeringError } = await supabase
      .from('course_offerings')
      .select('*')
      .eq('id', offeringId)
      .single();

    if (offeringError || !offering) {
      throw new NotFoundError('Course offering not found');
    }

    if (offering.status !== 'open') {
      throw new BadRequestError('This course offering is not open for enrollment');
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('offering_id', offeringId)
      .single();

    if (existingEnrollment) {
      throw new ConflictError('You are already enrolled in this course offering');
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert([
        {
          student_id: studentId,
          offering_id: offeringId,
          status: 'active',
          progress: 0,
        },
      ])
      .select(`
        *,
        course_offerings (
          *,
          courses (
            id,
            title,
            description
          )
        )
      `)
      .single();

    if (error) {
      logger.error('Error creating enrollment:', error);
      throw new BadRequestError('Failed to enroll in course offering');
    }

    logger.info(`Student ${studentId} enrolled in offering ${offeringId}`);

    return data;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ConflictError
    ) {
      throw error;
    }
    logger.error('Unexpected error during enrollment:', error);
    throw new BadRequestError('Failed to enroll in course offering');
  }
};
