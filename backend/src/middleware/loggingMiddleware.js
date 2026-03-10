/**
 * Logging Middleware
 * HTTP request logging using Morgan
 */

import morgan from 'morgan';
import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Morgan format based on environment
 */
const format = config.nodeEnv === 'production' ? 'combined' : 'dev';

/**
 * Morgan middleware with Winston stream
 */
const loggingMiddleware = morgan(format, {
  stream: logger.stream,
  skip: (req, res) => {
    // Skip logging for health check in production
    return config.nodeEnv === 'production' && req.url === '/api/health';
  },
});

export default loggingMiddleware;
