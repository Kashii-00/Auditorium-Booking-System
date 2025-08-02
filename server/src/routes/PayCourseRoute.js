// routes/coursePayments.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');
const moment = require('moment');
const logger = require('../logger');

// GET /course-payments
router.get('/', auth.authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT cp.id, cp.student_id, s.full_name AS studentName,
             cp.course_id, c.courseName,
             cp.payment_type, cp.amount,
             cp.payment_date, cp.payment_method,
             cp.receipt_number, cp.notes,
             cp.created_by, u.name AS createdBy,
             cp.created_at, cp.updated_at
      FROM course_payments cp
      LEFT JOIN students s      ON cp.student_id = s.id
      LEFT JOIN courses c       ON cp.course_id = c.id
      LEFT JOIN users u         ON cp.created_by = u.id
      ORDER BY cp.payment_date DESC
    `;
    const payments = await db.queryPromise(sql);
    res.json(payments);
  } catch (err) {
    logger.error('GET /course-payments error', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /course-payments
router.post('/', auth.authMiddleware, async (req, res) => {
  try {
    const {
      student_id,
      course_id,
      payment_type,
      amount,
      payment_date = moment().format('YYYY-MM-DD'),
      payment_method,
      receipt_number = null,
      notes = null
    } = req.body;

    // validation
    if (!student_id || !course_id || !payment_type || isNaN(Number(amount)) || !payment_method) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    const sql = `
      INSERT INTO course_payments
        (student_id, course_id, payment_type, amount, payment_date,
         payment_method, receipt_number, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      student_id,
      course_id,
      payment_type,
      amount,
      payment_date,
      payment_method,
      receipt_number,
      notes,
      req.user.id
    ];
    const result = await db.queryPromise(sql, params);

    logger.info(`Course payment ${result.insertId} created by ${req.user.name} at ${moment().format()}`);
    res.status(201).json({ success: true, paymentId: result.insertId });
  } catch (err) {
    logger.error('POST /course-payments error', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /course-payments/:id
router.get('/:id', auth.authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT cp.id, cp.student_id, s.full_name AS studentName,
             cp.course_id, c.courseName,
             cp.payment_type, cp.amount,
             cp.payment_date, cp.payment_method,
             cp.receipt_number, cp.notes,
             cp.created_by, u.name AS createdBy,
             cp.created_at, cp.updated_at
      FROM course_payments cp
      LEFT JOIN students s      ON cp.student_id = s.id
      LEFT JOIN courses c       ON cp.course_id = c.id
      LEFT JOIN users u         ON cp.created_by = u.id
      WHERE cp.id = ?
      LIMIT 1
    `;
    const rows = await db.queryPromise(sql, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) {
    logger.error(`GET /course-payments/${req.params.id} error`, err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /course-payments/:id
router.put('/:id', auth.authMiddleware, async (req, res) => {
  try {
    const {
      payment_type,
      amount,
      payment_date,
      payment_method,
      receipt_number,
      notes
    } = req.body;

    // validation
    if (!payment_type || isNaN(Number(amount)) || !payment_method) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    const sql = `
      UPDATE course_payments SET
        payment_type = ?,
        amount = ?,
        payment_date = ?,
        payment_method = ?,
        receipt_number = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    const params = [
      payment_type,
      amount,
      payment_date,
      payment_method,
      receipt_number || null,
      notes || null,
      req.params.id
    ];
    const result = await db.queryPromise(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });

    logger.info(`Course payment ${req.params.id} updated by ${req.user.name} at ${moment().format()}`);
    res.json({ success: true, message: 'Payment updated' });
  } catch (err) {
    logger.error(`PUT /course-payments/${req.params.id} error`, err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /course-payments/:id
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  try {
    const sql = 'DELETE FROM course_payments WHERE id = ?';
    const result = await db.queryPromise(sql, [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });

    logger.info(`Course payment ${req.params.id} deleted by ${req.user.name} at ${moment().format()}`);
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    logger.error(`DELETE /course-payments/${req.params.id} error`, err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
