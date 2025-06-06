// routes/batches.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');
const moment = require('moment');
const logger = require('../logger');

// GET /batches?course_id=...&year=...
router.get('/', auth.authMiddleware, async (req, res) => {
  try {
    const { course_id, year } = req.query;
    let sql = `SELECT * FROM batches WHERE 1=1`;
    const params = [];
    if (course_id) {
      sql += ` AND course_id = ?`;
      params.push(course_id);
    }
    if (year) {
      sql += ` AND YEAR(start_date) = ?`;
      params.push(year);
    }
    sql += ` ORDER BY start_date`;
    const batches = await db.queryPromise(sql, params);

    // Add student_count and lecturer_count for each batch
    const batchIds = batches.map(b => b.id);
    let studentCounts = {};
    let lecturerCounts = {};
    if (batchIds.length > 0) {
      // Get student counts
      const studentRows = await db.queryPromise(
        `SELECT batch_id, COUNT(*) as count FROM student_batches WHERE batch_id IN (?) GROUP BY batch_id`,
        [batchIds]
      );
      studentRows.forEach(row => { studentCounts[row.batch_id] = row.count; });
      // Get lecturer counts
      const lecturerRows = await db.queryPromise(
        `SELECT batch_id, COUNT(*) as count FROM lecturer_batches WHERE batch_id IN (?) GROUP BY batch_id`,
        [batchIds]
      );
      lecturerRows.forEach(row => { lecturerCounts[row.batch_id] = row.count; });
    }
    const batchesWithCounts = batches.map(b => ({
      ...b,
      student_count: studentCounts[b.id] || 0,
      lecturer_count: lecturerCounts[b.id] || 0,
    }));
    res.json(batchesWithCounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load batches' });
  }
});

// GET /batches/annual-plan?course_id=...&year=...
router.get('/annual-plan', auth.authMiddleware, async (req, res) => {
  const { course_id, year } = req.query;
  if (!course_id || !year) {
    return res.status(400).json({ error: 'Course ID and year are required' });
  }

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const sql = `
    SELECT b.*, c.courseName, c.courseId,
      (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id)   AS student_count,
      (SELECT COUNT(*) FROM lecturer_batches lb WHERE lb.batch_id = b.id) AS lecturer_count
    FROM batches b
    JOIN courses c ON b.course_id = c.id
    WHERE b.course_id = ?
      AND ((b.start_date BETWEEN ? AND ?) OR
           (b.end_date   BETWEEN ? AND ?) OR
           (b.start_date <= ? AND b.end_date >= ?))
    ORDER BY b.start_date
  `;
  try {
    const plans = await db.queryPromise(sql, [
      course_id,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate
    ]);
    res.json(plans);
  } catch (err) {
    logger.error('GET /batches/annual-plan error', err);
    res.status(500).json({ error: 'Failed to fetch batch data' });
  }
});

// GET /batches/:id
router.get('/:id', auth.authMiddleware, async (req, res) => {
  try {
    const [batch] = await db.queryPromise(
      `SELECT b.*, 
        (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id) AS student_count,
        (SELECT COUNT(*) FROM lecturer_batches lb WHERE lb.batch_id = b.id) AS lecturer_count
       FROM batches b WHERE b.id = ?`, [req.params.id]
    );
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get batch info' });
  }
});

// POST /batches
router.post('/', auth.authMiddleware, async (req, res) => {
  const { course_id, batch_name, start_date, end_date = null } = req.body;
  if (!course_id || !batch_name || !start_date) {
    return res.status(400).json({ error: 'course_id, batch_name, and start_date are required' });
  }
  const sql = `
    INSERT INTO batches (course_id, batch_name, start_date, end_date)
    VALUES (?, ?, ?, ?)
  `;
  try {
    const result = await db.queryPromise(sql, [course_id, batch_name, start_date, end_date]);
    logger.info(`Batch "${batch_name}" created by ${req.user.name} at ${moment().format()}`);
    res.status(201).json({ success: true, batchId: result.insertId });
  } catch (err) {
    logger.error('POST /batches error', err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// PUT /batches/:id
router.put('/:id', auth.authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { batch_name, start_date, end_date = null } = req.body;
  if (!batch_name || !start_date) {
    return res.status(400).json({ error: 'batch_name and start_date are required' });
  }
  const sql = `
    UPDATE batches SET batch_name = ?, start_date = ?, end_date = ?
    WHERE id = ?
  `;
  try {
    const result = await db.queryPromise(sql, [batch_name, start_date, end_date, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Batch not found' });
    logger.info(`Batch ${id} updated by ${req.user.name} at ${moment().format()}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`PUT /batches/${id} error`, err);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// DELETE /batches/:id
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // ensure no enrolled students
    const [{ count }] = await db.queryPromise(
      'SELECT COUNT(*) AS count FROM student_batches WHERE batch_id = ?', [id]
    );
    if (count > 0) {
      return res.status(400).json({ error: 'Cannot delete batch with enrolled students' });
    }
    const result = await db.queryPromise('DELETE FROM batches WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Batch not found' });
    logger.info(`Batch ${id} deleted by ${req.user.name} at ${moment().format()}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`DELETE /batches/${id} error`, err);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// Get lecturers assigned to a batch
router.get('/:batchId/lecturers', auth.authMiddleware, async (req, res) => {
  try {
    const rows = await db.queryPromise(
      `SELECT l.id, l.full_name, l.email, l.phone
       FROM lecturer_batches lb
       JOIN lecturers l ON lb.lecturer_id = l.id
       WHERE lb.batch_id = ?`, [req.params.batchId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load batch lecturers' });
  }
});

// Get students assigned to a batch
router.get('/:batchId/students', auth.authMiddleware, async (req, res) => {
  try {
    const rows = await db.queryPromise(
      `SELECT s.id, s.full_name, s.email
       FROM student_batches sb
       JOIN students s ON sb.student_id = s.id
       WHERE sb.batch_id = ?`, [req.params.batchId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load batch students' });
  }
});

// Assign lecturers to a batch
router.post('/:batchId/lecturers', auth.authMiddleware, async (req, res) => {
  try {
    let { lecturer_ids } = req.body;
    // Accept both array and JSON-stringified array
    if (typeof lecturer_ids === "string") {
      try { lecturer_ids = JSON.parse(lecturer_ids); } catch {}
    }
    if (!Array.isArray(lecturer_ids) || lecturer_ids.length === 0) {
      return res.status(400).json({ error: 'No lecturers selected' });
    }
    // Check batch capacity
    const [batch] = await db.queryPromise(
      `SELECT capacity, (SELECT COUNT(*) FROM lecturer_batches WHERE batch_id = ?) AS lecturer_count FROM batches WHERE id = ?`,
      [req.params.batchId, req.params.batchId]
    );
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    if (batch.lecturer_count + lecturer_ids.length > batch.capacity) {
      return res.status(400).json({ error: 'Batch capacity reached' });
    }
    // Insert lecturer-batch assignments (ignore duplicates)
    for (const lecturerId of lecturer_ids) {
      await db.queryPromise(
        `INSERT IGNORE INTO lecturer_batches (lecturer_id, batch_id, status) VALUES (?, ?, 'Assigned')`,
        [lecturerId, req.params.batchId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign lecturers' });
  }
});

// Assign students to a batch
router.post('/:batchId/students', auth.authMiddleware, async (req, res) => {
  try {
    let { student_ids } = req.body;
    if (typeof student_ids === "string") {
      try { student_ids = JSON.parse(student_ids); } catch {}
    }
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: 'No students selected' });
    }
    // Check batch capacity
    const [batch] = await db.queryPromise(
      `SELECT capacity, (SELECT COUNT(*) FROM student_batches WHERE batch_id = ?) AS student_count FROM batches WHERE id = ?`,
      [req.params.batchId, req.params.batchId]
    );
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    if (batch.student_count + student_ids.length > batch.capacity) {
      return res.status(400).json({ error: 'Batch capacity reached' });
    }
    // Insert student-batch assignments (ignore duplicates)
    for (const studentId of student_ids) {
      await db.queryPromise(
        `INSERT IGNORE INTO student_batches (student_id, batch_id, status) VALUES (?, ?, 'Active')`,
        [studentId, req.params.batchId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

// DELETE lecturer from batch
router.delete('/:batchId/lecturers/:lecturerId', auth.authMiddleware, async (req, res) => {
  try {
    const { batchId, lecturerId } = req.params;
    const result = await db.queryPromise(
      `DELETE FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?`,
      [batchId, lecturerId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lecturer not found in batch' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove lecturer from batch' });
  }
});

// DELETE student from batch
router.delete('/:batchId/students/:studentId', auth.authMiddleware, async (req, res) => {
  try {
    const { batchId, studentId } = req.params;
    const result = await db.queryPromise(
      `DELETE FROM student_batches WHERE batch_id = ? AND student_id = ?`,
      [batchId, studentId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found in batch' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove student from batch' });
  }
});

module.exports = router;
