/**
 * Course Offering Service
 * Handle course offering-related business logic
 */

import supabase from '../config/supabaseClient.js';
import { supabaseAdminClient } from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js';
import { createNotification } from './notificationService.js';
import crypto from 'crypto';

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
    const {
      courseId, durationWeeks, hoursPerWeek, outline,
      startDate, endDate, registrationDeadline,
      weeklyDays, sessionStartTime, sessionEndTime,
    } = offeringData;

    // Validate required fields
    if (!courseId || !durationWeeks || !hoursPerWeek || !outline) {
      throw new BadRequestError('courseId, durationWeeks, hoursPerWeek, and outline are required');
    }

    // Validate durationWeeks — flexible: 1-52 weeks
    if (durationWeeks < 1 || durationWeeks > 52) {
      throw new BadRequestError('durationWeeks must be between 1 and 52');
    }

    // Enforce max_course_duration_weeks from settings
    try {
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'max_course_duration_weeks')
        .single();
      if (setting) {
        const maxWeeks = parseInt(setting.value, 10);
        if (!isNaN(maxWeeks) && durationWeeks > maxWeeks) {
          throw new BadRequestError(`Course duration cannot exceed ${maxWeeks} weeks (system limit)`);
        }
      }
    } catch (settingErr) {
      if (settingErr instanceof BadRequestError) throw settingErr;
      // If settings table doesn't exist yet, skip enforcement
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

    // Check for duplicate active offering (same trainer + same course)
    const { data: duplicateOffering } = await supabase
      .from('course_offerings')
      .select('id')
      .eq('trainer_id', trainerId)
      .eq('course_id', courseId)
      .eq('status', 'open')
      .single();

    if (duplicateOffering) {
      throw new ConflictError('You already have an active offering for this course. Close it before creating a new one.');
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
          registration_deadline: registrationDeadline || null,
          weekly_days: weeklyDays || null,
          session_start_time: sessionStartTime || null,
          session_end_time: sessionEndTime || null,
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
      logger.error('Error creating course offering (Supabase):', JSON.stringify(error));
      throw new BadRequestError(`Failed to create course offering: ${error.message || error.code || 'DB error'}`);
    }

    logger.info(`Course offering created: ${data.id} by trainer ${trainerId}`);

    // Auto-generate QR token for this offering (non-blocking, 90-day expiry)
    try {
      const token = `QR-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      const { error: qrError } = await supabaseAdminClient
        .from('enrollment_qr_tokens')
        .insert([{
          offering_id: data.id,
          token,
          expires_at: expiresAt.toISOString(),
          is_single_use: false,
        }]);
      if (qrError) {
        logger.error('Auto QR generation failed (non-blocking):', JSON.stringify(qrError));
      } else {
        logger.info(`Auto-generated QR token for offering ${data.id}`);
      }
    } catch (qrErr) {
      logger.error('Auto QR generation error (non-blocking):', qrErr);
    }

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

    // Trainers cannot modify duration — only admin can
    if (durationWeeks !== undefined) {
      throw new ForbiddenError('Course duration cannot be modified after creation. Contact an admin to change duration.');
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
    // Auto-close expired offerings
    const now = new Date().toISOString();
    await supabase
      .from('course_offerings')
      .update({ status: 'closed' })
      .eq('status', 'open')
      .lt('end_date', now)
      .not('end_date', 'is', null);

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
 * Enroll student in course offering — INTERNAL USE ONLY (called from QR flow)
 * Direct enrollment is disabled per SRDS; enrollment must go through QR token.
 * @param {string} studentId - Student user ID
 * @param {string} studentRole - Must be 'student'
 * @param {string} offeringId - Course offering ID
 * @returns {Promise<Object>} Enrollment data
 */
export const enrollInOffering = async (studentId, studentRole, offeringId) => {
  try {
    // SRDS: only students can enroll
    if (studentRole !== 'student') {
      throw new ForbiddenError('Only students can enroll in course offerings');
    }

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

    // Check registration deadline
    if (offering.registration_deadline && new Date() > new Date(offering.registration_deadline)) {
      throw new BadRequestError('Registration deadline has passed for this course offering');
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('offering_id', offeringId)
      .single();

    if (existingEnrollment) {
      throw new ConflictError('You are already enrolled in this course offering');
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert([{ student_id: studentId, offering_id: offeringId, status: 'active', progress: 0 }])
      .select(`*, course_offerings(*, courses(id, title, description))`)
      .single();

    if (error) {
      logger.error('Error creating enrollment:', JSON.stringify(error));
      throw new BadRequestError('Failed to enroll in course offering');
    }

    logger.info(`Student ${studentId} enrolled in offering ${offeringId}`);

    // Notify trainer (non-blocking)
    try {
      createNotification(offering.trainer_id, {
        title: 'New Student Enrolled',
        message: `A student enrolled in your course: ${offering.courses?.title || offeringId}`,
        type: 'enrollment',
      });
    } catch { /* non-blocking */ }

    return data;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError || error instanceof ConflictError || error instanceof ForbiddenError) {
      throw error;
    }
    logger.error('Unexpected error during enrollment:', error);
    throw new BadRequestError('Failed to enroll in course offering');
  }
};

/**
 * Remove a student from a course offering (trainer only)
 */
export const removeEnrollment = async (enrollmentId, trainerId) => {
  try {
    // Verify enrollment exists and belongs to trainer's offering
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, student_id, offering_id, course_offerings(trainer_id)')
      .eq('id', enrollmentId)
      .single();

    if (enrollError || !enrollment) throw new NotFoundError('Enrollment not found');

    if (enrollment.course_offerings?.trainer_id !== trainerId) {
      throw new ForbiddenError('You are not authorized to remove students from this offering');
    }

    const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
    if (error) {
      logger.error('Error removing enrollment:', JSON.stringify(error));
      throw new BadRequestError('Failed to remove student');
    }

    logger.info(`Enrollment ${enrollmentId} removed by trainer ${trainerId}`);
    return true;
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError || err instanceof BadRequestError) throw err;
    logger.error('Unexpected error removing enrollment:', err);
    throw new BadRequestError('Failed to remove student');
  }
};

/**
 * Delete a course offering (trainer only, with safety checks)
 * @param {string} offeringId - Course offering ID
 * @param {string} trainerId - Trainer user ID
 */
export const deleteOffering = async (offeringId, trainerId) => {
  try {
    const { data: offering, error: offeringError } = await supabase
      .from('course_offerings')
      .select('id, trainer_id, status, courses(title)')
      .eq('id', offeringId)
      .single();

    if (offeringError || !offering) throw new NotFoundError('Course offering not found');

    if (offering.trainer_id !== trainerId) {
      throw new ForbiddenError('You are not authorized to delete this course offering');
    }

    // Cannot delete if students are enrolled
    const { count: enrollmentCount } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('offering_id', offeringId);

    if (enrollmentCount && enrollmentCount > 0) {
      throw new ForbiddenError(
        `Cannot delete offering with ${enrollmentCount} enrolled student(s). Close the offering instead.`
      );
    }

    const { error } = await supabase.from('course_offerings').delete().eq('id', offeringId);
    if (error) throw new BadRequestError('Failed to delete course offering');

    logger.info(`Course offering ${offeringId} deleted by trainer ${trainerId}`);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error deleting offering:', error);
    throw new BadRequestError('Failed to delete course offering');
  }
};

/**
 * Update course offering (Admin only - can modify all fields including duration)
 * @param {string} offeringId - Course offering ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated course offering
 */
export const adminUpdateCourseOffering = async (offeringId, updateData) => {
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

    // Validate hoursPerWeek if provided
    if (hoursPerWeek !== undefined && (hoursPerWeek < 1 || hoursPerWeek > 10)) {
      throw new BadRequestError('hoursPerWeek must be between 1 and 10');
    }

    // Validate durationWeeks if provided
    if (durationWeeks !== undefined && (durationWeeks < 1 || durationWeeks > 52)) {
      throw new BadRequestError('durationWeeks must be between 1 and 52');
    }

    // Validate outline length if provided
    if (outline !== undefined && outline.length < 20) {
      throw new BadRequestError('outline must be at least 20 characters');
    }

    // Validate status if provided
    if (status !== undefined && !['open', 'closed'].includes(status)) {
      throw new BadRequestError('status must be "open" or "closed"');
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
        ),
        profiles!course_offerings_trainer_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .single();

    if (updateError) {
      logger.error('Error updating course offering (admin):', updateError);
      throw new BadRequestError('Failed to update course offering');
    }

    logger.info(`Course offering ${offeringId} updated by admin`);

    return updatedOffering;
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    logger.error('Unexpected error updating course offering (admin):', error);
    throw new BadRequestError('Failed to update course offering');
  }
};

/**
 * Delete or archive course offering (Admin only)
 * @param {string} offeringId - Course offering ID
 * @returns {Promise<Object>} Result with action taken (deleted or archived)
 */
export const adminDeleteOffering = async (offeringId) => {
  try {
    const { data: offering, error: offeringError } = await supabase
      .from('course_offerings')
      .select('id, status, courses(title)')
      .eq('id', offeringId)
      .single();

    if (offeringError || !offering) {
      logger.error('Error fetching offering:', offeringError);
      throw new NotFoundError('Course offering not found');
    }

    // Check if students are enrolled
    const { count: enrollmentCount, error: countError } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('offering_id', offeringId);

    if (countError) {
      logger.error('Error checking enrollments:', countError);
      throw new BadRequestError('Failed to check enrollments');
    }

    if (enrollmentCount && enrollmentCount > 0) {
      // Close instead of delete (database only allows 'open' and 'closed' status)
      const { data: closedOffering, error: closeError } = await supabase
        .from('course_offerings')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', offeringId)
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
        .single();

      if (closeError) {
        logger.error('Error closing course offering:', closeError);
        throw new BadRequestError('Failed to close course offering');
      }

      logger.info(`Course offering ${offeringId} closed by admin (${enrollmentCount} enrollments)`);
      return {
        action: 'closed',
        message: `Course offering closed due to ${enrollmentCount} enrolled student(s)`,
        data: closedOffering,
      };
    }

    // No enrollments - safe to delete
    const { error: deleteError } = await supabase
      .from('course_offerings')
      .delete()
      .eq('id', offeringId);

    if (deleteError) {
      logger.error('Error deleting course offering:', deleteError);
      throw new BadRequestError('Failed to delete course offering');
    }

    logger.info(`Course offering ${offeringId} deleted by admin`);
    return {
      action: 'deleted',
      message: 'Course offering deleted successfully',
      data: null,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error deleting offering (admin):', error);
    throw new BadRequestError('Failed to delete course offering');
  }
};


/**
 * Auto-complete offerings whose end_date has passed
 * Called on server startup or via a scheduled check
 */
export const autoCompleteExpiredOfferings = async () => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('course_offerings')
      .update({ status: 'completed' })
      .eq('status', 'open')
      .lt('end_date', now)
      .select('id');
    if (error) {
      logger.error('Error auto-completing offerings:', error);
    } else if (data && data.length > 0) {
      logger.info(`Auto-completed ${data.length} expired course offering(s)`);
    }
  } catch (err) {
    logger.error('Unexpected error in autoCompleteExpiredOfferings:', err);
  }
};

/**
 * Drop a course (student only)
 * Sets enrollment.status = 'dropped' — does NOT delete data
 */
export const dropCourse = async (studentId, offeringId) => {
  try {
    // Verify enrollment exists and is active
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('offering_id', offeringId)
      .single();

    if (enrollError || !enrollment) {
      throw new NotFoundError('Enrollment not found');
    }
    if (enrollment.status === 'dropped') {
      throw new ConflictError('You have already dropped this course');
    }

    // Verify offering is still open (cannot drop a completed course)
    const { data: offering } = await supabase
      .from('course_offerings')
      .select('status')
      .eq('id', offeringId)
      .single();

    if (offering?.status === 'completed') {
      throw new ConflictError('Cannot drop a completed course');
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update({ status: 'dropped' })
      .eq('id', enrollment.id)
      .select('*')
      .single();

    if (error) {
      logger.error('Error dropping course:', error);
      throw new BadRequestError('Failed to drop course');
    }

    logger.info(`Student ${studentId} dropped offering ${offeringId}`);
    return data;
  } catch (err) {
    if (
      err instanceof NotFoundError ||
      err instanceof ConflictError ||
      err instanceof BadRequestError
    ) throw err;
    logger.error('Unexpected error dropping course:', err);
    throw new BadRequestError('Failed to drop course');
  }
};
