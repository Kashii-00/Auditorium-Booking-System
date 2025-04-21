"use strict";

const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');
const moment = require('moment');
const logger = require('../logger');

// Get all course payments
router.get('/', auth.authMiddleware, (req, res) => {
  const sql = `
    SELECT cp.*, c.courseName, u.name as userName
    FROM coursePay cp
    JOIN courses c ON cp.course_id = c.id
    JOIN users u ON cp.user_id = u.id
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching course payments:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    return res.json(results);
  });
});

// Create new course payment
router.post('/', auth.authMiddleware, (req, res) => {
  const user_name = req.user?.name || 'Unknown';
  const {
    course_id,
    user_id,
    totalFee,
    registrationFee,
    installment1,
    installment2,
    additionalInstallments
  } = req.body;

  // Convert additionalInstallments to JSON string if provided
  const additionalInstallmentsStr = additionalInstallments ? JSON.stringify(additionalInstallments) : null;
  const sql = `INSERT INTO coursePay 
    (course_id, user_id, totalFee, registrationFee, installment1, installment2, additionalInstallments) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [course_id, user_id, totalFee, registrationFee, installment1, installment2, additionalInstallmentsStr], (err, result) => {
    if (err) {
      console.error('Error creating course payment:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course payment created successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Course payment created successfully',
      paymentId: result.insertId
    });
  });
});

// Get course payment by ID
router.get('/:id', auth.authMiddleware, (req, res) => {
  const paymentId = req.params.id;
  const sql = `
    SELECT cp.*, c.courseName, u.name as userName
    FROM coursePay cp
    JOIN courses c ON cp.course_id = c.id
    JOIN users u ON cp.user_id = u.id
    WHERE cp.id = ?
  `;
  db.query(sql, [paymentId], (err, results) => {
    if (err) {
      console.error('Error fetching course payment:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    if (results.length === 0) {
      return res.status(404).json({
        error: 'Course payment not found'
      });
    }
    return res.json(results[0]);
  });
});

// Update course payment
router.put('/:id', auth.authMiddleware, (req, res) => {
  const paymentId = req.params.id;
  const user_name = req.user?.name || 'Unknown';
  const {
    totalFee,
    registrationFee,
    installment1,
    installment2,
    additionalInstallments
  } = req.body;

  // Convert additionalInstallments to JSON string if provided
  const additionalInstallmentsStr = additionalInstallments ? JSON.stringify(additionalInstallments) : null;
  const sql = `UPDATE coursePay SET 
    totalFee = ?, 
    registrationFee = ?, 
    installment1 = ?, 
    installment2 = ?, 
    additionalInstallments = ? 
    WHERE id = ?`;
  db.query(sql, [totalFee, registrationFee, installment1, installment2, additionalInstallmentsStr, paymentId], (err, result) => {
    if (err) {
      console.error('Error updating course payment:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Course payment not found'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course payment updated successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Course payment updated successfully'
    });
  });
});

// Delete course payment
router.delete('/:id', auth.authMiddleware, (req, res) => {
  const paymentId = req.params.id;
  const user_name = req.user?.name || 'Unknown';
  const sql = 'DELETE FROM coursePay WHERE id = ?';
  db.query(sql, [paymentId], (err, result) => {
    if (err) {
      console.error('Error deleting course payment:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Course payment not found'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course payment deleted successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Course payment deleted successfully'
    });
  });
});
module.exports = router;