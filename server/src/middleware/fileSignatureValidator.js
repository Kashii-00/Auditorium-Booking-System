/**
 * File Signature (Magic Number) Validation
 * 
 * This module validates file content against expected MIME types using
 * magic number signatures to prevent file type spoofing attacks.
 */

const fs = require('fs');
const logger = require('../logger');

// Magic number signatures for common file types
const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG/JFIF
    [0xFF, 0xD8, 0xFF, 0xE1] // JPEG/EXIF
  ],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  'image/bmp': [[0x42, 0x4D]], // BMP
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // WEBP (partial)
  
  // Documents
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // PDF
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04], // DOCX (ZIP-based)
    [0x50, 0x4B, 0x05, 0x06], // DOCX (empty ZIP)
    [0x50, 0x4B, 0x07, 0x08]  // DOCX (spanned ZIP)
  ],
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    [0x50, 0x4B, 0x03, 0x04] // XLSX (ZIP-based)
  ],
  'application/vnd.ms-powerpoint': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // PPT
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    [0x50, 0x4B, 0x03, 0x04] // PPTX (ZIP-based)
  ],
  'text/plain': [], // Text files can have various or no signatures
  
  // Archives
  'application/zip': [
    [0x50, 0x4B, 0x03, 0x04], // ZIP
    [0x50, 0x4B, 0x05, 0x06], // Empty ZIP
    [0x50, 0x4B, 0x07, 0x08]  // Spanned ZIP
  ],
  'application/x-zip-compressed': [
    [0x50, 0x4B, 0x03, 0x04], // ZIP
    [0x50, 0x4B, 0x05, 0x06], // Empty ZIP
    [0x50, 0x4B, 0x07, 0x08]  // Spanned ZIP
  ],
  'application/x-rar-compressed': [[0x52, 0x61, 0x72, 0x21, 0x1A, 0x07]], // RAR
  'application/x-7z-compressed': [[0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]], // 7Z
};

// Known malicious signatures to block
const MALICIOUS_SIGNATURES = [
  // Windows executables
  [0x4D, 0x5A], // MZ (DOS/Windows executable)
  [0x5A, 0x4D], // ZM (DOS executable variant)
  
  // ELF executables (Linux/Unix)
  [0x7F, 0x45, 0x4C, 0x46], // ELF
  
  // Mach-O executables (macOS)
  [0xFE, 0xED, 0xFA, 0xCE], // Mach-O 32-bit
  [0xFE, 0xED, 0xFA, 0xCF], // Mach-O 64-bit
  [0xCE, 0xFA, 0xED, 0xFE], // Mach-O reverse byte order
  [0xCF, 0xFA, 0xED, 0xFE], // Mach-O 64-bit reverse
  
  // Java class files
  [0xCA, 0xFE, 0xBA, 0xBE], // Java class
  
  // Script signatures that could be dangerous
  [0x23, 0x21], // #! (shebang - shell script)
];

/**
 * Validate file signature (magic numbers) against expected MIME type
 */
