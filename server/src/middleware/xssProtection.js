const xss = require('xss');
const logger = require('../logger');

// XSS filtering options with comprehensive whitelist
const xssOptions = {
  whiteList: {
    // Basic text formatting
    a: ['href', 'title', 'target'],
    img: ['src', 'alt', 'width', 'height'],
    p: [], br: [], strong: [], em: [], ul: [], ol: [], li: [],
    blockquote: [], code: [], pre: [],
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
    span: ['class'], div: ['class'],
    
    // Table elements
    table: ['class'], thead: [], tbody: [], 
    tr: ['class'], td: ['class'], th: ['class'],
    
    // Form elements (limited)
    input: ['type', 'name', 'value', 'placeholder', 'disabled', 'readonly'],
    select: ['name', 'disabled'], option: ['value', 'selected'],
    textarea: ['name', 'placeholder', 'disabled', 'readonly'],
    label: ['for'], button: ['type', 'disabled']
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  allowCommentTag: false,
  onTagAttr: function(tag, name, value, isWhiteAttr) {
    // Additional validation for href attributes
    if (tag === 'a' && name === 'href') {
      // Only allow safe protocols
      if (!/^(https?:\/\/|mailto:|tel:|\/|#)/.test(value)) {
        return ''; // Remove unsafe hrefs
      }
    }
    
    // Validate class attributes
    if (name === 'class') {
      // Only allow alphanumeric characters, hyphens, underscores, and spaces
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
        return '';
      }
    }
    
    return value;
  },
  onIgnoreTagAttr: function(tag, name, value, isWhiteAttr) {
    // Remove all non-whitelisted attributes
    return '';
  }
};

// Create XSS filter instance
const myXss = new xss.FilterXSS(xssOptions);

/**
 * Deep sanitize an object or array recursively
 * @param {*} obj - The object to sanitize
 * @returns {*} - Sanitized object
 */
function deepSanitize(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize both key and value
        const sanitizedKey = sanitizeText(key);
        sanitized[sanitizedKey] = deepSanitize(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize text content with basic XSS protection
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
  if (typeof text !== 'string') {
    return text;
  }

  // Basic XSS filtering
  return myXss.process(text);
}

/**
 * Sanitize HTML content with more permissive rules
 * @param {string} html - HTML to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return html;
  }

  return myXss.process(html);
}

/**
 * Validate and sanitize email addresses
 * @param {string} email - Email to validate
 * @returns {string} - Sanitized email or empty string if invalid
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }

  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeText(email);
  
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Validate and sanitize phone numbers
 * @param {string} phone - Phone number to validate
 * @returns {string} - Sanitized phone number
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except +, -, (, ), and spaces
  const sanitized = phone.replace(/[^\d+\-\(\)\s]/g, '');
  
  // Basic phone number validation (10-15 digits)
  const digitsOnly = sanitized.replace(/\D/g, '');
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return sanitized;
  }
  
  return '';
}

/**
 * XSS Protection Middleware
 * Sanitizes request body, query parameters, and URL parameters
 * @param {Object} options - Configuration options
 * @returns {Function} - Express middleware function
 */
function xssProtectionMiddleware(options = {}) {
  const {
    skipRoutes = [],
    logSanitization = true,
    strictMode = false
  } = options;

  return (req, res, next) => {
    // Skip certain routes (like file uploads)
    if (skipRoutes.some(route => req.path.includes(route))) {
      return next();
    }

    try {
      let sanitizationPerformed = false;

      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        const originalBody = JSON.stringify(req.body);
        req.body = deepSanitize(req.body);
        
        if (JSON.stringify(req.body) !== originalBody) {
          sanitizationPerformed = true;
        }
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        const originalQuery = JSON.stringify(req.query);
        req.query = deepSanitize(req.query);
        
        if (JSON.stringify(req.query) !== originalQuery) {
          sanitizationPerformed = true;
        }
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        const originalParams = JSON.stringify(req.params);
        req.params = deepSanitize(req.params);
        
        if (JSON.stringify(req.params) !== originalParams) {
          sanitizationPerformed = true;
        }
      }

      // Log sanitization if enabled
      if (logSanitization && sanitizationPerformed) {
        logger.info(`XSS sanitization performed on ${req.method} ${req.path}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }

      // In strict mode, reject requests with potential XSS
      if (strictMode && sanitizationPerformed) {
        logger.warn(`Potential XSS attempt blocked on ${req.method} ${req.path}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
        
        return res.status(400).json({
          error: 'Request contains potentially malicious content',
          code: 'XSS_DETECTED'
        });
      }

      next();
    } catch (error) {
      logger.error('XSS protection middleware error:', error);
      next(error);
    }
  };
}

module.exports = {
  xssProtectionMiddleware,
  deepSanitize,
  sanitizeText,
  sanitizeHTML,
  sanitizeEmail,
  sanitizePhone
};