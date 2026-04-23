/**
 * Supabase Client Configuration
 * Initialize and export Supabase clients
 *
 * DO NOT COMMIT API KEYS — USE ENV VARIABLES ONLY
 * All credentials must be set in backend/.env (never hardcoded here)
 */

import { createClient } from '@supabase/supabase-js';
import config from './env.js';
import logger from '../utils/logger.js';

/**
 * Validate Supabase configuration
 */
if (!config.supabase.url || !config.supabase.anonKey || !config.supabase.serviceRoleKey) {
  logger.error('Missing Supabase configuration. Please check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file');
  throw new Error('Supabase configuration is incomplete');
}

/**
 * Create Supabase client with anon key for authentication
 * This client is used for auth operations (signUp, signIn)
 * It respects RLS policies
 */
export const supabaseAuthClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create Supabase client with service role key for admin operations
 * Service role key bypasses RLS and should only be used on the server
 * Use this for database operations that need to bypass RLS (e.g., creating profiles)
 */
export const supabaseAdminClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Default export for backward compatibility
 * Uses admin client for operations that need to bypass RLS
 */
const supabase = supabaseAdminClient;

logger.info('Supabase clients initialized successfully');

export default supabase;
