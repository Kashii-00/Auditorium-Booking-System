const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');
const { studentAuthMiddleware } = require('./studentAuthRoutes');

/**
 * Get all payments for the authenticated student
 * GET /api/student-payments
 */
router.get('/', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    const query = `
      SELECT p.*, c.courseName,
      FROM student_payments p
      JOIN courses c ON p.course_id = c.id
      LEFT JOIN batches b ON p.batch_id = b.id
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `;
    
    const payments = await db.queryPromise(query, [studentId]);
    res.json(payments);
  } catch (error) {
    logger.error('Error fetching student payments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get pending payments for the authenticated student
 * GET /api/student-payments/pending
 */
router.get('/pending', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    const query = `
      SELECT c.id AS course_id, c.courseName, c.fee AS total_fee, 
             sc.amount_paid, (c.fee - sc.amount_paid) AS remaining_amount,
             sc.payment_status, b.id AS batch_id,
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      LEFT JOIN student_batches sb ON sc.student_id = sb.student_id AND sc.course_id = (
        SELECT course_id FROM batches WHERE id = sb.batch_id
      )
      LEFT JOIN batches b ON sb.batch_id = b.id
      WHERE sc.student_id = ? AND sc.payment_status != 'PAID'
      ORDER BY sc.primary_course DESC
    `;
    
    const pendingPayments = await db.queryPromise(query, [studentId]);
    res.json(pendingPayments);
  } catch (error) {
    logger.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Process a new payment
 * POST /api/student-payments
 */
router.post('/', studentAuthMiddleware, async (req, res) => {
  let conn;
  try {
    const { course_id, batch_id, amount, payment_method, reference_number, notes } = req.body;
    const studentId = req.student.studentId;
    
    if (!course_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Course ID and valid amount are required' });
    }
    
    conn = await db.getConnectionPromise();
    await conn.beginTransactionPromise();
    
    // Insert payment record
    const insertPaymentQuery = `
      INSERT INTO student_payments (
        student_id, course_id, batch_id, amount, payment_method, 
        reference_number, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
    `;
    
    const paymentResult = await conn.queryPromise(insertPaymentQuery, [
      studentId, course_id, batch_id || null, amount, 
      payment_method || 'CASH', reference_number || null, notes || null
    ]);
    
    // Update student_courses payment status
    const getCourseQuery = `
      SELECT sc.amount_paid, c.fee 
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE sc.student_id = ? AND sc.course_id = ?
    `;
    
    const coursePayments = await conn.queryPromise(getCourseQuery, [studentId, course_id]);
    
    if (coursePayments.length === 0) {
      await conn.rollbackPromise();
      return res.status(404).json({ error: 'Student is not enrolled in this course' });
    }
    
    const { amount_paid, fee } = coursePayments[0];
    const newTotalPaid = parseFloat(amount_paid) + parseFloat(amount);
    const newStatus = newTotalPaid >= fee ? 'PAID' : (newTotalPaid > 0 ? 'PARTIAL' : 'UNPAID');
    
    const updateCourseQuery = `
      UPDATE student_courses 
      SET amount_paid = ?, payment_status = ?
      WHERE student_id = ? AND course_id = ?
    `;
    
    await conn.queryPromise(updateCourseQuery, [
      newTotalPaid, newStatus, studentId, course_id
    ]);
    
    await conn.commitPromise();
    
    res.status(201).json({ 
      success: true, 
      payment_id: paymentResult.insertId,
      new_status: newStatus,
      amount_paid: newTotalPaid,
      message: 'Payment processed successfully' 
    });
  } catch (error) {
    if (conn) {
      try { await conn.rollbackPromise(); } catch (e) {}
    }
    logger.error('Error processing payment:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
