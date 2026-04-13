/**
 * Express Application Configuration
 * Setup middleware and routes
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, corsOptions } from './config/index.js';
import {
  loggingMiddleware,
  generalLimiter,
  errorHandler,
  notFound,
} from './middleware/index.js';
import routes from './routes/index.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create Express application
 */
const app = express();

/**
 * Security Middleware
 * Allow cross-origin image loading for uploaded avatars
 */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

/**
 * CORS Middleware
 */
app.use(cors(corsOptions));

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Static File Serving for Uploads
 * Cross-origin headers allow the frontend (port 3000) to load images from backend (port 5000)
 */
const staticOptions = {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
};
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars'), staticOptions));

/**
 * Logging Middleware
 */
app.use(loggingMiddleware);

/**
 * Rate Limiting Middleware
 */
app.use(generalLimiter);

/**
 * API Routes
 */
app.use(config.apiPrefix, routes);

/**
 * Root route
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TRAINET Backend Server',
    data: {
      version: '1.0.0',
      apiPrefix: config.apiPrefix,
    },
  });
});

/**
 * 404 Handler
 */
app.use(notFound);

/**
 * Error Handler
 */
app.use(errorHandler);

/**
 * Unhandled Promise Rejection Handler
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit the process
  // process.exit(1);
});

/**
 * Uncaught Exception Handler
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Exit the process for uncaught exceptions
  process.exit(1);
});

export default app;
