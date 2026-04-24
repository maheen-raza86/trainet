/**
 * Server Entry Point
 * Start the Express server
 */

import app from './app.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';
import { ensureBucketExists } from './utils/storageService.js';

/**
 * Start server
 */
const server = app.listen(config.port, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 TRAINET Backend Server Started                      ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(43)}║
║   Port:        ${config.port.toString().padEnd(43)}║
║   API Prefix:  ${config.apiPrefix.padEnd(43)}║
║   Health:      http://localhost:${config.port}${config.apiPrefix}/health${' '.repeat(11)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Ensure Supabase Storage bucket exists (non-blocking)
  ensureBucketExists().catch(err =>
    logger.error('[Storage] Bucket init failed:', err.message)
  );
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections, cleanup resources, etc.
    // Add cleanup logic here
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

/**
 * Listen for termination signals
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
