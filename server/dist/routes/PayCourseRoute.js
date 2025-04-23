"use strict";

const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');
const moment = require('moment');
const logger = require('../logger');
router.get('/', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/course-payments`);
  const sql = `
    SELECT cp.*, c.courseName, u.name as userName
    FROM coursePay cp
    JOIN courses c ON cp.course_id = c.id
    JOIN users u ON cp.user_id = u.id
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    return res.json(results);
  });
});
router.post('/', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/course-payments`);
  console.log('Course payment POST body:', req.body);
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
  const additionalInstallmentsStr = additionalInstallments ? JSON.stringify(additionalInstallments) : null;
  const sql = `INSERT INTO coursePay 
    (course_id, user_id, totalFee, registrationFee, installment1, installment2, additionalInstallments) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [course_id, user_id, totalFee, registrationFee, installment1, installment2, additionalInstallmentsStr], (err, result) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course payment created successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Payment recorded'
    });
  });
});
router.get('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/course-payments/${req.params.id}`);
  const paymentId = req.params.id;
  const sql = `
    SELECT cp.*, c.courseName, u.name as userName
    FROM coursePay cp
    JOIN courses c ON cp.course_id = c.id
    JOIN users u ON cp.user_id = u.id
    WHERE cp.id = ?
  `;
  db.query(sql, [paymentId], (err, results) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    if (results.length === 0) return res.status(404).json({
      error: 'Course payment not found'
    });
    return res.json(results[0]);
  });
});
router.put('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] PUT /api/course-payments/${req.params.id}`);
  console.log('Course payment update PUT body:', req.body);
  const paymentId = req.params.id;
  const user_name = req.user?.name || 'Unknown';
  const {
    totalFee,
    registrationFee,
    installment1,
    installment2,
    additionalInstallments
  } = req.body;
  const additionalInstallmentsStr = additionalInstallments ? JSON.stringify(additionalInstallments) : null;
  const sql = `UPDATE coursePay SET 
    totalFee = ?, 
    registrationFee = ?, 
    installment1 = ?, 
    installment2 = ?, 
    additionalInstallments = ? 
    WHERE id = ?`;
  db.query(sql, [totalFee, registrationFee, installment1, installment2, additionalInstallmentsStr, paymentId], (err, result) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    if (result.affectedRows === 0) return res.status(404).json({
      error: 'Course payment not found'
    });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course payment updated successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Course payment updated successfully'
    });
  });
});
router.delete('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/course-payments/${req.params.id}`);
  const paymentId = req.params.id;
  const user_name = req.user?.name || 'Unknown';
  const sql = 'DELETE FROM coursePay WHERE id = ?';
  db.query(sql, [paymentId], (err, result) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    if (result.affectedRows === 0) return res.status(404).json({
      error: 'Course payment not found'
    });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course payment deleted successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Course payment deleted successfully'
    });
  });
});
module.exports = router;