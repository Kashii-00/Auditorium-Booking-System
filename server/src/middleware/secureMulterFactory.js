/**
 * Secure Multer Factory
 * 
 * Creates secure multer configurations with comprehensive validation
 */

const multer = require('multer');
const path = require('path');
const logger = require('../logger');
const { 
  sanitizeFilename, 
  generateSecureFilename, 
  createSecureUploadDir, 
  validateFile, 
  UPLOAD_CATEGORIES 
} = require('./fileUploadSecurity');
const { postUploadValidation } = require('./fileSignatureValidator');

/**
 * Create secure multer configuration for a specific category
 */
function createSecureUpload(category, userIdentifierField = null) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const userIdentifier = userIdentifierField ? req[userIdentifierField] : null;
        const uploadDir = createSecureUploadDir(
          category, 
          userIdentifier?.id || userIdentifier?.studentId || userIdentifier?.lecturerId
        );
        cb(null, uploadDir);
      } catch (error) {
        logger.error('Error creating upload directory:', error);
        cb(error);
      }
    },
    
    filename: (req, file, cb) => {
      try {
        const secureFilename = generateSecureFilename(file.originalname, category);
        cb(null, secureFilename);
      } catch (error) {
        logger.error('Error generating secure filename:', error);
        cb(error);
      }
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: UPLOAD_CATEGORIES[category]?.maxSize || 10 * 1024 * 1024,
      files: 10, // Maximum number of files
      fields: 20, // Maximum number of form fields
      fieldNameSize: 100, // Maximum field name size
      fieldSize: 1024 * 1024 // Maximum field value size (1MB)
    },
    
    fileFilter: (req, file, cb) => {
      try {
        validateFile(file, category);
        cb(null, true);
      } catch (error) {
        logger.warn(`File upload rejected: ${error.message}`, {
          filename: file.originalname,
          mimetype: file.mimetype,
          category: category
        });
        cb(error);
      }
    }
  });
  
  // Add post-upload validation middleware
  const uploadWithValidation = (fieldName) => {
    return async (req, res, next) => {
      upload.single(fieldName)(req, res, async (err) => {
        if (err) {
          logger.error('Upload error:', err);
          
          if (err instanceof multer.MulterError) {
            switch (err.code) {
              case 'LIMIT_FILE_SIZE':
                return res.status(400).json({ error: 'File too large' });
              case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ error: 'Too many files' });
              case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ error: 'Unexpected file field' });
              default:
                return res.status(400).json({ error: 'Upload error' });
            }
          }
          
          return res.status(400).json({ error: err.message });
        }
        
        // Post-upload validation
        if (req.file) {
          try {
            await postUploadValidation(req.file.path, req.file.mimetype, req.file.originalname);
            logger.info('File upload successful', {
              filename: req.file.filename,
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              category: category
            });
            next();
          } catch (validationError) {
            logger.error('Post-upload validation failed:', validationError);
            return res.status(400).json({ error: validationError.message });
          }
        } else {
          next();
        }
      });
    };
  };
  
  // Multi-file upload with validation
  const uploadMultipleWithValidation = (fieldConfigs) => {
    return async (req, res, next) => {
      upload.fields(fieldConfigs)(req, res, async (err) => {
        if (err) {
          logger.error('Multi-file upload error:', err);
          
          if (err instanceof multer.MulterError) {
            switch (err.code) {
              case 'LIMIT_FILE_SIZE':
                return res.status(400).json({ error: 'File too large' });
              case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ error: 'Too many files' });
              case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ error: 'Unexpected file field' });
              default:
                return res.status(400).json({ error: 'Upload error' });
            }
          }
          
          return res.status(400).json({ error: err.message });
        }
        
        // Post-upload validation for all files
        if (req.files) {
          try {
            for (const fieldName of Object.keys(req.files)) {
              const files = req.files[fieldName];
              for (const file of files) {
                await postUploadValidation(file.path, file.mimetype, file.originalname);
              }
            }
            
            logger.info('Multi-file upload successful', {
              fileCount: Object.values(req.files).flat().length,
              category: category
            });
            next();
          } catch (validationError) {
            logger.error('Post-upload validation failed for multi-file:', validationError);
            
            // Clean up all uploaded files
            if (req.files) {
              for (const files of Object.values(req.files)) {
                for (const file of files) {
                  try {
                    require('fs').unlinkSync(file.path);
                  } catch (cleanupError) {
                    logger.error('Failed to cleanup file:', cleanupError);
                  }
                }
              }
            }
            
            return res.status(400).json({ error: validationError.message });
          }
        } else {
          next();
        }
      });
    };
  };
  
  return {
    upload,
    uploadWithValidation,
    uploadMultipleWithValidation,
    storage
  };
}

/**
 * Secure file serving middleware
 */
function createSecureFileServer() {
  return (req, res, next) => {
    // Validate file path to prevent directory traversal
    const filePath = req.filePath; // Should be set by route handler
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path not specified' });
    }
    
    // Ensure file is within secure upload directory
    const secureUploadDir = path.join(__dirname, '../../secure_uploads');
    const resolvedPath = path.resolve(filePath);
    const resolvedSecureDir = path.resolve(secureUploadDir);
    
    if (!resolvedPath.startsWith(resolvedSecureDir)) {
      logger.warn('Attempted path traversal attack:', { 
        requestedPath: filePath, 
        resolvedPath,
        userAgent: req.get('User-Agent'),
        ip: req.ip 
      });
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    if (!require('fs').existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    next();
  };
}

module.exports = {
  createSecureUpload,
  createSecureFileServer
};
