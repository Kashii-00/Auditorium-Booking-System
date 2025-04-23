"use strict";

const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const uploadDir = path.join(__dirname, '../../uploads/lecturers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({
  storage
});
setInterval(() => {
  logger.info('================ LOG ROTATION: 24 HOURS PASSED ================');
  console.clear();
  console.log(`[${new Date().toISOString()}] Console cleared and logs rotated after 24h.`);
}, 24 * 60 * 60 * 1000);
router.get('/courses', (req, res) => {
  db.query('SELECT id, courseName FROM courses', (err, results) => {
    if (err) return res.status(500).json({
      error: 'DB error'
    });
    res.json(results);
  });
});
router.get('/', (req, res) => {
  db.query(`SELECT l.*, c.courseName, u.name as userName
     FROM lecturers l
     LEFT JOIN courses c ON l.course_id = c.id
     LEFT JOIN users u ON l.user_id = u.id`, (err, results) => {
    if (err) return res.status(500).json({
      error: 'DB error'
    });
    res.json(results);
  });
});
router.post('/', upload.fields([{
  name: 'nic_file'
}, {
  name: 'photo_file'
}, {
  name: 'passbook_file'
}, {
  name: 'education_certificate_file'
}, {
  name: 'cdc_book_file'
}, {
  name: 'driving_trainer_license_file'
}, {
  name: 'other_documents_file'
}]), (req, res) => {
  const {
    user_id,
    course_id,
    category,
    grade,
    stream,
    module
  } = req.body;
  if (!user_id || !course_id) {
    return res.status(400).json({
      error: 'user_id and course_id are required'
    });
  }
  const files = req.files || {};
  db.query(`INSERT INTO lecturers 
        (user_id, course_id, category, grade, stream, module,
         nic_file, photo_file, passbook_file, education_certificate_file, cdc_book_file, driving_trainer_license_file, other_documents_file)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [user_id, course_id, category, grade, stream, module, files.nic_file?.[0]?.filename || null, files.photo_file?.[0]?.filename || null, files.passbook_file?.[0]?.filename || null, files.education_certificate_file?.[0]?.filename || null, files.cdc_book_file?.[0]?.filename || null, files.driving_trainer_license_file?.[0]?.filename || null, files.other_documents_file?.[0]?.filename || null], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: 'DB error',
        details: err
      });
    }
    res.json({
      success: true,
      lecturerId: result.insertId
    });
  });
});
module.exports = router;