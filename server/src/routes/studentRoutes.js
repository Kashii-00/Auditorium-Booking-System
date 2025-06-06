// routes/students.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const auth = require('../auth');
const logger = require('../logger');
const moment = require('moment');

// Ensure uploads directory exists
const baseUploadDir = path.join(__dirname, '../../uploads/students');
fs.mkdirSync(baseUploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = req.body.email
      ? path.join(baseUploadDir, req.body.email.replace(/[^a-zA-Z0-9]/g, '_'))
      : baseUploadDir;
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/;
    if (!allowed.test(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('Only images, PDFs, and Office docs allowed'));
    }
    cb(null, true);
  }
});

// Define upload fields
const uploadFields = upload.fields([
  { name: 'nic_document', maxCount: 1 },
  { name: 'passport_document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);

// Helper to parse JSON columns
function parseStudent(row) {
  if (row.driving_details) {
    try { row.driving_details = JSON.parse(row.driving_details); } catch {}    
  }
  return row;
}

// GET /students/courses
router.get('/courses', auth.authMiddleware, async (req, res) => {
  try {
    const sql = `SELECT id, courseId, courseName, stream FROM courses WHERE status = ? ORDER BY courseName`;
    const courses = await db.queryPromise(sql, ['Active']);
    res.json(courses);
  } catch (err) {
    logger.error('GET /students/courses', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /students
router.get('/', auth.authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT s.*,
        GROUP_CONCAT(DISTINCT c.courseName SEPARATOR ', ') AS enrolled_courses,
        (SELECT COUNT(*) FROM student_courses WHERE student_id = s.id) AS course_count,
        u.name AS created_by
      FROM students s
      LEFT JOIN student_courses sc ON s.id = sc.student_id
      LEFT JOIN courses c ON sc.course_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      GROUP BY s.id
      ORDER BY s.full_name
    `;
    const rows = await db.queryPromise(sql);
    res.json(rows.map(parseStudent));
  } catch (err) {
    logger.error('GET /students', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /students
router.post('/', auth.authMiddleware, uploadFields, async (req, res) => {
  let conn;
  try {
    // acquire connection
    conn = await db.getConnectionPromise();
    await conn.beginTransactionPromise();

    const data = req.body;
    // parse course_ids
    const courseIds = Array.isArray(data.course_ids) ? data.course_ids : JSON.parse(data.course_ids || '[]');
    if (!courseIds.length) return res.status(400).json({ error: 'At least one course required' });

    // insert student
    const sqlIns = `
      INSERT INTO students (
        full_name, email, identification_type, id_number, nationality,
        date_of_birth, country, cdc_number, address, department,
        company, sea_service, emergency_contact_name, emergency_contact_number,
        is_swimmer, is_slpa_employee, designation, division, service_no,
        section_unit, nic_document_path, passport_document_path, photo_path,
        driving_details, status, payment_status, created_by
      ) VALUES (${new Array(27).fill('?').join(',')})
    `;
    const files = req.files;
    const vals = [
      data.full_name, data.email, data.identification_type, data.id_number, data.nationality,
      data.date_of_birth, data.country||null, data.cdc_number||null, data.address, data.department||null,
      data.company||null, data.sea_service||null, data.emergency_contact_name, data.emergency_contact_number,
      data.is_swimmer?1:0, data.is_slpa_employee?1:0, data.designation||null, data.division||null, data.service_no||null,
      data.section_unit||null,
      files.nic_document?.[0].path||null,
      files.passport_document?.[0].path||null,
      files.photo?.[0].path||null,
      data.driving_details?JSON.stringify(data.driving_details):null,
      'Active', 'Pending', req.user.id
    ];
    const { insertId } = await conn.queryPromise(sqlIns, vals);

    // enroll courses
    for (let i=0; i<courseIds.length; i++) {
      await conn.queryPromise(
        `INSERT INTO student_courses (student_id,course_id,enrollment_date,primary_course,status)
         VALUES (?,?,CURDATE(),?,?)`,
        [insertId, courseIds[i], i===0?1:0, 'Active']
      );
    }

    await conn.commitPromise();
    res.status(201).json({ success:true, studentId: insertId });
  } catch (err) {
    if (conn) await conn.rollbackPromise();
    logger.error('POST /students', err);
    res.status(500).json({ error:'Failed to register', details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /students/:id
router.get('/:id', auth.authMiddleware, async (req, res) => {
  try {
    const [student] = await db.queryPromise('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Not found' });
    // parse JSON
    parseStudent(student);
    // courses
    student.courses = await db.queryPromise(
      `SELECT c.id,c.courseId,c.courseName,c.stream,sc.enrollment_date,sc.primary_course,sc.status
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = ? ORDER BY sc.primary_course DESC`,
      [req.params.id]
    );
    // batches
    student.batches = await db.queryPromise(
      `SELECT b.id,b.batch_name,b.start_date,b.end_date,sb.status,sb.enrollment_date,sb.attendance_percentage
       FROM student_batches sb
       JOIN batches b ON sb.batch_id=b.id
       WHERE sb.student_id = ? ORDER BY b.start_date DESC`,
      [req.params.id]
    );
    res.json(student);
  } catch (err) {
    logger.error('GET /students/:id', err);
    res.status(500).json({ error:'Database error' });
  }
});

// PUT /students/:id
router.put('/:id', auth.authMiddleware, uploadFields, async (req, res) => {
  let conn;
  try {
    conn = await db.getConnectionPromise();
    await conn.beginTransactionPromise();

    const data = req.body;
    const files = req.files;
    const fields = [];
    const vals = [];
    const mapField = (bodyKey, col) => {
      if (data[bodyKey] !== undefined) {
        fields.push(`${col} = ?`);
        vals.push(data[bodyKey]);
      }
    };
    ['full_name','email','identification_type','id_number','nationality',
     'date_of_birth','country','cdc_number','address','department',
     'company','sea_service','emergency_contact_name','emergency_contact_number',
     'designation','division','service_no','section_unit'].forEach(key => mapField(key,key));
    if (data.is_swimmer !== undefined) { fields.push('is_swimmer=?'); vals.push(data.is_swimmer?1:0); }
    if (data.is_slpa_employee !== undefined) { fields.push('is_slpa_employee=?'); vals.push(data.is_slpa_employee?1:0); }
    if (data.driving_details) { fields.push('driving_details=?'); vals.push(JSON.stringify(data.driving_details)); }
    // file paths
    if (files.nic_document) { fields.push('nic_document_path=?'); vals.push(files.nic_document[0].path); }
    if (files.passport_document) { fields.push('passport_document_path=?'); vals.push(files.passport_document[0].path); }
    if (files.photo) { fields.push('photo_path=?'); vals.push(files.photo[0].path); }
    if (fields.length) {
      fields.push('updated_at=NOW()');
      vals.push(req.params.id);
      await conn.queryPromise(`UPDATE students SET ${fields.join(',')} WHERE id = ?`, vals);
    }

    // update enrollments
    const courseIds = Array.isArray(data.course_ids)?data.course_ids:JSON.parse(data.course_ids||'[]');
    if (!courseIds.length) return res.status(400).json({error:'Courses required'});
    await conn.queryPromise('DELETE FROM student_courses WHERE student_id=?',[req.params.id]);
    for (let i=0;i<courseIds.length;i++) {
      await conn.queryPromise(
        `INSERT INTO student_courses (student_id,course_id,enrollment_date,primary_course,status)
         VALUES (?, ?, CURDATE(), ?, 'Active')`,
        [req.params.id, courseIds[i], i===0?1:0]
      );
    }

    await conn.commitPromise();
    res.json({ success:true, message:'Student updated' });
  } catch (err) {
    if (conn) await conn.rollbackPromise();
    logger.error('PUT /students/:id', err);
    res.status(500).json({ error:'Update failed', details:err.message });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /students/:id
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await db.getConnectionPromise();
    await conn.beginTransactionPromise();

    const del = await conn.queryPromise('DELETE FROM students WHERE id=?',[req.params.id]);
    if (del.affectedRows===0) return res.status(404).json({error:'Not found'});

    await conn.commitPromise();
    res.json({ success:true, message:'Student deleted' });
  } catch (err) {
    if (conn) await conn.rollbackPromise();
    logger.error('DELETE /students/:id', err);
    res.status(500).json({ error:'Delete failed', details:err.message });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
