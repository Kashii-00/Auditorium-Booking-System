/**
 * Comprehensive File Upload Security Middleware
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../logger');

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.msi', '.com', '.scr', '.bat', '.cmd', '.pif',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.vbs', '.js', '.jar',
  '.py', '.rb', '.pl', '.php', '.asp', '.aspx', '.jsp',
  '.dll', '.so', '.dylib', '.sys', '.drv',
  '.app', '.dmg', '.pkg',
  '.htaccess', '.htpasswd', '.ini', '.conf',
  '.sql', '.db', '.sqlite', '.mdb',
  '.iso', '.img', '.bin', '.deb', '.rpm',
  '.svg' // SVG can contain JavaScript
];

// Allowed file types per upload category
const UPLOAD_CATEGORIES = {
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
      // Note: SVG excluded for security (can contain scripts)
    ],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  
  assignments: {
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.zip'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/zip',
      'application/x-zip-compressed'
    ],
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  
  materials: {
    extensions: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.zip'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/zip'
    ],
    maxSize: 100 * 1024 * 1024 // 100MB
  }
};

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFilename(originalName) {
  if (!originalName || typeof originalName !== 'string') {
    return `file_${Date.now()}.tmp`;
  }
  
  // Remove null bytes and control characters
  let sanitized = originalName.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // URL decode to handle encoded attacks
  try {
    sanitized = decodeURIComponent(sanitized);
  } catch (e) {
    // If decoding fails, continue with original
  }
  
  // Remove path traversal attempts (multiple passes to handle nested attempts)
  for (let i = 0; i < 5; i++) {
    sanitized = sanitized.replace(/\.\./g, '');
    sanitized = sanitized.replace(/\.\.\//g, '');
    sanitized = sanitized.replace(/\.\.\\/g, '');
    sanitized = sanitized.replace(/\/\.\./g, '');
    sanitized = sanitized.replace(/\\\.\./g, '');
  }
  
  // Remove path separators and dangerous characters
  sanitized = sanitized.replace(/[/\\]/g, '');
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Convert spaces to underscores for better filename compatibility
  sanitized = sanitized.replace(/\s+/g, '_');
  
  // Remove absolute path indicators
  sanitized = sanitized.replace(/^[A-Za-z]:/g, ''); // Windows drive letters
  sanitized = sanitized.replace(/^~/g, ''); // Unix home directory
  
  // Remove common dangerous path components
  const dangerousPaths = ['etc', 'windows', 'system32', 'bin', 'usr', 'var', 'tmp'];
  for (const dangerous of dangerousPaths) {
    const regex = new RegExp(dangerous, 'gi');
    sanitized = sanitized.replace(regex, '');
  }
  
  // Limit length
  if (sanitized.length > 100) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext).substring(0, 90);
    sanitized = name + ext;
  }
  
  // Ensure filename is not empty and contains valid characters
  if (!sanitized || sanitized === '.' || sanitized === '..' || sanitized.trim() === '') {
    sanitized = `file_${Date.now()}.tmp`;
  }
  
  return sanitized;
}

/**
 * Generate secure filename with timestamp and random suffix
 */
function generateSecureFilename(originalName, category) {
  const sanitizedOriginal = sanitizeFilename(originalName);
  const extension = path.extname(sanitizedOriginal).toLowerCase();
  const baseName = path.basename(sanitizedOriginal, extension);
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  
  return `${category}_${timestamp}_${randomSuffix}_${baseName}${extension}`;
}

/**
 * Create secure upload directory outside web root
 */
function createSecureUploadDir(category, userIdentifier = '') {
  const baseDir = path.join(__dirname, '../../secure_uploads');
  const categoryDir = path.join(baseDir, category);
  const userDir = userIdentifier ? path.join(categoryDir, userIdentifier.toString()) : categoryDir;
  
  // Ensure directory exists
  fs.mkdirSync(userDir, { recursive: true });
  
  // Set restrictive permissions (owner read/write only)
  try {
    fs.chmodSync(userDir, 0o700);
  } catch (error) {
    logger.warn('Could not set directory permissions:', error);
  }
  
  return userDir;
}

/**
 * Comprehensive file validation
 */
function validateFile(file, category) {
  const config = UPLOAD_CATEGORIES[category];
  if (!config) {
    throw new Error(`Invalid upload category: ${category}`);
  }
  
  // Check file size
  if (file.size > config.maxSize) {
    throw new Error(`File too large. Maximum size: ${Math.round(config.maxSize / 1024 / 1024)}MB`);
  }
  
  // Get file extension
  const extension = path.extname(file.originalname).toLowerCase();
  
  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    throw new Error('File type not allowed for security reasons');
  }
  
  // Check allowed extensions
  if (!config.extensions.includes(extension)) {
    throw new Error(`File type not allowed. Allowed types: ${config.extensions.join(', ')}`);
  }
  
  // Check MIME type with special handling for ZIP files
  if (!config.mimeTypes.includes(file.mimetype)) {
    // Special case: Some browsers send 'application/octet-stream' for ZIP files
    if (extension === '.zip' && file.mimetype === 'application/octet-stream' && 
        config.extensions.includes('.zip')) {
      // Allow it, but it will be validated by magic number check later
      logger.info(`Allowing ZIP file with generic MIME type: ${file.originalname}`);
    } else {
      throw new Error(`Invalid MIME type. Expected: ${config.mimeTypes.join(', ')}, got: ${file.mimetype}`);
    }
  }
  
  return true;
}

module.exports = {
  sanitizeFilename,
  generateSecureFilename,
  createSecureUploadDir,
  validateFile,
  UPLOAD_CATEGORIES,
  DANGEROUS_EXTENSIONS
};