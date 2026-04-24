/**
 * Environment Configuration
 * Loads and validates environment variables
 *
 * DO NOT COMMIT API KEYS — USE ENV VARIABLES ONLY
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api',
  // CORS: comma-separated list of allowed origins
  // e.g. CORS_ORIGIN=https://myapp.vercel.app,https://www.myapp.com
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

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
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  // Public URLs — used for QR codes, email links, certificate verification
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl:  process.env.BACKEND_URL  || 'http://localhost:5000',
};

/**
 * Validate required environment variables.
 * Runs in ALL environments (not just production) so missing vars are caught early.
 */
function validateConfig() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ];

  // In production, also require public URL vars (used in emails and QR codes)
  if (process.env.NODE_ENV === 'production') {
    required.push('FRONTEND_URL', 'BACKEND_URL', 'CORS_ORIGIN');
  }

  const missing = required.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error(
      '\n❌  TRAINET — Missing required environment variables:\n' +
      missing.map(v => `     • ${v}`).join('\n') +
      '\n\n   Copy backend/.env.example to backend/.env and fill in the values.\n'
    );
    process.exit(1);
  }
}

validateConfig();

export default config;
