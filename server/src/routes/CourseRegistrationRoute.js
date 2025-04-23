const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');
const moment = require('moment');
const logger = require('../logger');

router.get('/', auth.authMiddleware, (req, res) => {
  const { courseId } = req.query;
  if (courseId) {
    const sql = 'SELECT id FROM courses WHERE courseId = ? LIMIT 1';
    db.query(sql, [courseId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      return res.json({ exists: results.length > 0 });
    });
  } else {
    const sql = 'SELECT * FROM courses';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      return res.json(results);
    });
  }
});

router.post('/', auth.authMiddleware, (req, res) => {
  const user_name = req.user?.name || 'Unknown';
  const { 
    user_id, 
    courseId, 
    stream, 
    courseName, 
    medium, 
    location, 
    assessmentCriteria, 
    resources, 
    fees,
    registrationFee,
    installment1,
    installment2,
    additionalInstallments
  } = req.body;

  if (!registrationFee || isNaN(Number(registrationFee)) || Number(registrationFee) <= 0) {
    return res.status(400).json({ error: 'Registration fee is required and must be greater than 0' });
  }
  if (installment1 !== null && installment1 !== undefined && installment1 !== '' && (isNaN(Number(installment1)) || Number(installment1) <= 0)) {
    return res.status(400).json({ error: 'Installment 1 is enabled and must be greater than 0' });
  }
  if (installment2 !== null && installment2 !== undefined && installment2 !== '' && (isNaN(Number(installment2)) || Number(installment2) <= 0)) {
    return res.status(400).json({ error: 'Installment 2 is enabled and must be greater than 0' });
  }

  const mediumStr = JSON.stringify(medium);
  const locationStr = JSON.stringify(location);
  const assessmentCriteriaStr = JSON.stringify(assessmentCriteria);
  const resourcesStr = JSON.stringify(resources);

  let additionalInstallmentsArr = [];
  if (Array.isArray(additionalInstallments)) {
    additionalInstallmentsArr = additionalInstallments
      .map(inst => typeof inst === 'object' && inst !== null ? Number(inst.value) || 0 : Number(inst) || 0)
      .filter(val => val > 0);
  }
  const additionalInstallmentsStr = (additionalInstallmentsArr.length > 0)
    ? JSON.stringify(additionalInstallmentsArr)
    : null;

  const sql = `INSERT INTO courses 
    (user_id, courseId, stream, courseName, medium, location, assessmentCriteria, resources, fees, registrationFee, installment1, installment2, additionalInstallments) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [
    user_id, 
    courseId, 
    stream, 
    courseName, 
    mediumStr, 
    locationStr, 
    assessmentCriteriaStr, 
    resourcesStr, 
    fees,
    registrationFee,
    installment1,
    installment2,
    additionalInstallmentsStr
  ], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course registered successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Course registered successfully',
      courseId: result.insertId
    });
  });
});

router.get('/:id', auth.authMiddleware, (req, res) => {
  const courseId = req.params.id;
  const sql = 'SELECT * FROM courses WHERE id = ?';
  db.query(sql, [courseId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Course not found' });
    return res.json(results[0]);
  });
});

router.put('/:id', auth.authMiddleware, (req, res) => {
  const courseId = req.params.id;
  const user_name = req.user?.name || 'Unknown';
  const { 
    stream, 
    courseName, 
    medium, 
    location, 
    assessmentCriteria, 
    resources, 
    fees 
  } = req.body;

  const mediumStr = JSON.stringify(medium);
  const locationStr = JSON.stringify(location);
  const assessmentCriteriaStr = JSON.stringify(assessmentCriteria);
  const resourcesStr = JSON.stringify(resources);

  const sql = `UPDATE courses SET 
    stream = ?, 
    courseName = ?, 
    medium = ?, 
    location = ?, 
    assessmentCriteria = ?, 
    resources = ?, 
    fees = ? 
    WHERE id = ?`;

  db.query(sql, [
    stream, 
    courseName, 
    mediumStr, 
    locationStr, 
    assessmentCriteriaStr, 
    resourcesStr, 
    fees, 
    courseId
  ], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Course not found' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course updated successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Course updated successfully'
    });
  });
});

router.delete('/:id', auth.authMiddleware, (req, res) => {
  const courseId = req.params.id;
  const user_name = req.user?.name || 'Unknown';
  const sql = 'DELETE FROM courses WHERE id = ?';
  db.query(sql, [courseId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Course not found' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Course deleted successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  });
});

module.exports = router;