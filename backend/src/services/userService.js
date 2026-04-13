/**
 * User Service
 * Handle user-related business logic
 */

import { supabaseAdminClient } from '../config/supabaseClient.js';
import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundError('User profile not found');
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      bio: data.bio,
      skills: data.skills,
      avatar_url: data.avatar_url,
      profile_picture_url: data.profile_picture_url,
      emailVerified: data.email_verified,
      createdAt: data.created_at,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Error fetching user profile:', error);
    throw new BadRequestError('Failed to fetch user profile');
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.firstName] - First name
 * @param {string} [profileData.lastName] - Last name
 * @param {string} [profileData.bio] - User bio
 * @param {string} [profileData.skills] - User skills
 * @param {string} [profileData.avatar_url] - Avatar URL
 * @returns {Promise<Object>} Updated profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { firstName, lastName, bio, skills, avatar_url } = profileData;

    // Build update object with only provided fields
    const updateData = {};
    
    if (firstName !== undefined) {
      // Validate first name
      if (firstName.length < 2 || firstName.length > 50) {
        throw new BadRequestError('First name must be between 2 and 50 characters');
      }
      updateData.first_name = firstName;
    }
    
    if (lastName !== undefined) {
      // Validate last name
      if (lastName.length < 2 || lastName.length > 50) {
        throw new BadRequestError('Last name must be between 2 and 50 characters');
      }
      updateData.last_name = lastName;
    }
    
    if (bio !== undefined) {
      // Validate bio length
      if (bio.length > 500) {
        throw new BadRequestError('Bio must not exceed 500 characters');
      }
      updateData.bio = bio;
    }

    if (skills !== undefined) {
      updateData.skills = skills;
    }

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }

    // profile_picture_url (from file upload)
    if (profileData.profile_picture_url !== undefined) {
      updateData.profile_picture_url = profileData.profile_picture_url;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError('No valid fields provided for update');
    }

    // Update profile
    const { data, error } = await supabaseAdminClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating user profile:', error);
      // Provide a clear message for schema mismatch errors
      if (error.message && error.message.includes('column') && error.message.includes('schema cache')) {
        throw new BadRequestError(
          'Profile update failed due to a database schema issue. Please run the latest migrations and try again.'
        );
      }
      throw new BadRequestError(error.message);
    }

    if (!data) {
      throw new NotFoundError('User profile not found');
    }

    logger.info(`Profile updated for user: ${userId}`);

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      bio: data.bio,
      skills: data.skills,
      avatar_url: data.avatar_url,
      profile_picture_url: data.profile_picture_url,
    };
  } catch (error) {
    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    logger.error('Unexpected error updating profile:', error);
    throw new BadRequestError('Failed to update profile');
  }
};

/**
 * Verify email with token
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Verification result
 */
