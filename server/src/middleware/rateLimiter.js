const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

/**
 * Creates a rate limiter with proper IPv6 support
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.max - Maximum number of requests per window (default: 15)
 * @param {string} options.message - Error message (default: "Too many requests. Please try again later.")
 * @returns {Function} Express middleware function
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 15,
    message = "Too many requests. Please try again later."
  } = options;

  return rateLimit({
    windowMs,
    max,
    // Use the default key generator which properly handles IPv6
    // If user is authenticated, prefer user ID, otherwise fall back to IP
    keyGenerator: (req) => {
      // If user is authenticated, use user ID for rate limiting
      if (req.user?.id) {
        return `user:${req.user.id}`;
      }
      // For unauthenticated requests, use the IPv6-compatible IP key generator
      return ipKeyGenerator(req);
    },
    // Ensure proper IP handling for reverse proxies
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ 
        error: message,
        retryAfter: Math.ceil(windowMs / 1000) // seconds
      });
    },
  });
}

/**
 * Standard rate limiter for API routes
 * 15 requests per minute
 */
const standardLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: "Too many requests. Please try again later."
});

/**
 * Strict rate limiter for sensitive operations
 * 5 requests per minute
 */
const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests for this operation. Please try again later."
});

/**
 * Lenient rate limiter for read operations
 * 30 requests per minute
 */
const lenientLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many requests. Please slow down."
});

module.exports = {
  createRateLimiter,
  standardLimiter,
  strictLimiter,
  lenientLimiter
};