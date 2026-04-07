/**
 * Rate Limiting Middleware
 * Protect API from abuse
 */

import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

/**
 * General rate limiter
 * Disabled in test and development environments
 */
export const generalLimiter =
  config.nodeEnv === 'test' || config.nodeEnv === 'development'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.maxRequests,
        message: {
          success: false,
          message: 'Too many requests from this IP, please try again later.',
          error: 'Rate Limit Exceeded',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

/**
 * Strict rate limiter for authentication routes
 * Disabled in test and development environments
 */
export const authLimiter =
  config.nodeEnv === 'test' || config.nodeEnv === 'development'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 requests per window
        message: {
          success: false,
          message: 'Too many authentication attempts, please try again later.',
          error: 'Rate Limit Exceeded',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