export const verifyEmail = async (token) => {
  try {
    // Find user with this verification token
    const { data: profile, error: findError } = await supabaseAdminClient
      .from('profiles')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (findError || !profile) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    // Check if already verified
    if (profile.email_verified) {
      throw new BadRequestError('Email already verified');
    }

    // Mark as verified and clear token
    const { data, error } = await supabaseAdminClient
      .from('profiles')
      .update({
        email_verified: true,
        verification_token: null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      logger.error('Error verifying email:', error);
      throw new BadRequestError(error.message);
    }

    logger.info(`Email verified for user: ${profile.email}`);

    return {
      success: true,
      email: data.email,
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error verifying email:', error);
    throw new BadRequestError('Failed to verify email');
  }
};

/**
 * Validate QR enrollment token and get course
 * @param {string} token - QR enrollment token
 * @returns {Promise<Object>} Course data
 */
export const validateQREnrollmentToken = async (token) => {
  try {
    // Find token in database
    const { data: qrToken, error: tokenError } = await supabaseAdminClient
      .from('enrollment_qr_tokens')
      .select(`
        *,
        courses (
          id,
          title,
          description
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !qrToken) {
      throw new BadRequestError('Invalid QR enrollment token');
    }

    // Check if token is expired
    const expiresAt = new Date(qrToken.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      throw new BadRequestError('QR enrollment token has expired');
    }

    logger.info(`QR token validated for course: ${qrToken.course_id}`);

    return {
      courseId: qrToken.course_id,
      course: qrToken.courses,
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error validating QR token:', error);
    throw new BadRequestError('Failed to validate QR enrollment token');
  }
};


/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Validate new password
    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters');
    }

    // Get user's email from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new NotFoundError('User not found');
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      logger.error('Error updating password:', updateError);
      throw new BadRequestError('Failed to update password');
    }

    logger.info(`Password changed for user: ${userId}`);
  } catch (error) {
    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    logger.error('Unexpected error changing password:', error);
    throw new BadRequestError('Failed to change password');
  }
};

/**
 * Validate QR token and enroll student into the associated offering (or course).
 * Supports both offering_id (new) and course_id (legacy).
 * Marks single-use tokens as used.
 *
 * @param {string} studentId
 * @param {string} token
 * @returns {Promise<Object>} { enrollment, offeringTitle, courseTitle }
 */
export const validateAndEnrollViaQR = async (studentId, token) => {
  try {
    // Fetch token with related data
    const { data: qrToken, error: tokenError } = await supabaseAdminClient
      .from('enrollment_qr_tokens')
      .select(`
        *,
        courses (id, title, description),
        course_offerings (
          id, status,
          courses (id, title)
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !qrToken) {
      throw new BadRequestError('Invalid or expired QR code');
    }

    // Check expiry
    if (new Date() > new Date(qrToken.expires_at)) {
      throw new BadRequestError('This QR code has expired');
    }

    // Check single-use
    if (qrToken.is_single_use && qrToken.used_at) {
      throw new BadRequestError('This QR code has already been used');
    }

    // Determine enrollment target: offering_id preferred over course_id
    let enrollment;
    let displayTitle;

    if (qrToken.offering_id) {
      const offering = qrToken.course_offerings;
      if (!offering || offering.status !== 'open') {
        throw new BadRequestError('This course offering is not open for enrollment');
      }

      // Check duplicate enrollment
      const { data: existing } = await supabaseAdminClient
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('offering_id', qrToken.offering_id)
        .single();

      if (existing) {
        throw new BadRequestError('You are already enrolled in this course offering');
      }

      const { data: newEnrollment, error: enrollError } = await supabaseAdminClient
        .from('enrollments')
        .insert([{ student_id: studentId, offering_id: qrToken.offering_id, progress: 0 }])
        .select()
        .single();

      if (enrollError) throw new BadRequestError('Failed to enroll in course offering');

      enrollment = newEnrollment;
      displayTitle = offering.courses?.title || 'Course';
    } else {
      // Legacy: enroll via course_id
      const { data: existing } = await supabaseAdminClient
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', qrToken.course_id)
        .single();

      if (existing) {
        throw new BadRequestError('You are already enrolled in this course');
      }

      const { data: newEnrollment, error: enrollError } = await supabaseAdminClient
        .from('enrollments')
        .insert([{ student_id: studentId, course_id: qrToken.course_id, progress: 0 }])
        .select()
        .single();

      if (enrollError) throw new BadRequestError('Failed to enroll in course');

      enrollment = newEnrollment;
      displayTitle = qrToken.courses?.title || 'Course';
    }

    // Mark token as used (if single-use)
    if (qrToken.is_single_use) {
      await supabaseAdminClient
        .from('enrollment_qr_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', qrToken.id);
    }

    logger.info(`Student ${studentId} enrolled via QR token ${token}`);

    return {
      enrollment,
      courseTitle: displayTitle,
      offeringId: qrToken.offering_id || null,
    };
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
    logger.error('Unexpected error in QR enrollment:', error);
    throw new BadRequestError('Failed to process QR enrollment');
  }
};
