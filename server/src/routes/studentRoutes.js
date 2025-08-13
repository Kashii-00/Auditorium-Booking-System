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
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');
const crypto = require('node:crypto');
const studentIdGenerator = require('../services/studentIdGenerator');

// Ensure uploads directory exists
const baseUploadDir = path.join(__dirname, '../uploads/students');
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

// Helper to generate a secure temporary password
function generateTemporaryPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// GET /students/courses
router.get('/courses', auth.authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  //console.log(`[${now}] GET /api/students/courses`);
  //console.log('GET params:', req.params);
  //console.log('GET query:', req.query);

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
  const now = new Date().toISOString();
  //console.log(`[${now}] GET /api/students`);
  //console.log('GET params:', req.params);
  //console.log('GET query:', req.query);

  try {
    const sql = `
      SELECT s.*,
        GROUP_CONCAT(DISTINCT c.courseId SEPARATOR ', ') AS enrolled_courses,
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
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/students`);

  let conn;
  try {
    // acquire connection
    conn = await db.getConnectionPromise();
    await conn.beginTransactionPromise();

    const data = req.body;
    // parse course_ids
    const courseIds = Array.isArray(data.course_ids) ? data.course_ids : JSON.parse(data.course_ids || '[]');
    if (!courseIds.length) return res.status(400).json({ error: 'At least one course required' });

    // Convert string booleans to actual booleans
    const isSwimmer = data.is_swimmer === 'true' || data.is_swimmer === true;
    const isSlpaEmployee = data.is_slpa_employee === 'true' || data.is_slpa_employee === true;

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
    // Handle email field - convert "null" string to actual null
    const emailValue = data.email === "null" || data.email === "" ? null : data.email;
    
    const vals = [
      data.full_name, emailValue, data.identification_type, data.id_number, data.nationality,
      data.date_of_birth, data.country||null, data.cdc_number||null, data.address, data.department||null,
      data.company||null, data.sea_service||null, data.emergency_contact_name, data.emergency_contact_number,
      isSwimmer ? 1 : 0, isSlpaEmployee ? 1 : 0, data.designation||null, data.division||null, data.service_no||null,
      data.section_unit||null,
      files.nic_document?.[0].path||null,
      files.passport_document?.[0].path||null,
      files.photo?.[0].path||null,
      data.driving_details ? JSON.stringify(typeof data.driving_details === 'string' ? JSON.parse(data.driving_details) : data.driving_details) : null,
      'Active', 'Pending', req.user.id
    ];
    const { insertId } = await conn.queryPromise(sqlIns, vals);

    // enroll courses (no student codes yet - those are assigned when student joins a batch)
    for (let i=0; i<courseIds.length; i++) {
      const courseId = courseIds[i];
      const isPrimary = i === 0; // First course is primary
      
      // Insert course enrollment WITHOUT student code
      await conn.queryPromise(
        `INSERT INTO student_courses (student_id,course_id,enrollment_date,primary_course,status)
         VALUES (?,?,CURDATE(),?,?)`,
        [insertId, courseId, isPrimary ? 1 : 0, 'Active']
      );
      
      console.log(`Enrolled student in course ${courseId}`);
    }

    // Create student login credentials with temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Insert into student_users table (only if email is provided)
    if (emailValue) {
      await conn.queryPromise(
        `INSERT INTO student_users (student_id, email, password, is_temp_password, status)
         VALUES (?, ?, ?, TRUE, 'ACTIVE')`,
        [insertId, emailValue, hashedPassword]
      );
    }

    // Get enrolled courses for welcome email
    const enrolledCourses = await conn.queryPromise(
      `SELECT c.courseName, c.courseId, c.duration, c.fees 
       FROM courses c 
       JOIN student_courses sc ON c.id = sc.course_id 
       WHERE sc.student_id = ?`,
      [insertId]
    );

    await conn.commitPromise();
    
    // Send welcome email WITHOUT login credentials (only if email is provided)
    if (emailValue) {
      try {
        const coursesListHtml = enrolledCourses.map(course => 
          `<li style="margin: 5px 0;"><strong>${course.courseName}</strong> (${course.courseId}) - ${course.duration}</li>`
        ).join('');

        const emailResult = await sendEmail({
          to: emailValue,
          subject: 'Welcome to Mahapola Ports & Maritime Academy - Registration Successful',
          userType: 'student',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #1e40af; margin: 0; font-size: 20px;">Mahapola Ports & Maritime Academy</h2>
              </div>

              <p style="font-size: 16px; margin-bottom: 15px;">Dear <strong>${data.full_name}</strong>,</p>
              <p style="font-size: 16px; margin-bottom: 15px;">Your student registration has been completed successfully.</p>
              
              <!-- Registration Details -->
              <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #1e40af;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Registration Details</h3>
                <p style="margin: 5px 0;"><strong>Student ID:</strong> ${insertId}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${emailValue}</p>
                <p style="margin: 5px 0;"><strong>Identification:</strong> ${data.identification_type} - ${data.id_number}</p>
              </div>

              <!-- Enrolled Courses -->
              <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9;">
                <h3 style="color: #0c4a6e; margin: 0 0 10px 0; font-size: 16px;">Enrolled Courses</h3>
                <ul style="margin: 8px 0; padding-left: 20px;">
                  ${coursesListHtml}
                </ul>
              </div>

              <p style="font-size: 16px; margin: 20px 0;">If you have any questions or need assistance, please contact our support team.</p>
              <p style="font-size: 16px; margin: 20px 0;">Thank you for choosing Mahapola Ports & Maritime Academy!</p>
              
              <!-- Footer -->
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; margin: 0; font-size: 14px;">Best regards,<br><strong>Mahapola Ports & Maritime Academy Team</strong></p>
              </div>
            </div>
          `
        });
        
        if (emailResult.success) {
          logger.info(`Welcome email sent to student: ${emailValue}`);
        } else {
          logger.warn(`Welcome email could not be sent to: ${emailValue}, but registration completed successfully`);
        }
      } catch (emailErr) {
        logger.error('Failed to send welcome email:', emailErr);
        // Continue despite email failure - don't fail the registration
      }
    } else {
      logger.info(`Student registered without email: ${data.full_name} (ID: ${insertId})`);
    }

    console.log(`Student registered successfully with ID: ${insertId}`);
    res.status(201).json({ 
      success: true, 
      studentId: insertId, 
      message: `Student registered successfully with ID: ${insertId}` 
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollbackPromise();
      } catch (rollbackErr) {
        logger.error('Error during rollback:', rollbackErr);
      }
    }
    logger.error('POST /students', err);
    res.status(500).json({ error: 'Failed to register student', details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /students/:id
router.get('/:id', auth.authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/students/:id`);
  console.log('GET params:', req.params);
  //console.log('GET query:', req.query);

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
      `SELECT b.id,b.start_date,b.end_date,sb.status,sb.enrollment_date,sb.attendance_percentage
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
  const now = new Date().toISOString();
  console.log(`[${now}] PUT /api/students/:id`);
  console.log('GET params:', req.params);

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
        // Handle email field - convert "null" string to actual null
        if (bodyKey === 'email') {
          const emailValue = data[bodyKey] === "null" || data[bodyKey] === "" ? null : data[bodyKey];
          fields.push(`${col} = ?`);
          vals.push(emailValue);
        } else {
          fields.push(`${col} = ?`);
          vals.push(data[bodyKey]);
        }
      }
    };
    ['full_name','email','identification_type','id_number','nationality',
     'date_of_birth','country','cdc_number','address','department',
     'company','sea_service','emergency_contact_name','emergency_contact_number',
     'designation','division','service_no','section_unit'].forEach(key => mapField(key,key));
    
    // Convert string booleans to actual booleans for update
    if (data.is_swimmer !== undefined) { 
      const isSwimmer = data.is_swimmer === 'true' || data.is_swimmer === true;
      fields.push('is_swimmer=?'); 
      vals.push(isSwimmer ? 1 : 0); 
    }
    if (data.is_slpa_employee !== undefined) { 
      const isSlpaEmployee = data.is_slpa_employee === 'true' || data.is_slpa_employee === true;
      fields.push('is_slpa_employee=?'); 
      vals.push(isSlpaEmployee ? 1 : 0); 
    }
    if (data.driving_details) { 
      fields.push('driving_details=?'); 
      vals.push(JSON.stringify(typeof data.driving_details === 'string' ? JSON.parse(data.driving_details) : data.driving_details)); 
    }
    // file paths
    if (files.nic_document) { fields.push('nic_document_path=?'); vals.push(files.nic_document[0].path); }
    if (files.passport_document) { fields.push('passport_document_path=?'); vals.push(files.passport_document[0].path); }
    if (files.photo) { fields.push('photo_path=?'); vals.push(files.photo[0].path); }
    
    if (fields.length) {
      fields.push('updated_at=CURRENT_TIMESTAMP()');
      const sql = `UPDATE students SET ${fields.join(',')} WHERE id=?`;
      vals.push(req.params.id);
      await conn.queryPromise(sql, vals);
    }

    // update enrollments
    const courseIds = Array.isArray(data.course_ids) ? data.course_ids : JSON.parse(data.course_ids || '[]');
    if (!courseIds.length) {
      return res.status(400).json({ error: 'At least one course required' });
    }
    
    // Get current course enrollments
    const currentEnrollments = await conn.queryPromise(
      'SELECT course_id, primary_course FROM student_courses WHERE student_id=?',
      [req.params.id]
    );
    
    // Track which courses to add, update, or keep as is
    const currentCourseIds = currentEnrollments.map(e => e.course_id);
    const newCourseIds = courseIds.filter(id => !currentCourseIds.includes(id));
    const removedCourseIds = currentCourseIds.filter(id => !courseIds.includes(id));
    
    // Remove courses not in the updated list
    if (removedCourseIds.length) {
      await conn.queryPromise(
        'DELETE FROM student_courses WHERE student_id=? AND course_id IN (?)',
        [req.params.id, removedCourseIds]
      );
    }
    
    // Add new courses
    for (let i=0; i<newCourseIds.length; i++) {
      const isPrimary = !currentEnrollments.length && i === 0;
      await conn.queryPromise(
        `INSERT INTO student_courses (student_id, course_id, enrollment_date, primary_course, status)
         VALUES (?, ?, CURDATE(), ?, ?)`,
        [req.params.id, newCourseIds[i], isPrimary ? 1 : 0, 'Active']
      );
    }
    
    // Update primary course if specified
    if (data.primary_course_id) {
      // First, set all to non-primary
      await conn.queryPromise(
        'UPDATE student_courses SET primary_course=0 WHERE student_id=?',
        [req.params.id]
      );
      
      // Then set the specified one as primary
      await conn.queryPromise(
        'UPDATE student_courses SET primary_course=1 WHERE student_id=? AND course_id=?',
        [req.params.id, data.primary_course_id]
      );
    }
    
    await conn.commitPromise();
    res.json({ success: true });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollbackPromise();
      } catch (rollbackErr) {
        logger.error('Error during rollback:', rollbackErr);
      }
    }
    logger.error('PUT /students/:id', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /students/:id
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/students/:id`);
  console.log('DELETE params:', req.params);

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

// POST /students/:id/send-credentials - Send login credentials manually
router.post('/:id/send-credentials', auth.authMiddleware, async (req, res) => {
  try {
    // Get student details
    const student = await db.queryPromise(
      `SELECT s.*, su.email as user_email, su.password, su.is_temp_password
       FROM students s
       LEFT JOIN student_users su ON s.id = su.student_id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!student.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = student[0];

    // Check if student has a valid email address
    if (!studentData.email || studentData.email === 'null' || studentData.email === null || studentData.email.trim() === '') {
      return res.status(400).json({ error: 'Student does not have a valid email address' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentData.email)) {
      return res.status(400).json({ error: 'Student email address is not valid' });
    }

    // Check if student already has login credentials
    const existingUser = await db.queryPromise(
      'SELECT id, password, email, created_at FROM student_users WHERE student_id = ?',
      [req.params.id]
    );

    if (existingUser.length > 0 && existingUser[0].password) {
      // Student already has credentials - suggest password reset instead
      return res.status(400).json({ 
        error: 'Credentials already exist', 
        message: 'Login credentials have already been sent to this student. If the student needs access, please use "Password Reset" instead.',
        hasCredentials: true,
        createdAt: existingUser[0].created_at
      });
    }

    // Create or update student credentials (first time or email updated)
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    if (existingUser.length > 0) {
      // Update existing record (email was updated)
      await db.queryPromise(
        'UPDATE student_users SET email = ?, password = ?, is_temp_password = TRUE, updated_at = NOW() WHERE student_id = ?',
        [studentData.email, hashedPassword, req.params.id]
      );
    } else {
      // Create new student_users entry (first time)
      await db.queryPromise(
        'INSERT INTO student_users (student_id, email, password, is_temp_password) VALUES (?, ?, ?, TRUE)',
        [req.params.id, studentData.email, hashedPassword]
      );
    }

    // Send email with login credentials
    const emailResult = await sendEmail({
      to: studentData.email,
      subject: 'Mahapola Ports & Maritime Academy - Your Login Credentials',
      userType: 'student',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin: 0; font-size: 20px;">Mahapola Ports & Maritime Academy</h2>
          </div>

          <p style="font-size: 16px; margin-bottom: 15px;">Dear <strong>${studentData.full_name}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 15px;">Your login credentials for the Student Portal are ready:</p>
          
          <!-- Login Details -->
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${studentData.email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 5px 10px; border-radius: 3px; font-family: monospace; font-size: 14px;">${tempPassword}</code></p>
          </div>

          <p style="font-size: 16px; margin: 20px 0;">You will be required to change this password on your first login. Keep your credentials confidential and do not share them with anyone. If you encounter any issues, contact our support team immediately.</p>
          <p style="font-size: 16px; margin: 20px 0;">If you have any questions or need assistance, please contact our support team.</p>
          
          <!-- Footer -->
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Best regards,<br><strong>Mahapola Ports & Maritime Academy Team</strong></p>
          </div>
        </div>
      `
    });

    if (emailResult.success) {
      logger.info(`Login credentials created and sent to student: ${studentData.email} by user: ${req.user.id}`);
      res.json({ 
        success: true, 
        message: 'Login credentials created and sent successfully' 
      });
    } else {
      logger.error(`Failed to send login credentials to: ${studentData.email}`);
      res.status(500).json({ error: 'Failed to send email' });
    }



  } catch (error) {
    logger.error('Send credentials error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /students/:id/send-password-reset - Send password reset email manually
router.post('/:id/send-password-reset', auth.authMiddleware, async (req, res) => {
  try {
    // Get student details
    const student = await db.queryPromise(
      `SELECT s.*, su.email as user_email, su.id as user_id
       FROM students s
       LEFT JOIN student_users su ON s.id = su.student_id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!student.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = student[0];

    // Check if student has login credentials
    if (!studentData.user_id) {
      return res.status(400).json({ error: 'Student does not have login credentials yet' });
    }

    // Generate new temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update password in database
    await db.queryPromise(
      'UPDATE student_users SET password = ?, is_temp_password = TRUE, updated_at = NOW() WHERE student_id = ?',
      [hashedPassword, req.params.id]
    );

    // Send password reset email
    const emailResult = await sendEmail({
      to: studentData.email,
      subject: 'Mahapola Ports & Maritime Academy - Password Reset',
      userType: 'student',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin: 0; font-size: 20px;">Mahapola Ports & Maritime Academy</h2>
          </div>

          <p style="font-size: 16px; margin-bottom: 15px;">Dear <strong>${studentData.full_name}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 15px;">Your password has been reset as requested by our administrative team.</p>
          
          <!-- New Login Details -->
          <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
            <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">New Login Details</h3>
            <p style="margin: 5px 0;"><strong>Student Portal:</strong> <a href="${process.env.CLIENT_URL || 'https://mpmaerp.slpa.lk'}/student-login" style="color: #dc2626;">Click here to login</a></p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${studentData.email}</p>
            <p style="margin: 5px 0;"><strong>New Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 5px 10px; border-radius: 3px; font-family: monospace; font-size: 14px;">${tempPassword}</code></p>
          </div>

          <p style="font-size: 16px; margin: 20px 0;">You must change this temporary password when you first log in. For security reasons, this password is only valid for your next login. If you did not request this reset, please contact support immediately.</p>
          <p style="font-size: 16px; margin: 20px 0;">If you have any questions or need assistance, please contact our support team.</p>
          
          <!-- Footer -->
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Best regards,<br><strong>Mahapola Ports & Maritime Academy Team</strong></p>
          </div>
        </div>
      `
    });

    if (emailResult.success) {
      logger.info(`Password reset email sent to student: ${studentData.email} by user: ${req.user.id}`);
      res.json({ 
        success: true, 
        message: 'Password reset email sent successfully' 
      });
    } else {
      logger.error(`Failed to send password reset email to: ${studentData.email}`);
      res.status(500).json({ error: 'Failed to send email' });
    }

  } catch (error) {
    logger.error('Send password reset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
