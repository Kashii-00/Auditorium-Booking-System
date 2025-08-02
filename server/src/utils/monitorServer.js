/**
 * Server monitoring utility
 * Provides helper functions to track API performance and errors
 */
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

// Track request stats
const requestStats = {
  totalRequests: 0,
  routeHits: {},
  statusCodes: {},
  errors: [],
  startTime: Date.now()
};

// Create middleware to track API usage
const requestMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  // Track route
  const route = `${req.method} ${req.path}`;
  requestStats.totalRequests++;
  requestStats.routeHits[route] = (requestStats.routeHits[route] || 0) + 1;
  
  // Track response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Track status codes
    const statusCode = res.statusCode;
    requestStats.statusCodes[statusCode] = (requestStats.statusCodes[statusCode] || 0) + 1;
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      logger.warn(`Slow request: ${route} - ${duration}ms`);
    }
    
    // Track errors (status codes >= 400)
    if (statusCode >= 400) {
      requestStats.errors.push({
        timestamp: new Date().toISOString(),
        route,
        statusCode,
        duration,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress
      });
      
      // Keep only the last 100 errors
      if (requestStats.errors.length > 100) {
        requestStats.errors.shift();
      }
    }
  });
  
  next();
};

// Function to get current stats
const getStats = () => {
  const uptime = Math.floor((Date.now() - requestStats.startTime) / 1000); // in seconds
  return {
    ...requestStats,
    uptime,
    uptimeFormatted: formatUptime(uptime),
    timestamp: new Date().toISOString()
  };
};

// Format uptime into human-readable string
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

// Generate a report file
const generateReport = () => {
  const stats = getStats();
  const reportDir = path.join(__dirname, '..', '..', 'reports');
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `server-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
  
  logger.info(`Server report generated: ${reportPath}`);
  return reportPath;
};

// Schedule regular reports (every 24 hours)
setInterval(() => {
  try {
    generateReport();
  } catch (error) {
    logger.error('Failed to generate server report:', error);
  }
}, 24 * 60 * 60 * 1000); // 24 hours

module.exports = {
  requestMonitor,
  getStats,
  generateReport
};
