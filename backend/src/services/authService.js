/**
 * Authentication Service
 * Handle authentication business logic
 */

import { supabaseAuthClient, supabaseAdminClient } from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';

/**
 * Sign up a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} [userData.role='student'] - User role
 * @returns {Promise<Object>} Created user data
 */
export const signUp = async (userData) => {
  const { email, password, firstName, lastName, role = 'student' } = userData;

  try {
    // Step 1: Create user in Supabase Auth using anon client
    // Supabase will automatically send verification email
    const { data: authData, error: authError } = await supabaseAuthClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
        },
      },
    });

    if (authError) {
      logger.error('Supabase auth error during signup:', authError);
      throw new BadRequestError(authError.message);
    }

    if (!authData.user) {
      throw new BadRequestError('Failed to create user');
    }

    // Step 2: Insert user profile in profiles table using admin client (bypasses RLS)
    // Note: email_verified will be synced from Supabase Auth via database trigger or webhook
    const { data: profileData, error: profileError } = await supabaseAdminClient
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          email_verified: false, // Will be updated when user verifies email
          verification_token: null, // Not needed with Supabase Auth
        },
      ])
      .select()
      .single();

    if (profileError) {
      logger.error('Error creating user profile:', profileError);
      throw new BadRequestError(profileError.message);
    }

    logger.info(`User created successfully: ${email} (verification email sent by Supabase)`);

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        role: profileData.role,
      },
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Unexpected error during signup:', error);
    throw new BadRequestError('Failed to create user account');
  }
};

/**
 * Sign in a user
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Authentication result with token
 */
export const signIn = async (credentials) => {
  const { email, password } = credentials;

  try {
    // Step 1: Authenticate with Supabase using auth client
    const { data: authData, error: authError } = await supabaseAuthClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!authData.user || !authData.session) {
      throw new UnauthorizedError('Authentication failed');
    }

    // Step 2: Fetch user profile using admin client
    const { data: profileData, error: profileError } = await supabaseAdminClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      logger.error('Error fetching user profile:', profileError);
      throw new UnauthorizedError('User profile not found');
    }

    // Step 3: Check if email is verified in Supabase Auth
    // Supabase Auth handles email verification, so we check authData.user.email_confirmed_at
    const isEmailVerifiedInAuth = authData.user.email_confirmed_at !== null;

    // Step 4: Sync email verification status from Supabase Auth to profiles table
    if (isEmailVerifiedInAuth && !profileData.email_verified) {
      logger.info(`Syncing email verification status for user: ${email}`);
      
      const { error: updateError } = await supabaseAdminClient
        .from('profiles')
        .update({
          email_verified: true,
          verified_at: authData.user.email_confirmed_at,
        })
        .eq('id', authData.user.id);

      if (updateError) {
        logger.error('Error syncing email verification status:', updateError);
      } else {
        // Update local profileData to reflect the change
        profileData.email_verified = true;
        profileData.verified_at = authData.user.email_confirmed_at;
      }
    }

    // Step 5: Check if email is verified
    if (!profileData.email_verified) {
      logger.warn(`Login attempt with unverified email: ${email}`);
      throw new UnauthorizedError('Please verify your email before logging in');
    }

    logger.info(`User logged in successfully: ${email}`);

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresIn: authData.session.expires_in,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        role: profileData.role,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    logger.error('Unexpected error during login:', error);
    throw new UnauthorizedError('Authentication failed');
  }
};
