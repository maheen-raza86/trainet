/**
 * Environment Configuration
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * @typedef {Object} EnvConfig
 * @property {string} nodeEnv - Node environment
 * @property {number} port - Server port
 * @property {string} apiPrefix - API route prefix
 * @property {string} corsOrigin - CORS allowed origin
 * @property {Object} supabase - Supabase configuration
 * @property {string} supabase.url - Supabase URL
 * @property {string} supabase.anonKey - Supabase anonymous key
 * @property {string} supabase.serviceKey - Supabase service key
 * @property {Object} jwt - JWT configuration
 * @property {string} jwt.secret - JWT secret
 * @property {string} jwt.expiresIn - JWT expiration time
 * @property {Object} rateLimit - Rate limiting configuration
 * @property {number} rateLimit.windowMs - Time window in milliseconds
 * @property {number} rateLimit.maxRequests - Max requests per window
 * @property {string} logLevel - Logging level
 */

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  logLevel: process.env.LOG_LEVEL || 'info',
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}

// Validate configuration in production
if (config.nodeEnv === 'production') {
  validateConfig();
}

export default config;