function validateFileSignature(filePath, expectedMimeType) {
  try {
    const buffer = fs.readFileSync(filePath, { encoding: null, flag: 'r' });
    
    // Check for malicious signatures first
    for (const maliciousSignature of MALICIOUS_SIGNATURES) {
      if (matchesSignature(buffer, maliciousSignature)) {
        logger.warn('Malicious file signature detected', {
          filePath,
          expectedMimeType,
          signature: maliciousSignature
        });
        return false;
      }
    }
    
    const signatures = FILE_SIGNATURES[expectedMimeType];
    
    if (!signatures || signatures.length === 0) {
      // For file types without specific signatures (like text), allow if other checks pass
      return true;
    }
    
    // Check if file starts with any of the expected signatures
    for (const signature of signatures) {
      if (signature.length === 0) continue;
      
      if (matchesSignature(buffer, signature)) {
        return true;
      }
    }
    
    logger.warn('File signature validation failed', {
      filePath,
      expectedMimeType,
      actualSignature: Array.from(buffer.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
    });
    
    return false;
  } catch (error) {
    logger.error('Error validating file signature:', error);
    return false;
  }
}

/**
 * Check if buffer matches a signature
 */
function matchesSignature(buffer, signature) {
  if (signature.length > buffer.length) {
    return false;
  }
  
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Detect file type from content (returns MIME type or null)
 */
function detectFileType(filePath) {
  try {
    const buffer = fs.readFileSync(filePath, { encoding: null, flag: 'r' });
    
    // Special handling for ZIP-based formats
    if (matchesSignature(buffer, [0x50, 0x4B, 0x03, 0x04]) || 
        matchesSignature(buffer, [0x50, 0x4B, 0x05, 0x06]) || 
        matchesSignature(buffer, [0x50, 0x4B, 0x07, 0x08])) {
      
      // Try to distinguish between ZIP and Office documents by reading more content
      if (buffer.length > 100) {
        const content = buffer.toString('ascii', 0, 100).toLowerCase();
        
        // Look for Office document signatures in the ZIP content
        if (content.includes('word/') || content.includes('xl/') || content.includes('ppt/') ||
            content.includes('docprops/') || content.includes('_rels/')) {
          
          // This is likely an Office document - determine which type
          if (content.includes('word/')) {
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (content.includes('xl/')) {
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          } else if (content.includes('ppt/')) {
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          }
        }
      }
      
      // If no Office document signatures found, treat as regular ZIP
      logger.info('ZIP file detected (not an Office document)', { filePath });
      return 'application/zip';
    }
    
    // Check against other known signatures (non-ZIP based)
    for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
      // Skip ZIP-based formats as they're handled above
      if (mimeType.includes('zip') || mimeType.includes('openxmlformats')) {
        continue;
      }
      
      for (const signature of signatures) {
        if (signature.length > 0 && matchesSignature(buffer, signature)) {
          return mimeType;
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error detecting file type:', error);
    return null;
  }
}

/**
 * Advanced content security scanning
 */
async function performAdvancedContentScan(filePath, expectedMimeType, originalFilename) {
  const buffer = fs.readFileSync(filePath);
  const content = buffer.toString('binary', 0, Math.min(buffer.length, 10000)); // First 10KB
  
  // 1. Scan for embedded executables
  const executableSignatures = [
    [0x4D, 0x5A], // MZ (Windows executable)
    [0x7F, 0x45, 0x4C, 0x46], // ELF (Linux executable)
    [0xFE, 0xED, 0xFA, 0xCE], // Mach-O (macOS executable)
    [0xCA, 0xFE, 0xBA, 0xBE], // Java class
  ];
  
  for (const signature of executableSignatures) {
    if (buffer.indexOf(Buffer.from(signature)) !== -1) {
      logger.warn('Embedded executable detected in uploaded file', {
        filePath,
        originalFilename,
        expectedMimeType
      });
      throw new Error('File contains embedded executable content');
    }
  }
  
  // 2. Scan for script content in images/documents
  const scriptPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i, // Event handlers
    /eval\s*\(/i,
    /document\.(write|cookie)/i,
    /window\.(location|open)/i
  ];
  
  for (const pattern of scriptPatterns) {
    if (pattern.test(content)) {
      logger.warn('Script content detected in uploaded file', {
        filePath,
        originalFilename,
        expectedMimeType,
        pattern: pattern.toString()
      });
      throw new Error('File contains potentially malicious script content');
    }
  }
  
  // 3. Scan for macro indicators in Office documents
  if (expectedMimeType.includes('openxmlformats')) {
    const macroIndicators = [
      'vbaProject.bin',
      'macros/',
      'xl/macrosheets/',
      'word/vbaProject',
      'ppt/vbaProject'
    ];
    
    for (const indicator of macroIndicators) {
      if (content.includes(indicator)) {
        logger.warn('Macro content detected in Office document', {
          filePath,
          originalFilename,
          indicator
        });
        throw new Error('Office document contains macro content which is not allowed');
      }
    }
  }
  
  // 4. Scan for external references
  const externalRefPatterns = [
    /https?:\/\/[^\s"'<>]+/gi,
    /\\\\[^\s"'<>]+/g, // UNC paths
    /file:\/\/[^\s"'<>]+/gi
  ];
  
  for (const pattern of externalRefPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      logger.warn('External references detected in uploaded file', {
        filePath,
        originalFilename,
        references: matches.slice(0, 3) // Log first 3 references
      });
      throw new Error('File contains external references which are not allowed');
    }
  }
  
  // 5. Polyglot detection - check for multiple file signatures
  const detectedSignatures = [];
  const commonSignatures = [
    { name: 'PDF', signature: [0x25, 0x50, 0x44, 0x46] },
    { name: 'ZIP', signature: [0x50, 0x4B, 0x03, 0x04] },
    { name: 'JPEG', signature: [0xFF, 0xD8, 0xFF] },
    { name: 'PNG', signature: [0x89, 0x50, 0x4E, 0x47] },
    { name: 'EXE', signature: [0x4D, 0x5A] }
  ];
  
  for (const sig of commonSignatures) {
    if (buffer.indexOf(Buffer.from(sig.signature)) !== -1) {
      detectedSignatures.push(sig.name);
    }
  }
  
  if (detectedSignatures.length > 1) {
    logger.warn('Polyglot file detected (multiple format signatures)', {
      filePath,
      originalFilename,
      detectedSignatures
    });
    throw new Error(`Polyglot file detected with signatures: ${detectedSignatures.join(', ')}`);
  }
}

/**
 * Post-upload file validation (magic numbers, content analysis)
 */
async function postUploadValidation(filePath, expectedMimeType, originalFilename) {
  try {
    // Validate file signature
    if (!validateFileSignature(filePath, expectedMimeType)) {
      throw new Error('File content does not match declared type (possible file type spoofing)');
    }
    
    // Advanced content security scanning
    await performAdvancedContentScan(filePath, expectedMimeType, originalFilename);
    
    // Check for zip bombs (basic detection)
    if (expectedMimeType === 'application/zip') {
      const stats = fs.statSync(filePath);
      if (stats.size > 100 * 1024 * 1024) { // 100MB
        throw new Error('Archive file too large');
      }
    }
    
    // Detect actual file type and compare
    const detectedType = detectFileType(filePath);
    if (detectedType && detectedType !== expectedMimeType) {
      // Allow some flexibility for similar types
      const allowedMismatches = [
        ['image/jpeg', 'image/jpg'],
        ['application/zip', 'application/x-zip-compressed'],
        ['application/x-zip-compressed', 'application/zip'],
        ['text/plain', 'text/csv']
      ];
      
      const isAllowedMismatch = allowedMismatches.some(([type1, type2]) =>
        (detectedType === type1 && expectedMimeType === type2) ||
        (detectedType === type2 && expectedMimeType === type1)
      );
      
      // Special case: ZIP files sent as application/octet-stream
      const isZipWithGenericMime = (
        (detectedType === 'application/zip' || detectedType === 'application/x-zip-compressed') &&
        expectedMimeType === 'application/octet-stream' &&
        originalFilename && originalFilename.toLowerCase().endsWith('.zip')
      );
      
      if (!isAllowedMismatch && !isZipWithGenericMime) {
        logger.warn('File type mismatch detected', {
          filePath,
          originalFilename,
          expectedMimeType,
          detectedType
        });
        throw new Error(`File type mismatch: expected ${expectedMimeType}, detected ${detectedType}`);
      }
    }
    
    return true;
  } catch (error) {
    // Clean up the uploaded file if validation fails
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      logger.error('Failed to cleanup invalid file:', cleanupError);
    }
    throw error;
  }
}

module.exports = {
  validateFileSignature,
  detectFileType,
  postUploadValidation,
  FILE_SIGNATURES,
  MALICIOUS_SIGNATURES
};
