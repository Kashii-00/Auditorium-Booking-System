// routes/courses.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../auth');
const logger = require('../logger');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/courses');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Helper function to ensure field is valid JSON
const ensureJsonField = (value) => {
  if (!value) return JSON.stringify([]);
  
  if (typeof value === 'string') {
    try {
      // Check if it's already JSON
      JSON.parse(value);
      return value;
    } catch (e) {
      // If not JSON, convert string to JSON array
      if (value.includes(',')) {
        return JSON.stringify(value.split(',').map(item => item.trim()));
      }
      return JSON.stringify([value]);
    }
  }
  
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  
  return JSON.stringify([]);
};

// Get all courses
router.get('/', auth.authMiddleware, async (req, res) => {
  try {
    const query = 'SELECT * FROM courses ORDER BY courseName';
    const courses = await db.queryPromise(query);
    res.json(courses);
  } catch (error) {
    logger.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/check/:courseId', auth.authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const [course] = await db.queryPromise('SELECT id FROM courses WHERE courseId = ?', [courseId]);
    res.json({ exists: !!course });
  } catch (error) {
    logger.error('Error checking courseId:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new course
router.post('/', auth.authMiddleware, upload.none(), async (req, res) => {
  try {
    const {
      courseId, stream, courseName, medium, location, assessmentCriteria, 
      resources, fees, registrationFee, installment1, installment2, 
      additionalInstallments, description, duration, status = 'Active'
    } = req.body;

    // Ensure required fields
    if (!courseId || !courseName || !stream) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format JSON fields properly
    const mediumJson = ensureJsonField(medium);
    const locationJson = ensureJsonField(location);
    const assessmentJson = ensureJsonField(assessmentCriteria);
    const resourcesJson = ensureJsonField(resources);
    const additionalJson = additionalInstallments ? ensureJsonField(additionalInstallments) : null;

    const query = `
      INSERT INTO courses (
        user_id, courseId, stream, courseName, medium, location, 
        assessmentCriteria, resources, fees, registrationFee, 
        installment1, installment2, additionalInstallments, description, 
        duration, status, created_at, updated_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      req.user.id, courseId, stream, courseName, mediumJson, locationJson,
      assessmentJson, resourcesJson, parseFloat(fees || 0), parseFloat(registrationFee || 0),
      parseFloat(installment1 || 0), parseFloat(installment2 || 0), additionalJson,
      description, duration, status
    ];

    const result = await db.queryPromise(query, values);
    res.status(201).json({ 
      success: true, 
      message: 'Course created successfully', 
      courseId: result.insertId 
    });
  } catch (error) {
    logger.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course', details: error.message });
  }
});

// Get a single course by ID
router.get('/:id', auth.authMiddleware, async (req, res) => {
  try {
    const query = 'SELECT * FROM courses WHERE id = ?';
    const [course] = await db.queryPromise(query, [req.params.id]);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    logger.error('Error fetching course:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update a course
router.put('/:id', auth.authMiddleware, upload.none(), async (req, res) => {
  try {
    const {
      courseId, stream, courseName, medium, location, assessmentCriteria, 
      resources, fees, registrationFee, installment1, installment2, 
      additionalInstallments, description, duration, status
    } = req.body;

    // Ensure required fields
    if (!courseId || !courseName || !stream) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format JSON fields properly
    const mediumJson = ensureJsonField(medium);
    const locationJson = ensureJsonField(location);
    const assessmentJson = ensureJsonField(assessmentCriteria);
    const resourcesJson = ensureJsonField(resources);
    const additionalJson = additionalInstallments ? ensureJsonField(additionalInstallments) : null;

    const query = `
      UPDATE courses SET
        courseId = ?, stream = ?, courseName = ?, medium = ?, location = ?,
        assessmentCriteria = ?, resources = ?, fees = ?, registrationFee = ?,
        installment1 = ?, installment2 = ?, additionalInstallments = ?,
        description = ?, duration = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      courseId, stream, courseName, mediumJson, locationJson,
      assessmentJson, resourcesJson, parseFloat(fees || 0), parseFloat(registrationFee || 0),
      parseFloat(installment1 || 0), parseFloat(installment2 || 0), additionalJson,
      description, duration, status, req.params.id
    ];

    const result = await db.queryPromise(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    logger.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course', details: error.message });
  }
});

// Delete a course
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  try {
    // Check for related records first
    const studentCheck = await db.queryPromise(
      'SELECT COUNT(*) as count FROM student_courses WHERE course_id = ?', 
      [req.params.id]
    );
    
    if (studentCheck[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete course with enrolled students. Remove student enrollments first.' 
      });
    }
    
    const query = 'DELETE FROM courses WHERE id = ?';
    const result = await db.queryPromise(query, [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    logger.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course', details: error.message });
  }
});

module.exports = router;
