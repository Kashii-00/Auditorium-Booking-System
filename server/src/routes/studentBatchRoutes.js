const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for assignment file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const studentId = req.student.studentId;
    const assignmentId = req.params.assignmentId;
    const uploadPath = path.join(__dirname, '../../uploads/assignments', `student_${studentId}`);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const assignmentId = req.params.assignmentId;
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `assignment_${assignmentId}_${timestamp}-${sanitizedFileName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common document and image formats
    const allowedTypes = /\.(pdf|doc|docx|txt|png|jpg|jpeg|zip|rar)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, PNG, JPG, ZIP, and RAR files are allowed'));
    }
  }
});

/**
 * Middleware to verify student JWT token
 */
const studentAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    req.student = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', tokenExpired: true });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Get batch details for student
 * GET /api/student-batches/:batchId
 */
router.get('/:batchId', studentAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.student.studentId;
    
    // Verify student is enrolled in this batch
    const enrollmentQuery = `
      SELECT sb.*, b.*, c.courseName, c.courseId
      FROM student_batches sb
      JOIN batches b ON sb.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE sb.student_id = ? AND sb.batch_id = ? AND sb.status = 'Active'
    `;
    
    const enrollments = await db.queryPromise(enrollmentQuery, [studentId, batchId]);
    
    if (enrollments.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this batch or enrollment inactive' });
    }
    
    const enrollment = enrollments[0];
    
    // Get batch details with additional info
    const batchQuery = `
      SELECT b.*, c.courseName, c.courseId, c.stream,
             sb.attendance_percentage, sb.enrollment_date,
             (SELECT COUNT(*) FROM student_batches WHERE batch_id = b.id AND status = 'Active') as total_students
      FROM batches b
      JOIN courses c ON b.course_id = c.id
      JOIN student_batches sb ON b.id = sb.batch_id
      WHERE b.id = ? AND sb.student_id = ?
    `;
    
    const batches = await db.queryPromise(batchQuery, [batchId, studentId]);
    
    if (batches.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const batch = batches[0];
    
    // Calculate batch status
    const now = new Date();
    const startDate = new Date(batch.start_date);
    const endDate = new Date(batch.end_date);
    
    let status = 'upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'active';
    } else if (now > endDate) {
      status = 'completed';
    }
    
    res.json({
      batch: {
        ...batch,
        status,
        attendancePercentage: batch.attendance_percentage
      }
    });
    
  } catch (error) {
    logger.error('Error fetching batch details for student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get materials for a batch (student view)
 * GET /api/student-batches/:batchId/materials
 */
router.get('/:batchId/materials', studentAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.student.studentId;
    
    // Verify student is enrolled in this batch
    const enrollmentCheck = await db.queryPromise(
      'SELECT id FROM student_batches WHERE student_id = ? AND batch_id = ? AND status = "Active"',
      [studentId, batchId]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this batch' });
    }
    
    // Get materials for this batch
    const materialsQuery = `
      SELECT bm.*, 
             CASE 
               WHEN bm.file_path IS NOT NULL THEN 
                 SUBSTRING_INDEX(bm.file_path, '.', -1)
               ELSE 'unknown'
             END as file_type
      FROM batch_materials bm
      WHERE bm.batch_id = ?
      ORDER BY bm.upload_date DESC, bm.created_at DESC
    `;
    
    const materials = await db.queryPromise(materialsQuery, [batchId]);
    
    res.json({ materials });
    
  } catch (error) {
    logger.error('Error fetching batch materials for student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get assignments for a batch (student view)
 * GET /api/student-batches/:batchId/assignments
 */
router.get('/:batchId/assignments', studentAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.student.studentId;
    
    // Verify student is enrolled in this batch
    const enrollmentCheck = await db.queryPromise(
      'SELECT id FROM student_batches WHERE student_id = ? AND batch_id = ? AND status = "Active"',
      [studentId, batchId]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this batch' });
    }
    
    // Get assignments for this batch
    const assignmentsQuery = `
      SELECT a.*,
             CASE 
               WHEN sa.id IS NOT NULL THEN 'submitted'
               ELSE 'pending'
             END as submission_status,
             sa.submitted_at as submission_date,
             sa.marks_obtained as grade,
             sa.status as submission_status_detail,
             sa.id as submission_id,
             sa.file_name as submitted_file_name,
             sa.submission_text as submitted_text,
             CASE 
               WHEN sa.id IS NOT NULL AND NOW() <= a.due_date THEN 'editable'
               WHEN sa.id IS NOT NULL AND NOW() > a.due_date THEN 'final'
               ELSE 'open'
             END as edit_status
      FROM assignments a
      LEFT JOIN assignment_submissions sa ON a.id = sa.assignment_id AND sa.student_id = ?
      WHERE a.batch_id = ? AND a.status = 'published'
      ORDER BY a.due_date ASC, a.created_at DESC
    `;
    
    const assignments = await db.queryPromise(assignmentsQuery, [studentId, batchId]);
    
    res.json({ assignments });
    
  } catch (error) {
    logger.error('Error fetching batch assignments for student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get announcements for a batch (student view)
 * GET /api/student-batches/:batchId/announcements
 */
router.get('/:batchId/announcements', studentAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.student.studentId;
    
    // Verify student is enrolled in this batch
    const enrollmentCheck = await db.queryPromise(
      'SELECT id FROM student_batches WHERE student_id = ? AND batch_id = ? AND status = "Active"',
      [studentId, batchId]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this batch' });
    }
    
    // Get announcements for this batch
    const announcementsQuery = `
      SELECT a.*
      FROM announcements a
      WHERE a.batch_id = ?
      ORDER BY a.created_at DESC
    `;
    
    const announcements = await db.queryPromise(announcementsQuery, [batchId]);
    
    res.json({ announcements });
    
  } catch (error) {
    logger.error('Error fetching batch announcements for student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Download material file (student view)
 * GET /api/student-batches/materials/:materialId/download
 */
router.get('/materials/:materialId/download', studentAuthMiddleware, async (req, res) => {
  try {
    const { materialId } = req.params;
    const studentId = req.student.studentId;
    
    // Get material details and verify student access
    const materialQuery = `
      SELECT bm.*, sb.student_id
      FROM batch_materials bm
      JOIN student_batches sb ON bm.batch_id = sb.batch_id
      WHERE bm.id = ? AND sb.student_id = ? AND sb.status = 'Active'
    `;
    
    const materials = await db.queryPromise(materialQuery, [materialId, studentId]);
    
    if (materials.length === 0) {
      return res.status(404).json({ error: 'Material not found or access denied' });
    }
    
    const material = materials[0];
    
    if (!material.file_path) {
      return res.status(404).json({ error: 'File not available' });
    }
    
    // Construct file path - handle both absolute and relative paths
    let filePath;
    if (path.isAbsolute(material.file_path)) {
      filePath = material.file_path;
    } else {
      filePath = path.join(__dirname, '../..', material.file_path);
    }
    
    logger.info(`Attempting to download file: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    // Set appropriate headers for download
    const filename = material.file_name || `${material.title}.${material.file_path.split('.').pop()}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      logger.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
    
  } catch (error) {
    logger.error('Error downloading material for student:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

/**
 * Submit assignment with file upload
 * POST /api/student-batches/assignments/:assignmentId/submit
 */
router.post('/assignments/:assignmentId/submit', studentAuthMiddleware, upload.single('assignmentFile'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.student.studentId;
    const { submission_text } = req.body;
    const uploadedFile = req.file;
    
    // Verify assignment exists and is published
    const assignmentQuery = `
      SELECT a.*, b.id as batch_id
      FROM assignments a
      JOIN batches b ON a.batch_id = b.id
      WHERE a.id = ? AND a.status = 'published'
    `;
    
    const assignments = await db.queryPromise(assignmentQuery, [assignmentId]);
    
    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or not available for submission' });
    }
    
    const assignment = assignments[0];
    
    // Verify student is enrolled in this batch
    const enrollmentCheck = await db.queryPromise(
      'SELECT id FROM student_batches WHERE student_id = ? AND batch_id = ? AND status = "Active"',
      [studentId, assignment.batch_id]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this batch' });
    }
    
    // Check if assignment is still open (not past due date)
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    
    if (now > dueDate) {
      return res.status(400).json({ error: 'Assignment submission deadline has passed' });
    }
    
    // Check if student has already submitted this assignment
    const existingSubmission = await db.queryPromise(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );
    
    if (existingSubmission.length > 0) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }
    
    // Require either file or text submission
    if (!uploadedFile && !submission_text?.trim()) {
      return res.status(400).json({ error: 'Please provide either a file or text submission' });
    }
    
    // Insert submission
    const submissionQuery = `
      INSERT INTO assignment_submissions (
        assignment_id, 
        student_id, 
        submission_text, 
        file_path,
        file_name,
        submitted_at, 
        status
      ) VALUES (?, ?, ?, ?, ?, NOW(), 'Submitted')
    `;
    
    const result = await db.queryPromise(submissionQuery, [
      assignmentId,
      studentId,
      submission_text || '',
      uploadedFile ? uploadedFile.path : null,
      uploadedFile ? uploadedFile.originalname : null
    ]);
    
    logger.info(`Assignment ${assignmentId} submitted by student ${studentId}${uploadedFile ? ' with file: ' + uploadedFile.originalname : ''}`);
    
    res.json({ 
      message: 'Assignment submitted successfully',
      submissionId: result.insertId,
      submittedAt: new Date().toISOString(),
      hasFile: !!uploadedFile,
      fileName: uploadedFile?.originalname
    });
    
  } catch (error) {
    logger.error('Error submitting assignment:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 50MB allowed.' });
    }
    
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

/**
 * Edit/Update assignment submission (before deadline)
 * PUT /api/student-batches/assignments/:assignmentId/submit/:submissionId
 */
router.put('/assignments/:assignmentId/submit/:submissionId', studentAuthMiddleware, upload.single('assignmentFile'), async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const studentId = req.student.studentId;
    const { submission_text } = req.body;
    const uploadedFile = req.file;
    
    // Verify assignment exists and is published
    const assignmentQuery = `
      SELECT a.*, b.id as batch_id
      FROM assignments a
      JOIN batches b ON a.batch_id = b.id
      WHERE a.id = ? AND a.status = 'published'
    `;
    
    const assignments = await db.queryPromise(assignmentQuery, [assignmentId]);
    
    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or not available for submission' });
    }
    
    const assignment = assignments[0];
    
    // Check if assignment is still open (not past due date)
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    
    if (now > dueDate) {
      return res.status(400).json({ error: 'Assignment submission deadline has passed. Cannot edit submission.' });
    }
    
    // Verify the submission belongs to this student
    const submissionQuery = `
      SELECT * FROM assignment_submissions 
      WHERE id = ? AND assignment_id = ? AND student_id = ?
    `;
    
    const submissions = await db.queryPromise(submissionQuery, [submissionId, assignmentId, studentId]);
    
    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }
    
    const oldSubmission = submissions[0];
    
    // Require either file or text submission
    if (!uploadedFile && !submission_text?.trim()) {
      return res.status(400).json({ error: 'Please provide either a file or text submission' });
    }
    
    // Delete old file if new file is uploaded
    let oldFilePath = null;
    if (uploadedFile && oldSubmission.file_path) {
      oldFilePath = oldSubmission.file_path;
    }
    
    // Update submission
    const updateQuery = `
      UPDATE assignment_submissions 
      SET submission_text = ?, 
          file_path = ?, 
          file_name = ?,
          submitted_at = NOW(),
          status = 'Submitted'
      WHERE id = ?
    `;
    
    await db.queryPromise(updateQuery, [
      submission_text || oldSubmission.submission_text || '',
      uploadedFile ? uploadedFile.path : oldSubmission.file_path,
      uploadedFile ? uploadedFile.originalname : oldSubmission.file_name,
      submissionId
    ]);
    
    // Clean up old file if it exists and new file was uploaded
    if (oldFilePath && uploadedFile && fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
        logger.info(`Deleted old submission file: ${oldFilePath}`);
      } catch (error) {
        logger.warn(`Failed to delete old submission file: ${oldFilePath}`, error);
      }
    }
    
    logger.info(`Assignment ${assignmentId} submission ${submissionId} updated by student ${studentId}${uploadedFile ? ' with new file: ' + uploadedFile.originalname : ''}`);
    
    res.json({ 
      message: 'Assignment submission updated successfully',
      submissionId: submissionId,
      updatedAt: new Date().toISOString(),
      hasFile: !!(uploadedFile || oldSubmission.file_path),
      fileName: uploadedFile?.originalname || oldSubmission.file_name
    });
    
  } catch (error) {
    logger.error('Error updating assignment submission:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 50MB allowed.' });
    }
    
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

/**
 * Download student's own assignment submission file
 * GET /api/student-batches/submissions/:submissionId/download
 */
router.get('/submissions/:submissionId/download', studentAuthMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const studentId = req.student.studentId;
    
    // Get submission and verify ownership
    const submission = await db.queryPromise(`
      SELECT 
        asub.*,
        a.title as assignment_title
      FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      WHERE asub.id = ? AND asub.student_id = ?
    `, [submissionId, studentId]);
    
    if (submission.length === 0) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }
    
    const submissionFile = submission[0];
    
    if (!submissionFile.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }
    
    // Check if file exists on server
    if (!fs.existsSync(submissionFile.file_path)) {
      logger.error(`Student batch submission file not found at path: ${submissionFile.file_path}`);
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    // Prepare download filename (use original name or assignment title)
    const downloadFileName = submissionFile.file_name || `${submissionFile.assignment_title}_submission`;
    
    // Get file stats and determine content type
    const fileStats = fs.statSync(submissionFile.file_path);
    const fileExtension = path.extname(submissionFile.file_name || '').toLowerCase();
    
    // Set proper Content-Type based on file extension
    let contentType = 'application/octet-stream'; // default
    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.zip':
        contentType = 'application/zip';
        break;
      case '.rar':
        contentType = 'application/x-rar-compressed';
        break;
    }
    
    // Set comprehensive headers for proper file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    res.setHeader('Content-Length', fileStats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Create read stream with proper options
    const fileStream = fs.createReadStream(submissionFile.file_path, {
      highWaterMark: 16 * 1024 // 16KB chunks
    });
    
    fileStream.on('error', (err) => {
      logger.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    
    fileStream.on('end', () => {
      logger.info(`Student ${studentId} successfully downloaded batch submission ${submissionId}`);
    });
    
    // Pipe the file to response
    fileStream.pipe(res);
    
  } catch (error) {
    logger.error('Error downloading student batch submission:', error);
    res.status(500).json({ error: 'Failed to download submission' });
  }
});

/**
 * Get all announcements for student's enrolled batches (for navbar notifications)
 * GET /api/student-batches/announcements/all
 */
router.get('/announcements/all', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    // Get announcements from all batches the student is enrolled in with read status
    const announcementsQuery = `
      SELECT a.*,b.batch_code, c.courseName, l.full_name as lecturer_name,
             CASE WHEN sar.id IS NOT NULL THEN 1 ELSE 0 END as is_read,
             sar.read_at,
             CASE 
               WHEN a.priority = 'urgent' THEN 1
               WHEN a.priority = 'high' THEN 2
               WHEN a.priority = 'medium' THEN 3
               WHEN a.priority = 'normal' THEN 4
               ELSE 5
             END as priority_order
      FROM announcements a
      JOIN batches b ON a.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      JOIN lecturers l ON a.lecturer_id = l.id
      JOIN student_batches sb ON b.id = sb.batch_id
      LEFT JOIN student_announcement_reads sar ON (sar.student_id = ? AND sar.announcement_id = a.id)
      WHERE sb.student_id = ? AND sb.status = 'Active' AND a.is_published = 1
      ORDER BY is_read ASC, priority_order ASC, a.created_at DESC
      LIMIT 20
    `;
    
    const announcements = await db.queryPromise(announcementsQuery, [studentId, studentId]);
    
    // Get unread count
    const unreadCountQuery = `
      SELECT COUNT(*) as unread_count
      FROM announcements a
      JOIN batches b ON a.batch_id = b.id
      JOIN student_batches sb ON b.id = sb.batch_id
      LEFT JOIN student_announcement_reads sar ON (sar.student_id = ? AND sar.announcement_id = a.id)
      WHERE sb.student_id = ? AND sb.status = 'Active' AND a.is_published = 1 AND sar.id IS NULL
    `;
    
    const unreadResult = await db.queryPromise(unreadCountQuery, [studentId, studentId]);
    const unreadCount = unreadResult[0]?.unread_count || 0;
    
    res.json({ 
      announcements,
      unreadCount
    });
    
  } catch (error) {
    logger.error('Error fetching all announcements for student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Mark announcement as read for the current student
 * POST /api/student-batches/announcements/:announcementId/read
 */
router.post('/announcements/:announcementId/read', studentAuthMiddleware, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const studentId = req.student.studentId;
    
    // Verify student has access to this announcement (is in the batch)
    const accessCheck = await db.queryPromise(`
      SELECT a.id
      FROM announcements a
      JOIN batches b ON a.batch_id = b.id
      JOIN student_batches sb ON b.id = sb.batch_id
      WHERE a.id = ? AND sb.student_id = ? AND sb.status = 'Active' AND a.is_published = 1
    `, [announcementId, studentId]);
    
    if (accessCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied to this announcement' });
    }
    
    // Mark as read (use INSERT IGNORE or ON DUPLICATE KEY UPDATE to handle duplicate reads)
    await db.queryPromise(`
      INSERT INTO student_announcement_reads (student_id, announcement_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP
    `, [studentId, announcementId]);
    
    logger.info(`Student ${studentId} marked announcement ${announcementId} as read`);
    
    // Get updated unread count
    const unreadCountQuery = `
      SELECT COUNT(*) as unread_count
      FROM announcements a
      JOIN batches b ON a.batch_id = b.id
      JOIN student_batches sb ON b.id = sb.batch_id
      LEFT JOIN student_announcement_reads sar ON (sar.student_id = ? AND sar.announcement_id = a.id)
      WHERE sb.student_id = ? AND sb.status = 'Active' AND a.is_published = 1 AND sar.id IS NULL
    `;
    
    const unreadResult = await db.queryPromise(unreadCountQuery, [studentId, studentId]);
    const unreadCount = unreadResult[0]?.unread_count || 0;
    
    res.json({ 
      success: true, 
      message: 'Announcement marked as read',
      unreadCount
    });
    
  } catch (error) {
    logger.error('Error marking announcement as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Mark all announcements as read for the current student
 * POST /api/student-batches/announcements/read-all
 */
router.post('/announcements/read-all', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    // Get all unread announcements for this student
    const unreadAnnouncementsQuery = `
      SELECT a.id
      FROM announcements a
      JOIN batches b ON a.batch_id = b.id
      JOIN student_batches sb ON b.id = sb.batch_id
      LEFT JOIN student_announcement_reads sar ON (sar.student_id = ? AND sar.announcement_id = a.id)
      WHERE sb.student_id = ? AND sb.status = 'Active' AND a.is_published = 1 AND sar.id IS NULL
    `;
    
    const unreadAnnouncements = await db.queryPromise(unreadAnnouncementsQuery, [studentId, studentId]);
    
    if (unreadAnnouncements.length > 0) {
      // Mark all unread announcements as read
      const insertValues = unreadAnnouncements.map(ann => `(${studentId}, ${ann.id})`).join(', ');
      await db.queryPromise(`
        INSERT INTO student_announcement_reads (student_id, announcement_id)
        VALUES ${insertValues}
        ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP
      `);
      
      logger.info(`Student ${studentId} marked ${unreadAnnouncements.length} announcements as read`);
    }
    
    res.json({ 
      success: true, 
      message: 'All announcements marked as read',
      markedCount: unreadAnnouncements.length,
      unreadCount: 0
    });
    
  } catch (error) {
    logger.error('Error marking all announcements as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get unread announcement count for the current student
 * GET /api/student-batches/announcements/unread-count
 */
router.get('/announcements/unread-count', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    const unreadCountQuery = `
      SELECT COUNT(*) as unread_count
      FROM announcements a
      JOIN batches b ON a.batch_id = b.id
      JOIN student_batches sb ON b.id = sb.batch_id
      LEFT JOIN student_announcement_reads sar ON (sar.student_id = ? AND sar.announcement_id = a.id)
      WHERE sb.student_id = ? AND sb.status = 'Active' AND a.is_published = 1 AND sar.id IS NULL
    `;
    
    const result = await db.queryPromise(unreadCountQuery, [studentId, studentId]);
    const unreadCount = result[0]?.unread_count || 0;
    
    res.json({ unreadCount });
    
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 