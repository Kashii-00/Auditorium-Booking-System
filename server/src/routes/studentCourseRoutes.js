const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../logger');
const { studentAuthMiddleware } = require('./studentAuthRoutes');

// Configure multer for assignment submissions
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/submissions');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|zip|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * Get student's enrolled courses with progress
 */
router.get('/my-courses', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    const query = `
      SELECT DISTINCT c.*, sc.enrollment_date, sc.status as enrollment_status,
              b.start_date, b.end_date,
             (SELECT COUNT(DISTINCT cm.id) FROM course_modules cm WHERE cm.course_id = c.id AND cm.is_published = true) as total_modules,
             (SELECT COUNT(DISTINCT mp.module_id) 
              FROM module_progress mp 
              JOIN course_modules cm ON mp.module_id = cm.id 
              WHERE cm.course_id = c.id AND mp.student_id = ? AND mp.completion_percentage = 100) as completed_modules
      FROM courses c
      JOIN student_courses sc ON c.id = sc.course_id
      JOIN student_batches sb ON sb.student_id = sc.student_id
      JOIN batches b ON b.id = sb.batch_id AND b.course_id = c.id
      WHERE sc.student_id = ? AND sc.status = 'Active' AND sb.status = 'Active'
    `;
    
    const courses = await db.queryPromise(query, [studentId, studentId]);
    
    // Calculate progress percentage
    courses.forEach(course => {
      course.progress_percentage = course.total_modules > 0 
        ? Math.round((course.completed_modules / course.total_modules) * 100)
        : 0;
    });
    
    res.json(courses);
  } catch (error) {
    logger.error('Error fetching student courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * Get modules for a course (student view)
 */
router.get('/courses/:courseId/modules', studentAuthMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student.studentId;
    
    // Verify student is enrolled in this course
    const enrollment = await db.queryPromise(
      'SELECT * FROM student_courses WHERE student_id = ? AND course_id = ? AND status = "Active"',
      [studentId, courseId]
    );
    
    if (enrollment.length === 0) {
      return res.status(403).json({ error: 'Access denied to this course' });
    }
    
    const query = `
      SELECT m.*, 
             mp.completion_percentage,
             mp.last_accessed,
             (SELECT COUNT(*) FROM course_materials WHERE module_id = m.id) as material_count,
             (SELECT COUNT(*) FROM course_assignments WHERE module_id = m.id AND is_published = true) as assignment_count,
             (SELECT COUNT(*) 
              FROM course_assignments ca 
              JOIN assignment_submissions as_sub ON ca.id = as_sub.assignment_id 
              WHERE ca.module_id = m.id AND as_sub.student_id = ?) as submitted_assignments
      FROM course_modules m
      LEFT JOIN module_progress mp ON m.id = mp.module_id AND mp.student_id = ?
      WHERE m.course_id = ? AND m.is_published = true
      ORDER BY m.order_index, m.created_at
    `;
    
    const modules = await db.queryPromise(query, [studentId, studentId, courseId]);
    res.json(modules);
  } catch (error) {
    logger.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

/**
 * Get materials for a module (student view)
 */
router.get('/modules/:moduleId/materials', studentAuthMiddleware, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.student.studentId;
    
    // Update module progress
    await db.queryPromise(
      `INSERT INTO module_progress (student_id, module_id, last_accessed) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE last_accessed = NOW()`,
      [studentId, moduleId]
    );
    
    const materials = await db.queryPromise(
      'SELECT id, title, description, type, file_name, file_size, created_at FROM course_materials WHERE module_id = ? ORDER BY created_at DESC',
      [moduleId]
    );
    
    res.json(materials);
  } catch (error) {
    logger.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * Download course material
 */
router.get('/materials/:materialId/download', studentAuthMiddleware, async (req, res) => {
  try {
    const { materialId } = req.params;
    
    const material = await db.queryPromise(
      'SELECT file_path, file_name FROM course_materials WHERE id = ?',
      [materialId]
    );
    
    if (material.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    const filePath = material[0].file_path;
    const fileName = material[0].file_name;
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, fileName);
  } catch (error) {
    logger.error('Error downloading material:', error);
    res.status(500).json({ error: 'Failed to download material' });
  }
});

/**
 * Get assignments for a module (student view)
 */
router.get('/modules/:moduleId/assignments', studentAuthMiddleware, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.student.studentId;
    
    const assignments = await db.queryPromise(
      `SELECT a.*, 
              s.id as submission_id,
              s.status as submission_status,
              s.submitted_at,
              s.grade,
              s.feedback
       FROM course_assignments a
       LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
       WHERE a.module_id = ? AND a.is_published = true
       ORDER BY a.due_date ASC`,
      [studentId, moduleId]
    );
    
    res.json(assignments);
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

/**
 * Get assignment details
 */
router.get('/assignments/:assignmentId', studentAuthMiddleware, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.student.studentId;
    
    const assignment = await db.queryPromise(
      `SELECT a.*, 
              s.id as submission_id,
              s.status as submission_status,
              s.submitted_at,
              s.grade,
              s.feedback,
              s.file_path as submission_file_path,
              s.file_name as submission_file_name,
              s.submission_text
       FROM course_assignments a
       LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
       WHERE a.id = ? AND a.is_published = true`,
      [studentId, assignmentId]
    );
    
    if (assignment.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json(assignment[0]);
  } catch (error) {
    logger.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

/**
 * Submit assignment
 */
router.post('/assignments/:assignmentId/submit', studentAuthMiddleware, upload.single('submission'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { submission_text } = req.body;
    const studentId = req.student.studentId;
    
    // Check if assignment exists and is published
    const assignment = await db.queryPromise(
      'SELECT * FROM course_assignments WHERE id = ? AND is_published = true',
      [assignmentId]
    );
    
    if (assignment.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Check if past due date
    const dueDate = new Date(assignment[0].due_date);
    const now = new Date();
    
    if (now > dueDate && !assignment[0].allow_late_submission) {
      return res.status(400).json({ error: 'Assignment submission deadline has passed' });
    }
    
    // Check for existing submission
    const existingSubmission = await db.queryPromise(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );
    
    const filePath = req.file ? req.file.path : null;
    const fileName = req.file ? req.file.originalname : null;
    const fileSize = req.file ? req.file.size : null;
    
    if (existingSubmission.length > 0) {
      // Update existing submission
      await db.queryPromise(
        `UPDATE assignment_submissions 
         SET submission_text = ?, file_path = ?, file_name = ?, file_size = ?, 
             submitted_at = NOW(), status = 'submitted'
         WHERE id = ?`,
        [submission_text, filePath, fileName, fileSize, existingSubmission[0].id]
      );
    } else {
      // Create new submission
      await db.queryPromise(
        `INSERT INTO assignment_submissions 
         (assignment_id, student_id, submission_text, file_path, file_name, file_size, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
        [assignmentId, studentId, submission_text, filePath, fileName, fileSize]
      );
    }
    
    res.json({ success: true, message: 'Assignment submitted successfully' });
  } catch (error) {
    logger.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

/**
 * Get course announcements
 */
router.get('/courses/:courseId/announcements', studentAuthMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student.studentId;
    
    // Get student's batch for this course
    const studentBatch = await db.queryPromise(
      `SELECT sb.batch_id 
       FROM student_batches sb
       JOIN batches b ON sb.batch_id = b.id
       WHERE sb.student_id = ? AND b.course_id = ? AND sb.status = 'Active'`,
      [studentId, courseId]
    );
    
    if (studentBatch.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const batchId = studentBatch[0].batch_id;
    
    const announcements = await db.queryPromise(
      `SELECT a.*, l.full_name as author_name
       FROM announcements a
       JOIN lecturers l ON a.created_by = l.id
       WHERE a.course_id = ? 
       AND (a.target_batches IS NULL OR JSON_CONTAINS(a.target_batches, ?))
       ORDER BY a.is_pinned DESC, a.created_at DESC`,
      [courseId, JSON.stringify(batchId)]
    );
    
    res.json(announcements);
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

/**
 * Get student's attendance for a course
 */
router.get('/courses/:courseId/attendance', studentAuthMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student.studentId;
    
    // Get student's batch for this course
    const studentBatch = await db.queryPromise(
      `SELECT sb.batch_id 
       FROM student_batches sb
       JOIN batches b ON sb.batch_id = b.id
       WHERE sb.student_id = ? AND b.course_id = ? AND sb.status = 'Active'`,
      [studentId, courseId]
    );
    
    if (studentBatch.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const attendance = await db.queryPromise(
      `SELECT date, status 
       FROM attendance 
       WHERE student_id = ? AND batch_id = ?
       ORDER BY date DESC`,
      [studentId, studentBatch[0].batch_id]
    );
    
    // Calculate attendance percentage
    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => a.status === 'present').length;
    const attendancePercentage = totalClasses > 0 
      ? Math.round((presentClasses / totalClasses) * 100)
      : 100;
    
    res.json({
      attendance,
      summary: {
        total_classes: totalClasses,
        present: presentClasses,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        percentage: attendancePercentage
      }
    });
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

/**
 * Update module progress
 */
router.post('/modules/:moduleId/progress', studentAuthMiddleware, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { completion_percentage } = req.body;
    const studentId = req.student.studentId;
    
    await db.queryPromise(
      `INSERT INTO module_progress (student_id, module_id, completion_percentage, last_accessed) 
       VALUES (?, ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE completion_percentage = ?, last_accessed = NOW()`,
      [studentId, moduleId, completion_percentage, completion_percentage]
    );
    
    res.json({ success: true, message: 'Progress updated' });
  } catch (error) {
    logger.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

/**
 * Get batch details for student
 */
router.get('/batches/:batchId', studentAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.student.studentId;
    
    // Check if student is enrolled in this batch
    const enrollment = await db.queryPromise(
      'SELECT * FROM student_batches WHERE student_id = ? AND batch_id = ? AND status = "Active"',
      [studentId, batchId]
    );
    
    if (enrollment.length === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    // Get batch details with course info
    const batch = await db.queryPromise(
      `SELECT b.*, c.name as courseName, c.id as courseId
       FROM batches b
       JOIN courses c ON b.course_id = c.id
       WHERE b.id = ?`,
      [batchId]
    );
    
    if (batch.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(batch[0]);
  } catch (error) {
    logger.error('Error fetching batch details:', error);
    res.status(500).json({ error: 'Failed to fetch batch details' });
  }
});

/**
 * Get modules for a batch
 */
router.get('/batch/:batchId/modules', studentAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.student.studentId;
    
    // Check enrollment
    const enrollment = await db.queryPromise(
      'SELECT * FROM student_batches WHERE student_id = ? AND batch_id = ? AND status = "Active"',
      [studentId, batchId]
    );
    
    if (enrollment.length === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    // Get course ID for the batch
    const batch = await db.queryPromise('SELECT course_id FROM batches WHERE id = ?', [batchId]);
    if (batch.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const courseId = batch[0].course_id;
    
    // Get modules with progress
    const modules = await db.queryPromise(
      `SELECT m.*, 
              mp.completion_percentage,
              mp.last_accessed
       FROM course_modules m
       LEFT JOIN module_progress mp ON m.id = mp.module_id AND mp.student_id = ?
       WHERE m.course_id = ? AND m.is_published = true
       ORDER BY m.order_index`,
      [studentId, courseId]
    );
    
    res.json(modules);
  } catch (error) {
    logger.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

/**
 * Get materials for a batch
 */
router.get('/batch/:batchId/materials', studentAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.student.studentId;
    
    // Check enrollment
    const enrollment = await db.queryPromise(
      'SELECT * FROM student_batches WHERE student_id = ? AND batch_id = ? AND status = "Active"',
      [studentId, batchId]
    );
    
    if (enrollment.length === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    // Get course ID for the batch
    const batch = await db.queryPromise('SELECT course_id FROM batches WHERE id = ?', [batchId]);
    if (batch.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const courseId = batch[0].course_id;
    
    // Get all materials for the course
    const materials = await db.queryPromise(
      `SELECT mat.*, 
              cm.name as module_name,
              cm.order_index as module_order
       FROM course_materials mat
       JOIN course_modules cm ON mat.module_id = cm.id
       WHERE cm.course_id = ? AND cm.is_published = true
       ORDER BY cm.order_index, mat.created_at DESC`,
      [courseId]
    );
    
    res.json(materials);
  } catch (error) {
    logger.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * Get assignments for a batch
 */
router.get('/batch/:batchId/assignments', studentAuthMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.student.studentId;
    
    // Check enrollment
    const enrollment = await db.queryPromise(
      'SELECT * FROM student_batches WHERE student_id = ? AND batch_id = ? AND status = "Active"',
      [studentId, batchId]
    );
    
    if (enrollment.length === 0) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }
    
    // Get course ID for the batch
    const batch = await db.queryPromise('SELECT course_id FROM batches WHERE id = ?', [batchId]);
    if (batch.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const courseId = batch[0].course_id;
    
    // Get all assignments with submission status
    const assignments = await db.queryPromise(
      `SELECT a.*, 
              cm.name as module_name,
              cm.order_index as module_order,
              s.id as submission_id,
              s.status as submission_status,
              s.submitted_at,
              s.grade,
              s.feedback
       FROM course_assignments a
       JOIN course_modules cm ON a.module_id = cm.id
       LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
       WHERE cm.course_id = ? AND a.is_published = true
       ORDER BY a.due_date ASC`,
      [studentId, courseId]
    );
    
    res.json(assignments);
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

/**
 * Get all submissions for a student
 */
router.get('/submissions', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    const submissions = await db.queryPromise(
      `SELECT s.*, a.title as assignment_title, a.total_marks, cm.name as module_name
       FROM assignment_submissions s
       JOIN course_assignments a ON s.assignment_id = a.id
       JOIN course_modules cm ON a.module_id = cm.id
       WHERE s.student_id = ?
       ORDER BY s.submitted_at DESC`,
      [studentId]
    );
    
    res.json(submissions);
  } catch (error) {
    logger.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * Submit assignment (batch context)
 */
router.post('/submissions', studentAuthMiddleware, upload.single('submission'), async (req, res) => {
  try {
    const { assignment_id, submission_text } = req.body;
    const studentId = req.student.studentId;
    
    // Check if assignment exists and is published
    const assignment = await db.queryPromise(
      'SELECT * FROM course_assignments WHERE id = ? AND is_published = true',
      [assignment_id]
    );
    
    if (assignment.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Check if past due date
    const dueDate = new Date(assignment[0].due_date);
    const now = new Date();
    
    if (now > dueDate && !assignment[0].allow_late_submission) {
      return res.status(400).json({ error: 'Assignment submission deadline has passed' });
    }
    
    // Check for existing submission
    const existingSubmission = await db.queryPromise(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignment_id, studentId]
    );
    
    const filePath = req.file ? req.file.path : null;
    const fileName = req.file ? req.file.originalname : null;
    const fileSize = req.file ? req.file.size : null;
    
    if (existingSubmission.length > 0) {
      // Update existing submission
      await db.queryPromise(
        `UPDATE assignment_submissions 
         SET submission_text = ?, file_path = ?, file_name = ?, file_size = ?, 
             submitted_at = NOW(), status = 'submitted'
         WHERE id = ?`,
        [submission_text, filePath, fileName, fileSize, existingSubmission[0].id]
      );
    } else {
      // Create new submission
      await db.queryPromise(
        `INSERT INTO assignment_submissions 
         (assignment_id, student_id, submission_text, file_path, file_name, file_size, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
        [assignment_id, studentId, submission_text, filePath, fileName, fileSize]
      );
    }
    
    res.json({ success: true, message: 'Assignment submitted successfully' });
  } catch (error) {
    logger.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

/**
 * Download student's own submission file
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
      JOIN course_assignments a ON asub.assignment_id = a.id
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
    const fs = require('fs');
    if (!fs.existsSync(submissionFile.file_path)) {
      logger.error(`Student submission file not found at path: ${submissionFile.file_path}`);
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    // Prepare download filename (use original name or assignment title)
    const downloadFileName = submissionFile.file_name || `${submissionFile.assignment_title}_submission`;
    
    // Get file stats and determine content type
    const fileStats = fs.statSync(submissionFile.file_path);
    const path = require('path');
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
      logger.info(`Student ${studentId} successfully downloaded submission ${submissionId}`);
    });
    
    // Pipe the file to response
    fileStream.pipe(res);
    
  } catch (error) {
    logger.error('Error downloading student submission:', error);
    res.status(500).json({ error: 'Failed to download submission' });
  }
});

module.exports = router; 