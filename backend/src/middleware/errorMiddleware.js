/**
 * Error Handling Middleware
 * Centralized error handling for Express
 */

import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Handle 404 Not Found
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found',
  });
};

/**
 * Global error handler
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    isOperational = true;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }
  // Handle other errors
  else if (err.message) {
    message = err.message;
  }

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
      error: err,
      stack: err.stack,
    });
  }

  // Send error response
  const response = {
    success: false,
    message,
    error: err.name || 'Error',
  };

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
