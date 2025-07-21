const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');
const studentIdGenerator = require('../services/studentIdGenerator');

// GET /student-ids/stats - Get student code statistics
router.get('/stats', auth.authMiddleware, async (req, res) => {
  try {
    const { course_id, year } = req.query;
    const currentYear = year || new Date().getFullYear();

    if (course_id) {
      // Get stats for specific course
      const stats = await studentIdGenerator.getStudentCodeStats(course_id, currentYear);
      res.json({ success: true, stats });
    } else {
      // Get overall stats
      const query = `
        SELECT 
          c.courseId,
          c.courseName,
          s.batch_number,
          s.year,
          s.current_sequence,
          COUNT(sc.id) as students_enrolled
        FROM student_id_sequences s
        JOIN courses c ON s.course_id = c.id
        LEFT JOIN student_courses sc ON sc.student_code LIKE CONCAT('MP-', REPLACE(c.courseId, 'MP-', ''), SUBSTRING(s.year, -2), '.', s.batch_number, '-%')
        WHERE s.year = ?
        GROUP BY c.id, s.batch_number, s.year
        ORDER BY c.courseName, s.batch_number
      `;

      const overallStats = await db.queryPromise(query, [currentYear]);
      res.json({ success: true, stats: overallStats });
    }
  } catch (error) {
    console.error('Error getting student code stats:', error);
    res.status(500).json({ error: error.message || 'Failed to get student code statistics' });
  }
});

// GET /student-ids/search/:studentCode - Search student by student code
router.get('/search/:studentCode', auth.authMiddleware, async (req, res) => {
  try {
    const { studentCode } = req.params;

    // Validate student code format
    if (!studentIdGenerator.validateStudentCode(studentCode)) {
      return res.status(400).json({ error: 'Invalid student code format' });
    }

    // Search for student by code
    const query = `
      SELECT 
        s.*,
        c.courseName,
        c.courseId,
        sc.student_code,
        sc.primary_course,
        sc.enrollment_date
      FROM students s
      JOIN student_courses sc ON s.id = sc.student_id
      JOIN courses c ON sc.course_id = c.id
      WHERE sc.student_code = ?
    `;

    const result = await db.queryPromise(query, [studentCode]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Student not found with this code' });
    }

    res.json({ success: true, student: result[0] });
  } catch (error) {
    console.error('Error searching student by code:', error);
    res.status(500).json({ error: error.message || 'Failed to search student' });
  }
});

// GET /student-ids/search - Search students by partial code
router.get('/search', auth.authMiddleware, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }

    const students = await studentIdGenerator.searchStudentsByCode(q, parseInt(limit));
    res.json({ success: true, students });
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ error: error.message || 'Failed to search students' });
  }
});

// POST /student-ids/generate - Generate a new student code (for testing)
router.post('/generate', auth.authMiddleware, async (req, res) => {
  try {
    const { course_id, batch_id, year } = req.body;

    if (!course_id) {
      return res.status(400).json({ error: 'course_id is required' });
    }

    const studentCode = await studentIdGenerator.generateStudentCode(course_id, batch_id, year);
    const parsed = studentIdGenerator.parseStudentCode(studentCode);

    res.json({ 
      success: true, 
      student_code: studentCode,
      components: parsed,
      message: 'Student code generated successfully' 
    });
  } catch (error) {
    console.error('Error generating student code:', error);
    res.status(500).json({ error: error.message || 'Failed to generate student code' });
  }
});

// POST /student-ids/validate - Validate student code format
router.post('/validate', auth.authMiddleware, async (req, res) => {
  try {
    const { student_code } = req.body;

    if (!student_code) {
      return res.status(400).json({ error: 'student_code is required' });
    }

    const isValid = studentIdGenerator.validateStudentCode(student_code);
    
    if (isValid) {
      const parsed = studentIdGenerator.parseStudentCode(student_code);
      res.json({ 
        success: true, 
        valid: true,
        components: parsed
      });
    } else {
      res.json({ 
        success: true, 
        valid: false,
        error: 'Invalid student code format'
      });
    }
  } catch (error) {
    console.error('Error validating student code:', error);
    res.status(500).json({ error: error.message || 'Failed to validate student code' });
  }
});

// GET /student-ids/next/:courseId - Get next student code for a course (preview)
router.get('/next/:courseId', auth.authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { batch_id, year } = req.query;

    // This generates but doesn't commit the student code
    const nextStudentCode = await studentIdGenerator.reserveStudentCode(courseId, batch_id, year);
    const parsed = studentIdGenerator.parseStudentCode(nextStudentCode);

    res.json({ 
      success: true, 
      next_student_code: nextStudentCode,
      components: parsed,
      message: 'Next student code preview generated' 
    });
  } catch (error) {
    console.error('Error getting next student code:', error);
    res.status(500).json({ error: error.message || 'Failed to get next student code' });
  }
});

// GET /student-ids/student/:studentId/codes - Get all codes for a student
router.get('/student/:studentId/codes', auth.authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    const codes = await studentIdGenerator.getAllStudentCodesForStudent(parseInt(studentId));
    
    if (codes.length === 0) {
      return res.status(404).json({ error: 'No course enrollments found for this student' });
    }

    res.json({ success: true, codes });
  } catch (error) {
    console.error('Error getting student codes:', error);
    res.status(500).json({ error: error.message || 'Failed to get student codes' });
  }
});

// GET /student-ids/student/:studentId/primary - Get primary code for a student
router.get('/student/:studentId/primary', auth.authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    const primaryCode = await studentIdGenerator.getPrimaryStudentCode(parseInt(studentId));
    
    if (!primaryCode) {
      return res.status(404).json({ error: 'No primary course enrollment found for this student' });
    }

    res.json({ success: true, primary_code: primaryCode });
  } catch (error) {
    console.error('Error getting primary student code:', error);
    res.status(500).json({ error: error.message || 'Failed to get primary student code' });
  }
});

module.exports = router; 