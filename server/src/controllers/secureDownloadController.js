/**
 * Secure File Download Controller
 * 
 * Provides secure, authenticated file downloads with proper headers
 * and access control for all uploaded files.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config/app.config');

/**
 * Set secure headers for file downloads
 */
const setSecureDownloadHeaders = (res, filename, contentType = 'application/octet-stream') => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Download headers
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

/**
 * Validate file path is within secure upload directory
 */
const validateSecureFilePath = (filePath) => {
  const secureUploadDir = path.resolve(config.uploads.root);
  const resolvedPath = path.resolve(filePath);
  
  // Ensure file is within secure upload directory
  if (!resolvedPath.startsWith(secureUploadDir)) {
    throw new Error('Access denied: File outside secure directory');
  }
  
  return resolvedPath;
};

/**
 * Get content type based on file extension
 */
const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.zip': 'application/zip'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
};

/**
 * Generic secure download handler
 */
const secureDownload = async (req, res, options = {}) => {
  try {
    const { filePath, filename, userId, userType = 'user' } = options;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path not specified' });
    }
    
    // Validate and resolve file path
    const securePath = validateSecureFilePath(filePath);
    
    // Check if file exists
    if (!fs.existsSync(securePath)) {
      logger.warn('File not found for download', {
        filePath: securePath,
        userId,
        userType,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file stats
    const stats = fs.statSync(securePath);
    const downloadFilename = filename || path.basename(securePath);
    const contentType = getContentType(downloadFilename);
    
    // Set secure headers
    setSecureDownloadHeaders(res, downloadFilename, contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Log download attempt
    logger.info('Secure file download initiated', {
      filePath: securePath,
      filename: downloadFilename,
      fileSize: stats.size,
      contentType,
      userId,
      userType,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(securePath, {
      highWaterMark: 64 * 1024 // 64KB chunks
    });
    
    fileStream.on('error', (error) => {
      logger.error('File stream error during download', {
        error: error.message,
        filePath: securePath,
        userId,
        userType
      });
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    
    fileStream.on('end', () => {
      logger.info('File download completed successfully', {
        filePath: securePath,
        filename: downloadFilename,
        userId,
        userType
      });
    });
    
    // Pipe file to response
    fileStream.pipe(res);
    
  } catch (error) {
    logger.error('Secure download error', {
      error: error.message,
      userId: options.userId,
      userType: options.userType,
      ip: req.ip
    });
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.status(500).json({ error: 'Download failed' });
  }
};

/**
 * Student document download with ownership verification
 */
const downloadStudentDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id || req.student?.studentId;
    
    // Get document details from database
    const document = await req.db.queryPromise(
      'SELECT * FROM student_documents WHERE id = ? AND student_id = ?',
      [documentId, userId]
    );
    
    if (document.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }
    
    const doc = document[0];
    
    await secureDownload(req, res, {
      filePath: doc.file_path,
      filename: doc.original_filename || doc.filename,
      userId,
      userType: 'student'
    });
    
  } catch (error) {
    logger.error('Student document download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
};

/**
 * Lecturer material download with access verification
 */
const downloadLecturerMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const lecturerId = req.lecturer?.lecturerId;
    
    // Verify lecturer has access to this material
    const material = await req.db.queryPromise(`
      SELECT bm.*, lb.lecturer_id
      FROM batch_materials bm
      JOIN lecturer_batches lb ON bm.batch_id = lb.batch_id
      WHERE bm.id = ? AND lb.lecturer_id = ?
    `, [materialId, lecturerId]);
    
    if (material.length === 0) {
      return res.status(403).json({ error: 'Access denied to this material' });
    }
    
    const mat = material[0];
    
    await secureDownload(req, res, {
      filePath: mat.file_path,
      filename: mat.file_name || mat.title,
      userId: lecturerId,
      userType: 'lecturer'
    });
    
  } catch (error) {
    logger.error('Lecturer material download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
};

/**
 * Assignment submission download with access verification
 */
const downloadAssignmentSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.id || req.student?.studentId || req.lecturer?.lecturerId;
    const userType = req.student ? 'student' : 'lecturer';
    
    let submission;
    
    if (userType === 'student') {
      // Students can only download their own submissions
      submission = await req.db.queryPromise(`
        SELECT asub.*, a.title as assignment_title
        FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.id
        WHERE asub.id = ? AND asub.student_id = ?
      `, [submissionId, userId]);
    } else {
      // Lecturers can download submissions for their assignments
      submission = await req.db.queryPromise(`
        SELECT asub.*, a.title as assignment_title, s.full_name as student_name
        FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN students s ON asub.student_id = s.id
        JOIN batches b ON a.batch_id = b.id
        JOIN lecturer_batches lb ON b.id = lb.batch_id
        WHERE asub.id = ? AND lb.lecturer_id = ?
      `, [submissionId, userId]);
    }
    
    if (submission.length === 0) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }
    
    const sub = submission[0];
    
    if (!sub.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }
    
    // Generate appropriate filename
    let downloadFilename = sub.file_name;
    if (userType === 'lecturer' && sub.student_name) {
      const studentName = sub.student_name.replace(/[^a-zA-Z0-9]/g, '_');
      const assignmentTitle = sub.assignment_title.replace(/[^a-zA-Z0-9]/g, '_');
      downloadFilename = `${studentName}_${assignmentTitle}_${sub.file_name}`;
    }
    
    await secureDownload(req, res, {
      filePath: sub.file_path,
      filename: downloadFilename,
      userId,
      userType
    });
    
  } catch (error) {
    logger.error('Assignment submission download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
};

module.exports = {
  secureDownload,
  downloadStudentDocument,
  downloadLecturerMaterial,
  downloadAssignmentSubmission,
  setSecureDownloadHeaders,
  validateSecureFilePath,
  getContentType
};
