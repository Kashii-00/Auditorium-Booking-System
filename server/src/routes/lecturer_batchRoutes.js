const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Lecturer authentication middleware
const lecturerAuthMiddleware = (req, res, next) => {
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
    
    if (!decoded.lecturerId) {
      return res.status(403).json({ error: 'Not authorized as lecturer' });
    }
    req.lecturer = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', tokenExpired: true });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/batch_materials');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ========== BATCH MANAGEMENT ==========

// Get all batches for a lecturer
router.get('/batches/:lecturerId', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { status } = req.query;
    
    // Verify lecturer has access to their own data
    if (parseInt(lecturerId) !== req.lecturer.lecturerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    let query = `
      SELECT 
        b.id,b.batch_code,b.start_date, b.end_date, b.location, b.capacity,
        b.materials_count, b.assignments_count, b.announcements_count,
        b.completion_percentage, b.description,
        c.id as course_id, c.courseName, c.courseId, c.stream,
        lb.module, lb.hours_assigned, lb.payment_rate, lb.status as assignment_status,
        (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id AND sb.status = 'Active') as current_students,
        CASE
          WHEN b.start_date > CURDATE() THEN 'upcoming'
          WHEN b.end_date < CURDATE() THEN 'completed'
          ELSE 'current'
        END as status,
        CASE
          WHEN b.start_date > CURDATE() THEN 0
          WHEN b.end_date < CURDATE() THEN 100
          ELSE ROUND(
            (DATEDIFF(CURDATE(), b.start_date) / DATEDIFF(b.end_date, b.start_date)) * 100, 0
          )
        END as completion_percentage
      FROM lecturer_batches lb
      JOIN batches b ON lb.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE lb.lecturer_id = ?
    `;
    
    const params = [lecturerId];
    
    if (status) {
      query += ` AND lb.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY b.start_date DESC`;
    
    const batches = await db.queryPromise(query, params);
    
    // Process batches to ensure completion_percentage is bounded
    const processedBatches = batches.map(batch => ({
      ...batch,
      completion_percentage: Math.max(0, Math.min(100, batch.completion_percentage || 0))
    }));
    
    res.json({ batches: processedBatches });
  } catch (error) {
    logger.error('Error fetching lecturer batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get single batch details
router.get('/batch/:batchId', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Check if lecturer has access to this batch
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    // Get batch details with course info and dynamic status/progress calculation
    const batchQuery = `
      SELECT 
        b.*, c.courseName, c.courseId, c.stream,
        (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id) as enrolled_students,
        CASE
          WHEN b.start_date > CURDATE() THEN 'Upcoming'
          WHEN b.end_date < CURDATE() THEN 'Completed'
          ELSE 'Current'
        END as dynamic_status,
        CASE
          WHEN b.start_date > CURDATE() THEN 0
          WHEN b.end_date < CURDATE() THEN 100
          ELSE ROUND(
            (DATEDIFF(CURDATE(), b.start_date) / DATEDIFF(b.end_date, b.start_date)) * 100, 0
          )
        END as dynamic_progress
      FROM batches b
      JOIN courses c ON b.course_id = c.id
      WHERE b.id = ?
    `;
    
    const [batch] = await db.queryPromise(batchQuery, [batchId]);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    // Override status and completion with dynamic values
    batch.status = batch.dynamic_status;
    batch.completion_percentage = Math.max(0, Math.min(100, batch.dynamic_progress || 0));
    
    // Get enrolled students
    const studentsQuery = `
      SELECT 
        s.id, s.full_name as student_name, s.email as student_email, s.emergency_contact_number as phone,
        sb.enrollment_date, sb.status, sb.attendance_percentage
      FROM student_batches sb
      JOIN students s ON sb.student_id = s.id
      WHERE sb.batch_id = ?
      ORDER BY s.full_name
    `;
    
    const students = await db.queryPromise(studentsQuery, [batchId]);
    
    // Calculate stats for ALL lecturers in the batch (collaborative approach)
    const batchStats = await db.queryPromise(`
      SELECT 
        (SELECT COUNT(*) FROM batch_materials bm 
         JOIN lecturer_batches lb ON bm.batch_id = lb.batch_id AND bm.lecturer_id = lb.lecturer_id
         WHERE bm.batch_id = ? AND bm.is_active = 1) as materials_count,
        (SELECT COUNT(*) FROM assignments a
         JOIN lecturer_batches lb ON a.batch_id = lb.batch_id AND a.lecturer_id = lb.lecturer_id
         WHERE a.batch_id = ?) as assignments_count,
        (SELECT COUNT(*) FROM announcements an
         JOIN lecturer_batches lb ON an.batch_id = lb.batch_id AND an.lecturer_id = lb.lecturer_id
         WHERE an.batch_id = ?) as announcements_count
    `, [batchId, batchId, batchId]);

    // Add students to batch object
    batch.enrolled_students = students;
    batch.stats = {
      students_count: batch.students_count || 0,
      materials_count: batchStats[0].materials_count || 0,
      assignments_count: batchStats[0].assignments_count || 0,
      announcements_count: batchStats[0].announcements_count || 0
    };
    
    res.json({ batch });
  } catch (error) {
    logger.error('Error fetching batch details:', error);
    res.status(500).json({ error: 'Failed to fetch batch details' });
  }
});

// ========== MATERIALS MANAGEMENT ==========

// Get batch materials
router.get('/batch/:batchId/materials', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Check access
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    // Show ALL materials uploaded by ANY lecturer in this batch (collaborative approach)
    const materials = await db.queryPromise(`
      SELECT 
        bm.*, l.full_name as lecturer_name
      FROM batch_materials bm
      JOIN lecturers l ON bm.lecturer_id = l.id
      JOIN lecturer_batches lb ON bm.batch_id = lb.batch_id AND bm.lecturer_id = lb.lecturer_id
      WHERE bm.batch_id = ? AND bm.is_active = 1
      ORDER BY bm.upload_date DESC
    `, [batchId]);
    
    res.json({ materials });
  } catch (error) {
    logger.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Upload material
router.post('/batch/:batchId/materials', lecturerAuthMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { batchId } = req.params;
    const { title, description, material_type = 'lecture' } = req.body;
    
    // Check access
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    let filePath = null;
    let fileName = null;
    let fileSize = null;
    let fileType = null;
    
    if (req.file) {
      filePath = req.file.path;
      // Store both the generated filename and original filename
      fileName = req.file.originalname; // Store original filename for better user experience
      fileSize = req.file.size;
      fileType = req.file.mimetype;
    }
    
    const result = await db.queryPromise(`
      INSERT INTO batch_materials (
        batch_id, lecturer_id, title, description, file_name, file_path, 
        file_size, file_type, material_type, upload_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)
    `, [batchId, req.lecturer.lecturerId, title, description, fileName, filePath, fileSize, fileType, material_type]);
    
    logger.info(`Material uploaded to batch ${batchId} by lecturer ${req.lecturer.lecturerId}`);
    
    res.json({ 
      success: true, 
      message: 'Material uploaded successfully',
      materialId: result.insertId
    });
  } catch (error) {
    logger.error('Error uploading material:', error);
    res.status(500).json({ error: 'Failed to upload material' });
  }
});

// Download material
router.get('/materials/:materialId/download', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { materialId } = req.params;
    
    // Check if lecturer has access to this material
    const material = await db.queryPromise(`
      SELECT bm.*, lb.lecturer_id
      FROM batch_materials bm
      JOIN lecturer_batches lb ON bm.batch_id = lb.batch_id
      WHERE bm.id = ? AND lb.lecturer_id = ?
    `, [materialId, req.lecturer.lecturerId]);
    
    if (material.length === 0) {
      return res.status(403).json({ error: 'Access denied to this material' });
    }
    
    const materialFile = material[0];
    
    if (!materialFile.file_path || !fs.existsSync(materialFile.file_path)) {
      logger.error(`File not found at path: ${materialFile.file_path}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Extract original filename or use title
    let downloadFileName = materialFile.title || 'download';
    if (materialFile.file_name) {
      // If file_name contains the original name after the timestamp, extract it
      const parts = materialFile.file_name.split('-');
      if (parts.length > 2) {
        downloadFileName = parts.slice(2).join('-');
      } else {
        downloadFileName = materialFile.file_name;
      }
    }
    
    // Ensure proper file extension
    if (!downloadFileName.endsWith('.pdf') && materialFile.file_type === 'application/pdf') {
      downloadFileName += '.pdf';
    }
    
    // Get actual file size
    const fileStats = fs.statSync(materialFile.file_path);
    const fileSize = fileStats.size;
    
    // Set comprehensive headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Create read stream with proper options
    const fileStream = fs.createReadStream(materialFile.file_path, {
      highWaterMark: 16 * 1024 // 16KB chunks
    });
    
    fileStream.on('error', (err) => {
      logger.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    
    fileStream.on('end', () => {
      logger.info(`Successfully downloaded material ${materialId}`);
    });
    
    // Pipe the file to response
    fileStream.pipe(res);
    
  } catch (error) {
    logger.error('Error downloading material:', error);
    res.status(500).json({ error: 'Failed to download material' });
  }
});

// Delete material
router.delete('/materials/:materialId', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { materialId } = req.params;
    
    // Check if lecturer owns this material
    const material = await db.queryPromise(
      'SELECT * FROM batch_materials WHERE id = ? AND lecturer_id = ?',
      [materialId, req.lecturer.lecturerId]
    );
    
    if (material.length === 0) {
      return res.status(403).json({ error: 'Access denied to this material' });
    }
    
    // Delete file if exists
    if (material[0].file_path && fs.existsSync(material[0].file_path)) {
      fs.unlinkSync(material[0].file_path);
    }
    
    // Hard delete the material
    await db.queryPromise(
      'DELETE FROM batch_materials WHERE id = ?',
      [materialId]
    );
    
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    logger.error('Error deleting material:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

// ========== ASSIGNMENTS MANAGEMENT ==========

// Get batch assignments
router.get('/batch/:batchId/assignments', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Check access
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    // Show ALL assignments created by ANY lecturer in this batch (collaborative approach)
    const assignments = await db.queryPromise(`
      SELECT 
        a.*,
        l.full_name as lecturer_name,
        (SELECT COUNT(*) FROM assignment_submissions asub WHERE asub.assignment_id = a.id) as submission_count
      FROM assignments a
      LEFT JOIN lecturers l ON a.lecturer_id = l.id
      JOIN lecturer_batches lb ON a.batch_id = lb.batch_id AND a.lecturer_id = lb.lecturer_id
      WHERE a.batch_id = ?
      ORDER BY a.created_at DESC
    `, [batchId]);
    
    res.json({ assignments });
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create assignment
router.post('/batch/:batchId/assignments', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { title, description, dueDate, maxPoints = 100, assignment_type = 'individual' } = req.body;
    
    // Check access
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    const result = await db.queryPromise(`
      INSERT INTO assignments (
        batch_id, lecturer_id, title, description, due_date, max_marks, assignment_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
    `, [batchId, req.lecturer.lecturerId, title, description, dueDate, maxPoints, assignment_type]);
    
    logger.info(`Assignment created for batch ${batchId} by lecturer ${req.lecturer.lecturerId}`);
    
    res.json({ 
      success: true, 
      message: 'Assignment created successfully',
      assignmentId: result.insertId
    });
  } catch (error) {
    logger.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment
router.put('/assignments/:assignmentId', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate, maxPoints, assignment_type = 'individual' } = req.body;
    
    // Check if lecturer owns this assignment
    const assignment = await db.queryPromise(
      'SELECT * FROM assignments WHERE id = ? AND lecturer_id = ?',
      [assignmentId, req.lecturer.lecturerId]
    );
    
    if (assignment.length === 0) {
      return res.status(403).json({ error: 'Access denied to this assignment' });
    }
    
    await db.queryPromise(`
      UPDATE assignments 
      SET title = ?, description = ?, due_date = ?, max_marks = ?, assignment_type = ?, updated_at = NOW()
      WHERE id = ?
    `, [title, description, dueDate, maxPoints, assignment_type, assignmentId]);
    
    logger.info(`Assignment ${assignmentId} updated by lecturer ${req.lecturer.lecturerId}`);
    
    res.json({ 
      success: true, 
      message: 'Assignment updated successfully'
    });
  } catch (error) {
    logger.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Get assignment submissions
router.get('/assignments/:assignmentId/submissions', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Check if lecturer owns this assignment
    const assignment = await db.queryPromise(
      'SELECT * FROM assignments WHERE id = ? AND lecturer_id = ?',
      [assignmentId, req.lecturer.lecturerId]
    );
    
    if (assignment.length === 0) {
      return res.status(403).json({ error: 'Access denied to this assignment' });
    }
    
    const submissions = await db.queryPromise(`
      SELECT 
        asub.*, s.full_name as student_name, s.email as student_email
      FROM assignment_submissions asub
      JOIN students s ON asub.student_id = s.id
      WHERE asub.assignment_id = ?
      ORDER BY asub.submitted_at DESC
    `, [assignmentId]);
    
    res.json({ submissions });
  } catch (error) {
    logger.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Grade assignment
router.post('/assignments/:assignmentId/grade', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { studentId, marks, feedback, grade } = req.body;
    
    // Check if lecturer owns this assignment
    const assignment = await db.queryPromise(
      'SELECT * FROM assignments WHERE id = ? AND lecturer_id = ?',
      [assignmentId, req.lecturer.lecturerId]
    );
    
    if (assignment.length === 0) {
      return res.status(403).json({ error: 'Access denied to this assignment' });
    }
    
    // Insert or update grade
    await db.queryPromise(`
      INSERT INTO assignment_grades (
        assignment_id, student_id, lecturer_id, marks_obtained, max_marks, grade, feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        marks_obtained = VALUES(marks_obtained),
        grade = VALUES(grade),
        feedback = VALUES(feedback),
        updated_at = NOW()
    `, [assignmentId, studentId, req.lecturer.lecturerId, marks, assignment[0].max_marks, grade, feedback]);
    
    // Update submission if exists
    await db.queryPromise(`
      UPDATE assignment_submissions 
      SET marks_obtained = ?, feedback = ?, graded_by = ?, graded_at = NOW(), status = 'Graded'
      WHERE assignment_id = ? AND student_id = ?
    `, [marks, feedback, req.lecturer.lecturerUserId, assignmentId, studentId]);
    
    res.json({ success: true, message: 'Assignment graded successfully' });
  } catch (error) {
    logger.error('Error grading assignment:', error);
    res.status(500).json({ error: 'Failed to grade assignment' });
  }
});

// ========== ANNOUNCEMENTS MANAGEMENT ==========

// Get batch announcements
router.get('/batch/:batchId/announcements', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Check access
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    // Show ALL announcements created by ANY lecturer in this batch (collaborative approach)
    const announcements = await db.queryPromise(`
      SELECT 
        an.*, l.full_name as lecturer_name
      FROM announcements an
      JOIN lecturers l ON an.lecturer_id = l.id
      JOIN lecturer_batches lb ON an.batch_id = lb.batch_id AND an.lecturer_id = lb.lecturer_id
      WHERE an.batch_id = ?
      ORDER BY an.created_at DESC
    `, [batchId]);
    
    res.json({ announcements });
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create announcement
router.post('/batch/:batchId/announcements', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { title, content, priority = 'normal' } = req.body;
    
    // Check access
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    const result = await db.queryPromise(`
      INSERT INTO announcements (
        batch_id, lecturer_id, title, content, priority, is_published, publish_date
      ) VALUES (?, ?, ?, ?, ?, 1, NOW())
    `, [batchId, req.lecturer.lecturerId, title, content, priority]);
    
    logger.info(`Announcement created for batch ${batchId} by lecturer ${req.lecturer.lecturerId}`);
    
    res.json({ 
      success: true, 
      message: 'Announcement created successfully',
      announcementId: result.insertId
    });
  } catch (error) {
    logger.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement
router.put('/announcements/:announcementId', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { title, content, priority } = req.body;
    
    // Check if lecturer owns this announcement
    const announcement = await db.queryPromise(
      'SELECT * FROM announcements WHERE id = ? AND lecturer_id = ?',
      [announcementId, req.lecturer.lecturerId]
    );
    
    if (announcement.length === 0) {
      return res.status(403).json({ error: 'Access denied to this announcement' });
    }
    
    await db.queryPromise(`
      UPDATE announcements 
      SET title = ?, content = ?, priority = ?, updated_at = NOW()
      WHERE id = ?
    `, [title, content, priority, announcementId]);
    
    res.json({ success: true, message: 'Announcement updated successfully' });
  } catch (error) {
    logger.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement
router.delete('/announcements/:announcementId', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    // Check if lecturer owns this announcement
    const announcement = await db.queryPromise(
      'SELECT * FROM announcements WHERE id = ? AND lecturer_id = ?',
      [announcementId, req.lecturer.lecturerId]
    );
    
    if (announcement.length === 0) {
      return res.status(403).json({ error: 'Access denied to this announcement' });
    }
    
    await db.queryPromise('DELETE FROM announcements WHERE id = ?', [announcementId]);
    
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    logger.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// ========== QUIZZES MANAGEMENT ==========

// Get batch quizzes
router.get('/batch/:batchId/quizzes', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Check access
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    const quizzes = await db.queryPromise(`
      SELECT * FROM quizzes
      WHERE batch_id = ?
      ORDER BY created_at DESC
    `, [batchId]);
    
    res.json({ quizzes });
  } catch (error) {
    logger.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Create quiz
router.post('/batch/:batchId/quizzes', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { title, description, instructions, start_time, end_time, duration_minutes, max_marks = 100 } = req.body;
    
    // Check access
    const accessCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?',
      [batchId, req.lecturer.lecturerId]
    );
    
    if (accessCheck[0].count === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    const result = await db.queryPromise(`
      INSERT INTO quizzes (
        batch_id, lecturer_id, title, description, instructions, 
        start_time, end_time, duration_minutes, max_marks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [batchId, req.lecturer.lecturerId, title, description, instructions, start_time, end_time, duration_minutes, max_marks]);
    
    logger.info(`Quiz created for batch ${batchId} by lecturer ${req.lecturer.lecturerId}`);
    
    res.json({ 
      success: true, 
      message: 'Quiz created successfully',
      quizId: result.insertId
    });
  } catch (error) {
    logger.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// ========== SUBMISSION MANAGEMENT ==========

// Get submissions for an assignment
router.get('/assignments/:assignmentId/submissions', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Verify lecturer has access to this assignment
    const assignmentCheck = await db.queryPromise(`
      SELECT a.*, b.id as batch_id
      FROM assignments a
      JOIN batches b ON a.batch_id = b.id
      JOIN lecturer_batches lb ON b.id = lb.batch_id
      WHERE a.id = ? AND lb.lecturer_id = ?
    `, [assignmentId, req.lecturer.lecturerId]);
    
    if (assignmentCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied to this assignment' });
    }
    
    const assignment = assignmentCheck[0];
    
    // Get all submissions with student details
    const submissions = await db.queryPromise(`
      SELECT 
        asub.*,
        s.full_name as student_name,
        s.email as student_email,
        s.id as student_id,
        a.title as assignment_title,
        a.max_marks,
        a.due_date,
        CASE 
          WHEN asub.submitted_at <= a.due_date THEN 'On Time'
          ELSE 'Late'
        END as submission_timing
      FROM assignment_submissions asub
      JOIN students s ON asub.student_id = s.id
      JOIN assignments a ON asub.assignment_id = a.id
      WHERE asub.assignment_id = ?
      ORDER BY asub.submitted_at DESC
    `, [assignmentId]);
    
    res.json({ 
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        max_marks: assignment.max_marks,
        assignment_type: assignment.assignment_type
      },
      submissions 
    });
  } catch (error) {
    logger.error('Error fetching assignment submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Download submission file
router.get('/submissions/:submissionId/download', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Verify lecturer has access to this submission
    const submission = await db.queryPromise(`
      SELECT 
        asub.*,
        s.full_name as student_name,
        a.title as assignment_title
      FROM assignment_submissions asub
      JOIN students s ON asub.student_id = s.id
      JOIN assignments a ON asub.assignment_id = a.id
      JOIN batches b ON a.batch_id = b.id
      JOIN lecturer_batches lb ON b.id = lb.batch_id
      WHERE asub.id = ? AND lb.lecturer_id = ?
    `, [submissionId, req.lecturer.lecturerId]);
    
    if (submission.length === 0) {
      return res.status(403).json({ error: 'Access denied to this submission' });
    }
    
    const submissionFile = submission[0];
    
    if (!submissionFile.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }
    
    if (!fs.existsSync(submissionFile.file_path)) {
      logger.error(`Submission file not found at path: ${submissionFile.file_path}`);
      return res.status(404).json({ error: 'Submission file not found on server' });
    }
    
    // Prepare download filename
    const studentName = submissionFile.student_name.replace(/[^a-zA-Z0-9]/g, '_');
    const assignmentTitle = submissionFile.assignment_title.replace(/[^a-zA-Z0-9]/g, '_');
    const originalName = submissionFile.file_name || 'submission';
    const downloadFileName = `${studentName}_${assignmentTitle}_${originalName}`;
    
    // Get file stats
    const fileStats = fs.statSync(submissionFile.file_path);
    
    // Determine content type from the actual file path, not just the stored filename
    const actualFileExtension = path.extname(submissionFile.file_path).toLowerCase();
    const storedFileExtension = path.extname(submissionFile.file_name || '').toLowerCase();
    const fileExtension = actualFileExtension || storedFileExtension;
    
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
    
    // Log for debugging
    logger.info(`Downloading file: ${submissionFile.file_path}, Extension: ${fileExtension}, Content-Type: ${contentType}`);
    
    // Set comprehensive headers for proper file download
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
      'Content-Length': fileStats.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff'
    });
    
    // Create read stream with proper options
    const fileStream = fs.createReadStream(submissionFile.file_path, {
      highWaterMark: 64 * 1024 // 64KB chunks for better performance
    });
    
    fileStream.on('error', (err) => {
      logger.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    
    fileStream.on('end', () => {
      logger.info(`Successfully downloaded submission ${submissionId}`);
    });
    
    // Pipe the file to response
    fileStream.pipe(res);
    
    logger.info(`Lecturer ${req.lecturer.lecturerId} downloaded submission ${submissionId}`);
    
  } catch (error) {
    logger.error('Error downloading submission:', error);
    res.status(500).json({ error: 'Failed to download submission' });
  }
});

// Grade submission and provide feedback
router.put('/submissions/:submissionId/grade', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks_obtained, feedback, status = 'Graded' } = req.body;
    
    // Verify lecturer has access to this submission
    const submissionCheck = await db.queryPromise(`
      SELECT asub.*, a.max_marks
      FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      JOIN batches b ON a.batch_id = b.id
      JOIN lecturer_batches lb ON b.id = lb.batch_id
      WHERE asub.id = ? AND lb.lecturer_id = ?
    `, [submissionId, req.lecturer.lecturerId]);
    
    if (submissionCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied to this submission' });
    }
    
    const submission = submissionCheck[0];
    
    // Validate marks if provided
    if (marks_obtained !== undefined && marks_obtained !== null) {
      // Convert to number and validate
      const marksNum = parseFloat(marks_obtained);
      if (isNaN(marksNum) || marksNum < 0 || marksNum > submission.max_marks) {
        return res.status(400).json({ 
          error: `Marks must be a valid number between 0 and ${submission.max_marks}` 
        });
      }
    }
    
    // Update submission with grades and feedback - using lecturerUserId for foreign key
    await db.queryPromise(`
      UPDATE assignment_submissions 
      SET marks_obtained = ?, 
          feedback = ?, 
          status = ?,
          graded_by = ?,
          graded_at = NOW()
      WHERE id = ?
    `, [marks_obtained, feedback, status, req.lecturer.lecturerUserId, submissionId]);
    
    logger.info(`Submission ${submissionId} graded by lecturer user ${req.lecturer.lecturerUserId}`);
    
    res.json({ 
      success: true, 
      message: 'Submission graded successfully',
      marks_obtained,
      feedback,
      status
    });
  } catch (error) {
    logger.error('Error grading submission:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// Get submission statistics for an assignment
router.get('/assignments/:assignmentId/stats', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Verify lecturer has access to this assignment
    const assignmentCheck = await db.queryPromise(`
      SELECT a.*
      FROM assignments a
      JOIN batches b ON a.batch_id = b.id
      JOIN lecturer_batches lb ON b.id = lb.batch_id
      WHERE a.id = ? AND lb.lecturer_id = ?
    `, [assignmentId, req.lecturer.lecturerId]);
    
    if (assignmentCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied to this assignment' });
    }
    
    const assignment = assignmentCheck[0];
    
    // Get submission statistics
    const stats = await db.queryPromise(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN asub.submitted_at <= a.due_date THEN 1 END) as on_time_submissions,
        COUNT(CASE WHEN asub.submitted_at > a.due_date THEN 1 END) as late_submissions,
        COUNT(CASE WHEN asub.marks_obtained IS NOT NULL THEN 1 END) as graded_submissions,
        AVG(asub.marks_obtained) as average_marks,
        MAX(asub.marks_obtained) as highest_marks,
        MIN(asub.marks_obtained) as lowest_marks,
        (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = a.batch_id AND sb.status = 'Active') as total_students
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
      WHERE a.id = ?
      GROUP BY a.id
    `, [assignmentId]);
    
    const result = stats[0] || {
      total_submissions: 0,
      on_time_submissions: 0,
      late_submissions: 0,
      graded_submissions: 0,
      average_marks: null,
      highest_marks: null,
      lowest_marks: null,
      total_students: 0
    };
    
    // Calculate additional metrics
    result.submission_rate = result.total_students > 0 ? 
      ((result.total_submissions / result.total_students) * 100).toFixed(1) : '0.0';
    result.grading_progress = result.total_submissions > 0 ? 
      ((result.graded_submissions / result.total_submissions) * 100).toFixed(1) : '0.0';
    
    res.json({ 
      assignment: {
        id: assignment.id,
        title: assignment.title,
        due_date: assignment.due_date,
        max_marks: assignment.max_marks
      },
      stats: result 
    });
  } catch (error) {
    logger.error('Error fetching assignment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch assignment statistics' });
  }
});

module.exports = router;
