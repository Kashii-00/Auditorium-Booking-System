/**
 * Frontend XSS Protection Utilities
 * Client-side input sanitization and output encoding
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return str.replace(/[&<>"'`=\/]/g, (match) => htmlEscapes[match]);
}

/**
 * Sanitize user input by removing dangerous characters
 * @param {string} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') {
    return input;
  }
  
  const {
    allowBasicFormatting = false,
    maxLength = 1000,
    removeScripts = true,
    removeEvents = true
  } = options;
  
  let sanitized = input;
  
  // Remove script tags and their content
  if (removeScripts) {
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    sanitized = sanitized.replace(/data:text\/html/gi, '');
  }
  
  // Remove event handlers
  if (removeEvents) {
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }
  
  // If basic formatting is not allowed, escape all HTML
  if (!allowBasicFormatting) {
    sanitized = escapeHtml(sanitized);
  } else {
    // Allow only safe HTML tags
    const allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p'];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    
    sanitized = sanitized.replace(tagRegex, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        // Keep allowed tags but remove attributes
        return `<${tagName}>`;
      }
      return escapeHtml(match);
    });
  }
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}

/**
 * Validate and sanitize email addresses
 * @param {string} email - Email to validate
 * @returns {Object} Validation result with sanitized email
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, sanitized: '', error: 'Email is required' };
  }
  
  const sanitized = sanitizeInput(email.trim().toLowerCase());
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Invalid email format' };
  }
  
  return { isValid: true, sanitized, error: null };
}

/**
 * Validate and sanitize phone numbers
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result with sanitized phone
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, sanitized: '', error: 'Phone number is required' };
  }
  
  // Remove all non-numeric characters except +, -, (, ), and spaces
  const sanitized = phone.replace(/[^0-9+\-\s()]/g, '').trim();
  
  // Basic validation - should have at least 7 digits
  const digitCount = (sanitized.match(/\d/g) || []).length;
  if (digitCount < 7) {
    return { isValid: false, sanitized, error: 'Phone number must have at least 7 digits' };
  }
  
  return { isValid: true, sanitized, error: null };
}

/**
 * Sanitize form data object
 * @param {Object} formData - Form data to sanitize
 * @param {Object} fieldOptions - Per-field sanitization options
 * @returns {Object} Sanitized form data
 */
export function sanitizeFormData(formData, fieldOptions = {}) {
  if (!formData || typeof formData !== 'object') {
    return formData;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    const options = fieldOptions[key] || {};
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item, options) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Safe render function for displaying user content
 * @param {string} content - Content to render safely
 * @param {Object} options - Rendering options
 * @returns {string} Safe content for display
 */
export function safeRender(content, options = {}) {
  const { allowHTML = false, truncate = null } = options;
  
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  let safe = allowHTML ? 
    sanitizeInput(content, { allowBasicFormatting: true }) : 
    escapeHtml(content);
  
  if (truncate && safe.length > truncate) {
    safe = safe.substring(0, truncate) + '...';
  }
  
  return safe;
}

/**
 * React component wrapper for safe text rendering
 * @param {Object} props - Component props
 * @returns {JSX.Element} Safe text component
 */
export function SafeText({ children, allowHTML = false, truncate = null, className = '', ...props }) {
  const safeContent = safeRender(children, { allowHTML, truncate });
  
  if (allowHTML) {
    return (
      <span 
        className={className}
        dangerouslySetInnerHTML={{ __html: safeContent }}
        {...props}
      />
    );
  }
  
  return (
    <span className={className} {...props}>
      {safeContent}
    </span>
  );
}

/**
 * Create a CSP nonce for inline scripts/styles
 * @returns {string} Random nonce value
 */
export function generateCSPNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate URL to prevent javascript: and data: URLs
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe
 */
export function isValidURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return false;
  }
  
  // Allow http, https, mailto, and relative URLs
  return /^(https?:\/\/|mailto:|\/|#)/.test(trimmed);
}

/**
 * Content Security Policy utilities
 */
export const CSP = {
  /**
   * Get CSP nonce from meta tag
   * @returns {string|null} CSP nonce or null
   */
  getNonce() {
    const metaTag = document.querySelector('meta[name="csp-nonce"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  },
  
  /**
   * Create script element with CSP nonce
   * @param {string} src - Script source
   * @param {Function} onLoad - Load callback
   * @returns {HTMLScriptElement} Script element
   */
  createScript(src, onLoad = null) {
    const script = document.createElement('script');
    script.src = src;
    
    const nonce = this.getNonce();
    if (nonce) {
      script.nonce = nonce;
    }
    
    if (onLoad) {
      script.onload = onLoad;
    }
    
    return script;
  }
};

// Default export with all utilities
export default {
  escapeHtml,
  sanitizeInput,
  validateEmail,
  validatePhone,
  sanitizeFormData,
  safeRender,
  SafeText,
  generateCSPNonce,
  isValidURL,
  CSP
};
