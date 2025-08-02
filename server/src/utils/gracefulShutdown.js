/**
 * Graceful shutdown handler
 * Ensures all connections are properly closed before shutting down
 */
const logger = require('../logger');

module.exports = function setupGracefulShutdown(server, db) {
  // Function to gracefully shut down the server
  const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}, gracefully shutting down...`);
    
    // Create a shutdown timeout to force exit if graceful shutdown takes too long
    const forceExit = setTimeout(() => {
      logger.error('Forcing server shutdown after timeout');
      process.exit(1);
    }, 30000); // 30 seconds timeout
    
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connections
      if (db && typeof db.end === 'function') {
        db.end((err) => {
          if (err) {
            logger.error('Error closing database connection:', err);
          } else {
            logger.info('Database connection closed');
          }
          
          clearTimeout(forceExit);
          process.exit(0);
        });
      } else {
        clearTimeout(forceExit);
        logger.info('Shutdown complete');
        process.exit(0);
      }
    });
    
    // Stop accepting new connections
    server.emit('close');
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return gracefulShutdown;
};
