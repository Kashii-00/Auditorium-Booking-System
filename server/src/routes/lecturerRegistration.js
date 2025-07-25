// routes/lecturers.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const auth = require('../auth');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');

// Setup upload directory
const uploadDir = path.join(__dirname, '../../uploads/lecturers');
fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = req.body.email
      ? path.join(uploadDir, req.body.email.replace(/[^a-zA-Z0-9]/g, '_'))
      : uploadDir;
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 10*1024*1024 } });

// Generate a random temporary password
const generateTempPassword = () => {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// GET /lecturers/courses
router.get('/courses', auth.authMiddleware, async (req, res) => {
  try {
    const sql = 'SELECT id, courseName, courseId, stream FROM courses WHERE status = ? ORDER BY courseName';
    const courses = await db.queryPromise(sql, ['Active']);
    res.json(courses);
  } catch (err) {
    logger.error('GET /lecturers/courses', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /lecturers
router.get('/', auth.authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.id, 
        l.full_name, 
        l.email, 
        l.phone,
        l.id_number,
        l.status,
        l.category,
        l.created_at,
        GROUP_CONCAT(DISTINCT c.courseId SEPARATOR ', ') AS assigned_courses,
        GROUP_CONCAT(DISTINCT c.id SEPARATOR ',') AS course_ids,
        u.name AS created_by
      FROM lecturers l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN lecturer_courses lc ON lc.lecturer_id = l.id
      LEFT JOIN courses c ON lc.course_id = c.id
      GROUP BY l.id
      ORDER BY l.full_name;
    `;
    const list = await db.queryPromise(sql);
    res.json(list);
  } catch (err) {
    logger.error('GET /lecturers', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /lecturers
router.post('/', auth.authMiddleware,
  upload.fields([
    { name: 'nic_file' }, { name: 'photo_file' }, { name: 'passbook_file' },
    { name: 'education_certificate_file' }, { name: 'driving_trainer_license_file' },
    { name: 'other_documents_file' }, { name: 'cdc_book_file' }
  ]),

  // Multer file size error handling
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum allowed is 10MB per file." });
      }
      return res.status(400).json({ error: "Multer error: " + err.message });
    }
    if (err) {
      return res.status(500).json({ error: "Unknown upload error." });
    }
    next();
  },

  async (req, res) => {
    let conn;
    try {
      conn = await db.getConnectionPromise();
      await conn.beginTransactionPromise();

      // Updated field names to match frontend
      const {
        full_name, email, id_number,
        date_of_birth, address, phone, category,
        cdc_number, vehicle_number, status = 'Active',
        highest_qualification, other_qualifications, 
        bank_name, branch_name, account_number,
        work_experiences
      } = req.body;

      // Parse work experiences if provided
      let workExperiencesData = [];
      if (work_experiences) {
        try {
          workExperiencesData = JSON.parse(work_experiences);
        } catch (e) {
          logger.warn('Failed to parse work_experiences JSON:', e);
          workExperiencesData = [];
        }
      }

      // Validate required fields
      if (!full_name || !email || !id_number) {
        return res.status(400).json({ error: 'Full name, email, and ID number are required' });
      }

      // Insert lecturer
      const insertLec = `
        INSERT INTO lecturers
        (full_name,email,identification_type,id_number,date_of_birth,address,phone,
         category,cdc_number,vehicle_number,nic_file,photo_file,
         driving_trainer_license_file,status,user_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      const files = req.files || {};
      const params = [
        full_name, email, 'NIC', id_number,
        date_of_birth, address, phone, category,
        cdc_number || null, vehicle_number || null,
        files.nic_file?.[0]?.path || null,
        files.photo_file?.[0]?.path || null,
        files.driving_trainer_license_file?.[0]?.path || null,
        status, req.user.id
      ];
      const result = await conn.queryPromise(insertLec, params);
      const lecturerId = result.insertId;

      // Academic details
      const insAcad = `
        INSERT INTO lecturer_academic_details
        (lecturer_id,highest_qualification,other_qualifications,experience,education_certificate_file)
        VALUES (?,?,?,?,?)
      `;
      
      // Convert work experiences to the expected JSON format
      let experienceJson = "[]";
      if (workExperiencesData && workExperiencesData.length > 0) {
        const formattedExperiences = workExperiencesData.map(exp => ({
          institution: exp.institution || "",
          years: exp.start_year && exp.end_year && !exp.is_current 
            ? (parseInt(exp.end_year) - parseInt(exp.start_year)).toString()
            : exp.is_current 
              ? (new Date().getFullYear() - parseInt(exp.start_year)).toString()
              : "0",
          start: exp.start_year || "",
          end: exp.is_current ? "Present" : (exp.end_year || ""),
          designation: exp.position || "",
          nature: exp.department || ""
        }));
        experienceJson = JSON.stringify(formattedExperiences);
      }
      
      await conn.queryPromise(insAcad, [
        lecturerId,
        highest_qualification || null,
        other_qualifications || null,
        experienceJson,
        files.education_certificate_file?.[0]?.path || null
      ]);

      // Bank details
      const insBank = `
        INSERT INTO lecturer_bank_details
        (lecturer_id,bank_name,branch_name,account_number)
        VALUES (?,?,?,?)
      `;
      await conn.queryPromise(insBank, [
        lecturerId,
        bank_name || null,
        branch_name || null,
        account_number || null
      ]);

      // Courses mapping - handle course_ids array from frontend
      let courseIds = [];
      if (req.body.course_ids) {
        try {
          courseIds = JSON.parse(req.body.course_ids);
        } catch (e) {
          logger.warn('Failed to parse course_ids JSON:', e);
          courseIds = [];
        }
      }
      
      // Ensure we have at least one course
      if (courseIds.length === 0) {
        return res.status(400).json({ error: 'At least one course is required' });
      }
      
      for (let i = 0; i < courseIds.length; i++) {
        await conn.queryPromise(
          `INSERT INTO lecturer_courses
            (lecturer_id,course_id,primary_course)
           VALUES (?,?,?)`, [
            lecturerId,
            courseIds[i],
            i === 0 ? 1 : 0
          ]
        );
      }

      // Create lecturer user account with temporary password
      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      const insertLecturerUser = `
        INSERT INTO lecturer_users
        (lecturer_id, email, password, status, is_temp_password)
        VALUES (?, ?, ?, 'ACTIVE', TRUE)
      `;
      
      await conn.queryPromise(insertLecturerUser, [
        lecturerId,
        email,
        hashedPassword
      ]);
      
      // Send email with temporary password
      try {
        await sendEmail({
          to: email,
          subject: 'Welcome to Maritime Training Center - Your Lecturer Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #3b82f6;">Welcome to Maritime Training Center</h2>
              <p>Dear ${full_name},</p>
              <p>Your lecturer account has been successfully created. Here are your login credentials:</p>
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e0e0e0; padding: 5px 10px; border-radius: 3px; font-family: monospace;">${tempPassword}</code></p>
              </div>
              <p><strong>Important:</strong> You will be required to change this temporary password when you first log in.</p>
              <p>To access your account, please visit: <a href="http://localhost:5003/lecturer-login" style="color: #3b82f6;">Lecturer Portal</a></p>
              <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #dc2626;"><strong>Security Notice:</strong> Please keep your login credentials confidential. Do not share your password with anyone.</p>
              </div>
              <p>If you have any questions or need assistance, please contact our support team.</p>
              <p>Best regards,<br>Maritime Training Center Team</p>
            </div>
          `
        });
        logger.info(`Welcome email sent to lecturer: ${email}`);
      } catch (emailError) {
        logger.error('Failed to send lecturer welcome email:', emailError);
        // Don't fail the registration if email fails
      }

      await conn.commitPromise();
      res.status(201).json({ success: true, lecturerId });

    } catch (err) {
      if (conn) {
        try {
          await conn.rollbackPromise();
        } catch (rollbackErr) {
          logger.error('Error during rollback:', rollbackErr);
        }
      }
      logger.error('POST /lecturers', err);
      res.status(500).json({ error: 'Failed to register lecturer', details: err.message });
    } finally {
      if (conn) conn.release();
    }
  }
);

// PUT /lecturers/:id
router.put('/:id', auth.authMiddleware,
  (req, res, next) => {
    upload.fields([
      { name: 'nic_file' }, { name: 'photo_file' }, { name: 'passbook_file' },
      { name: 'education_certificate_file' }, { name: 'driving_trainer_license_file' },
      { name: 'other_documents_file' }, { name: 'cdc_book_file' }
    ])(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ 
              error: 'File size too large', 
              details: 'Maximum file size is 10MB', 
              field: err.field 
            });
          }
          return res.status(400).json({ error: err.message });
        }
        return next(err);
      }
      next();
    });
  },
  async (req, res) => {
    const conn = await db.getConnectionPromise();
    try {
      await conn.beginTransactionPromise();

      // Updated field names to match frontend
      const {
        full_name, email, id_number,
        date_of_birth, address, phone, category,
        cdc_number, vehicle_number, status = 'Active',
        highest_qualification, other_qualifications, 
        bank_name, branch_name, account_number,
        work_experiences
      } = req.body;

      // Parse work experiences if provided
      let workExperiencesData = [];
      if (work_experiences) {
        try {
          workExperiencesData = JSON.parse(work_experiences);
        } catch (e) {
          logger.warn('Failed to parse work_experiences JSON:', e);
          workExperiencesData = [];
        }
      }

      // First, get the current lecturer data to preserve existing file paths if no new files uploaded
      const [currentLecturer] = await conn.queryPromise(
        'SELECT nic_file, photo_file, driving_trainer_license_file FROM lecturers WHERE id = ?', 
        [req.params.id]
      );

      // Update lecturer with conditional file paths
      const files = req.files || {};
      const updateLec = `
        UPDATE lecturers
        SET full_name = ?, email = ?, identification_type = ?, id_number = ?,
            date_of_birth = ?, address = ?, phone = ?, category = ?,
            cdc_number = ?, vehicle_number = ?, status = ?,
            ${files.nic_file ? 'nic_file = ?,' : ''}
            ${files.photo_file ? 'photo_file = ?,' : ''}
            ${files.driving_trainer_license_file ? 'driving_trainer_license_file = ?,' : ''}
            updated_at = NOW()
        WHERE id = ?
      `;

      // Build params array based on whether files were uploaded
      const params = [
        full_name, email, 'NIC', id_number,
        date_of_birth, address, phone, category,
        cdc_number || null, vehicle_number || null, status
      ];
      if (files.nic_file) params.push(files.nic_file[0].path);
      if (files.photo_file) params.push(files.photo_file[0].path);
      if (files.driving_trainer_license_file) params.push(files.driving_trainer_license_file[0].path);
      params.push(req.params.id);

      await conn.queryPromise(updateLec, params);

      // Academic details - get current to preserve existing files
      const [currentAcademicDetails] = await conn.queryPromise(
        'SELECT education_certificate_file FROM lecturer_academic_details WHERE lecturer_id = ?', 
        [req.params.id]
      );

      // Delete existing academic details
      await conn.queryPromise('DELETE FROM lecturer_academic_details WHERE lecturer_id = ?', [req.params.id]);

      // Insert updated academic details
      const insAcad = `
        INSERT INTO lecturer_academic_details
        (lecturer_id, highest_qualification, other_qualifications, experience, education_certificate_file)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      // Convert work experiences to the expected JSON format
      let experienceJson = "[]";
      if (workExperiencesData && workExperiencesData.length > 0) {
        const formattedExperiences = workExperiencesData.map(exp => ({
          institution: exp.institution || "",
          years: exp.start_year && exp.end_year && !exp.is_current 
            ? (parseInt(exp.end_year) - parseInt(exp.start_year)).toString()
            : exp.is_current 
              ? (new Date().getFullYear() - parseInt(exp.start_year)).toString()
              : "0",
          start: exp.start_year || "",
          end: exp.is_current ? "Present" : (exp.end_year || ""),
          designation: exp.position || "",
          nature: exp.department || ""
        }));
        experienceJson = JSON.stringify(formattedExperiences);
      }
      
      await conn.queryPromise(insAcad, [
        req.params.id,
        highest_qualification || null,
        other_qualifications || null,
        experienceJson,
        files.education_certificate_file ? files.education_certificate_file[0].path : 
          (currentAcademicDetails ? currentAcademicDetails.education_certificate_file : null)
      ]);

      // Bank details
      // Delete existing bank details
      await conn.queryPromise('DELETE FROM lecturer_bank_details WHERE lecturer_id = ?', [req.params.id]);

      // Insert updated bank details
      const insBank = `
        INSERT INTO lecturer_bank_details
        (lecturer_id, bank_name, branch_name, account_number)
        VALUES (?, ?, ?, ?)
      `;
      
      await conn.queryPromise(insBank, [
        req.params.id,
        bank_name || null,
        branch_name || null,
        account_number || null
      ]);

      // Courses mapping
      await conn.queryPromise(
        `DELETE FROM lecturer_courses WHERE lecturer_id = ?`, [req.params.id]
      );
      
      // Handle course_ids array from frontend
      let courseIds = [];
      if (req.body.course_ids) {
        try {
        courseIds = JSON.parse(req.body.course_ids);
        } catch (e) {
          logger.warn('Failed to parse course_ids JSON:', e);
        courseIds = [];
        }
      }
      
      for (let i = 0; i < courseIds.length; i++) {
        await conn.queryPromise(
          `INSERT INTO lecturer_courses
            (lecturer_id, course_id, primary_course)
           VALUES (?, ?, ?)`, [
            req.params.id,
            courseIds[i],
            i === 0 ? 1 : 0
          ]
        );
      }

      await conn.commitPromise();
      res.json({ success: true });

    } catch (err) {
      await conn.rollbackPromise();
      logger.error('PUT /lecturers/:id', err);
      res.status(500).json({ error: 'Failed', details: err.message });
    } finally {
      conn.release();
    }
  }
);

// GET /lecturers/:id - Get a single lecturer with detailed information
router.get('/:id', auth.authMiddleware, async (req, res) => {
  try {
    // Get basic lecturer information
    const [lecturer] = await db.queryPromise(
      `SELECT l.* 
      FROM lecturers l
      WHERE l.id = ?`,
      [req.params.id]
    );
    
    if (!lecturer) {
      return res.status(404).json({ error: 'Lecturer not found' });
    }
    
    // Get academic details
    const [academicDetails] = await db.queryPromise(
      `SELECT * FROM lecturer_academic_details 
       WHERE lecturer_id = ?`,
      [req.params.id]
    );
    
    if (academicDetails) {
      lecturer.academicDetails = academicDetails;
      // Parse experience JSON if it exists
      if (academicDetails.experience) {
        try {
          academicDetails.experience = JSON.parse(academicDetails.experience);
        } catch (e) {
          logger.warn('Failed to parse experience JSON', e);
          academicDetails.experience = [];
        }
      }
    }
    
    // Get bank details
    const [bankDetails] = await db.queryPromise(
      `SELECT * FROM lecturer_bank_details 
       WHERE lecturer_id = ?`,
      [req.params.id]
    );
    
    if (bankDetails) {
      lecturer.bankDetails = bankDetails;
    }
    
    // Get course details - include primary course in lecturer object
    const courses = await db.queryPromise(
      `SELECT lc.*, c.courseName, c.courseId, c.stream as course_stream, c.medium, c.location
       FROM lecturer_courses lc
       JOIN courses c ON lc.course_id = c.id
       WHERE lc.lecturer_id = ?
       ORDER BY lc.primary_course DESC`,
      [req.params.id]
    );
    
    if (courses && courses.length > 0) {
      lecturer.courses = courses.map(course => ({
        id: course.course_id,
        courseId: course.courseId,
        courseName: course.courseName,
        stream: course.stream || course.course_stream,
        module: course.module,
        primary_course: course.primary_course,
        status: course.status
      }));
      
      // Set primary course info for backward compatibility
      const primaryCourse = courses.find(c => c.primary_course === 1) || courses[0];
      if (primaryCourse) {
        lecturer.course_id = primaryCourse.course_id;
        lecturer.stream = primaryCourse.stream || primaryCourse.course_stream;
        lecturer.module = primaryCourse.module;
      }
    } else {
      lecturer.courses = [];
      lecturer.stream = null;
      lecturer.module = null;
    }
    
    res.json(lecturer);
  } catch (err) {
    logger.error('GET /lecturers/:id', err);
    res.status(500).json({ error: 'Failed to retrieve lecturer data', details: err.message });
  }
});

// DELETE /lecturers/:id
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  const conn = await db.getConnectionPromise();
  try {
    await conn.beginTransactionPromise();

    // Delete from lecturer_users first (due to foreign key constraint)
    await conn.queryPromise(
      `DELETE FROM lecturer_users WHERE lecturer_id = ?`, [req.params.id]
    );

    // Delete from lecturer_courses
    await conn.queryPromise(
      `DELETE FROM lecturer_courses WHERE lecturer_id = ?`, [req.params.id]
    );

    // Delete from lecturer_academic_details
    await conn.queryPromise(
      `DELETE FROM lecturer_academic_details WHERE lecturer_id = ?`, [req.params.id]
    );

    // Delete from lecturer_bank_details
    await conn.queryPromise(
      `DELETE FROM lecturer_bank_details WHERE lecturer_id = ?`, [req.params.id]
    );

    // Delete from lecturers
    await conn.queryPromise(
      `DELETE FROM lecturers WHERE id = ?`, [req.params.id]
    );

    await conn.commitPromise();
    res.json({ success: true });

  } catch (err) {
    await conn.rollbackPromise();
    logger.error('DELETE /lecturers/:id', err);
    res.status(500).json({ error: 'Failed to delete lecturer', details: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
