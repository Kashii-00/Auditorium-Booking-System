/**
 * Upload Rate Limiting Middleware
 * 
 * Provides rate limiting specifically for file upload endpoints
 * to prevent abuse and resource exhaustion attacks.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/app.config');
const logger = require('../logger');

/**
 * Create upload rate limiter with custom configuration
 */
const createUploadRateLimit = (options = {}) => {
  const defaultConfig = {
    windowMs: config.security.uploadRateLimit.windowMs,
    max: config.security.uploadRateLimit.max,
    message: {
      error: 'Too many upload attempts. Please wait before trying again.',
      retryAfter: Math.ceil(config.security.uploadRateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Handler for when limit is reached
    handler: (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || 'unknown';
      const userId = req.user?.id || req.student?.studentId || req.lecturer?.lecturerId || 'anonymous';
      
      logger.warn('Upload rate limit exceeded', {
        ip,
        userAgent,
        userId,
        endpoint: req.originalUrl,
        method: req.method,
        limit: defaultConfig.max,
        windowMs: defaultConfig.windowMs
      });

      res.status(429).json({
        error: 'Too many upload attempts. Please wait before trying again.',
        retryAfter: Math.ceil(defaultConfig.windowMs / 1000)
      });
    },
    ...options
  };

  return rateLimit(defaultConfig);
};

/**
 * Pre-configured rate limiters for different upload types
 */
const uploadRateLimiters = {
  // General upload rate limiter
  general: createUploadRateLimit(),
  
  // Stricter limits for bulk operations
  bulk: createUploadRateLimit({
    max: 5,
    handler: (req, res, next) => {
      logger.warn('Bulk upload rate limit exceeded', {
        ip: req.ip,
        endpoint: req.originalUrl
      });
      res.status(429).json({
        error: 'Too many bulk upload attempts. Please wait before trying again.',
        retryAfter: Math.ceil(config.security.uploadRateLimit.windowMs / 1000)
      });
    }
  }),
  
  // More lenient for document registration
  registration: createUploadRateLimit({
    max: 15,
    windowMs: 30 * 60 * 1000, // 30 minutes
    handler: (req, res, next) => {
      logger.warn('Registration upload rate limit exceeded', {
        ip: req.ip,
        endpoint: req.originalUrl
      });
      res.status(429).json({
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: 1800 // 30 minutes
      });
    }
  }),
  
  // Strict limits for sensitive uploads
  sensitive: createUploadRateLimit({
    max: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    handler: (req, res, next) => {
      logger.warn('Sensitive upload rate limit exceeded', {
        ip: req.ip,
        endpoint: req.originalUrl
      });
      res.status(429).json({
        error: 'Upload limit exceeded for sensitive documents. Please contact support if needed.',
        retryAfter: 300
      });
    }
  })
};

module.exports = {
  createUploadRateLimit,
  uploadRateLimiters
};
