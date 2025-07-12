const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { sendEmail } = require('../utils/emailService');
const crypto = require('crypto');

/**
 * Generate JWT tokens for lecturer authentication
 */
const generateTokens = (lecturer) => {
  // Access token - short lived (15 minutes)
  const accessToken = jwt.sign(
    { id: lecturer.id, email: lecturer.email, role: 'lecturer' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15m' }
  );
  
  // Refresh token - longer lived (7 days)
  const refreshToken = jwt.sign(
    { id: lecturer.id, tokenVersion: lecturer.tokenVersion || 0 },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Middleware to verify lecturer JWT token
 */
const lecturerAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    // Check for lecturerId instead of role
    if (!decoded.lecturerId) {
      return res.status(403).json({ error: 'Not authorized as lecturer' });
    }
    req.lecturer = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', tokenExpired: true });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Lecturer Login
 * POST /api/lecturer-auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Query lecturer_users table to find the lecturer
    const users = await db.queryPromise(
      'SELECT u.id, u.lecturer_id, u.email, u.password, u.is_temp_password, u.status, l.full_name FROM lecturer_users u JOIN lecturers l ON u.lecturer_id = l.id WHERE u.email = ?', 
      [email]
    );
    
    // Check if we got any results
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Account is inactive or suspended' });
    }
    
    // Check password
    if (!user.password) {
      logger.error(`Missing password for lecturer user: ${user.id}, email: ${email}`);
      return res.status(500).json({ error: 'Authentication error: Invalid account setup' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate tokens with role included
    const token = jwt.sign(
      { lecturerId: user.lecturer_id, lecturerUserId: user.id, email: user.email, role: 'lecturer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { lecturerId: user.lecturer_id, email: user.email, role: 'lecturer' },
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );
    
    // Update last login
    await db.queryPromise(
      'UPDATE lecturer_users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Return user data and tokens
    res.json({
      token,
      refreshToken,
      user: {
        id: user.lecturer_id,
        lecturerUserId: user.id,
        email: user.email,
        full_name: user.full_name,
        is_temp_password: !!user.is_temp_password
      }
    });
    
  } catch (error) {
    logger.error('Lecturer login error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

/**
 * Change Password
 * POST /api/lecturer-auth/change-password
 */
router.post('/change-password', lecturerAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Get lecturer user account
    const query = 'SELECT * FROM lecturer_users WHERE id = ?';
    const lecturers = await db.queryPromise(query, [req.lecturer.lecturerUserId]);
    
    if (lecturers.length === 0) {
      return res.status(404).json({ error: 'Lecturer account not found' });
    }
    
    const lecturer = lecturers[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, lecturer.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear temporary flag
    await db.queryPromise(
      'UPDATE lecturer_users SET password = ?, is_temp_password = FALSE, updated_at = NOW() WHERE id = ?',
      [hashedPassword, req.lecturer.lecturerUserId]
    );
    
    res.json({ success: true, message: 'Password changed successfully' });
    
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Refresh Token
 * POST /api/lecturer-auth/refresh-token
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key'
    );
    
    // Check if the lecturer exists and is active
    const [users] = await db.queryPromise(
      'SELECT lu.id, lu.lecturer_id, lu.email, l.full_name FROM lecturer_users lu ' +
      'JOIN lecturers l ON lu.lecturer_id = l.id ' +
      'WHERE lu.lecturer_id = ? AND lu.status = ?',
      [decoded.lecturerId, 'ACTIVE']
    );
    
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Create a new access token
    const newToken = jwt.sign(
      { lecturerId: decoded.lecturerId, lecturerUserId: users[0].id, email: decoded.email, role: 'lecturer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token: newToken
    });
    
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`, error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * Forgot Password - Request Reset
 * POST /api/lecturer-auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if lecturer exists
    const query = `
      SELECT lu.*, l.full_name
      FROM lecturer_users lu
      JOIN lecturers l ON lu.lecturer_id = l.id
      WHERE lu.email = ? AND lu.status = 'ACTIVE'
    `;
    
    const lecturers = await db.queryPromise(query, [email]);
    
    // For security, don't reveal if email exists or not
    if (lecturers.length === 0) {
      return res.status(200).json({ success: true, message: 'If your email is registered, you will receive reset instructions' });
    }
    
    const lecturer = lecturers[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save reset token to database
    await db.queryPromise(
      'UPDATE lecturer_users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, lecturer.id]
    );
    
    // Send password reset email
    const resetUrl = `http://localhost:5003/lecturer-reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Password Reset - Maritime Training Center',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6;">Password Reset Request</h2>
          <p>Dear ${lecturer.full_name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Your Password</a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.</p>
          <p>Thank you,<br>Maritime Training Center Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'If your email is registered, you will receive reset instructions' 
    });
    
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Reset Password with Token
 * POST /api/lecturer-auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Find user with this token and check if it's expired
    const query = `
      SELECT * FROM lecturer_users 
      WHERE reset_token = ? 
      AND reset_token_expires > NOW() 
      AND status = 'ACTIVE'
    `;
    
    const lecturers = await db.queryPromise(query, [token]);
    
    if (lecturers.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const lecturer = lecturers[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    await db.queryPromise(
      `UPDATE lecturer_users 
       SET password = ?, 
           is_temp_password = FALSE, 
           reset_token = NULL, 
           reset_token_expires = NULL, 
           updated_at = NOW() 
       WHERE id = ?`,
      [hashedPassword, lecturer.id]
    );
    
    res.json({ success: true, message: 'Password has been reset successfully' });
    
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get Lecturer Profile
 * GET /api/lecturer-auth/profile
 */
router.get('/profile', lecturerAuthMiddleware, async (req, res) => {
  try {
    // Get the lecturer ID from the decoded token
    const lecturerId = req.lecturer.lecturerId;
    
    if (!lecturerId) {
      return res.status(400).json({ error: 'Lecturer ID not found in token' });
    }
    
    // Query to get lecturer information with joined data
    const query = `
      SELECT l.*, lu.email, lu.is_temp_password,
             lad.highest_qualification, lad.other_qualifications, lad.experience,
             lbd.bank_name, lbd.branch_name, lbd.account_number
      FROM lecturers l 
      JOIN lecturer_users lu ON l.id = lu.lecturer_id 
      LEFT JOIN lecturer_academic_details lad ON l.id = lad.lecturer_id
      LEFT JOIN lecturer_bank_details lbd ON l.id = lbd.lecturer_id
      WHERE l.id = ?
    `;
    
    const lecturers = await db.queryPromise(query, [lecturerId]);
    
    if (lecturers.length === 0) {
      return res.status(404).json({ error: 'Lecturer not found' });
    }
    
    const lecturer = lecturers[0];
    
    // Get courses the lecturer is teaching with student counts
    const coursesQuery = `
      SELECT c.id, c.courseName, c.courseId, c.stream, c.status,
             lc.primary_course, lc.module, lc.assignment_date,
             COALESCE(course_stats.total_students, 0) as student_count,
             COALESCE(course_stats.avg_completion, 0) as completion_percentage
      FROM lecturer_courses lc
      JOIN courses c ON lc.course_id = c.id
      LEFT JOIN (
        SELECT 
          b.course_id,
          SUM(COALESCE(sb_count.student_count, 0)) as total_students,
          AVG(CASE 
            WHEN DATEDIFF(NOW(), b.start_date) <= 0 THEN 0
            WHEN DATEDIFF(b.end_date, NOW()) <= 0 THEN 100
            ELSE ROUND((DATEDIFF(NOW(), b.start_date) / DATEDIFF(b.end_date, b.start_date)) * 100)
          END) as avg_completion
        FROM batches b
        JOIN lecturer_batches lb ON b.id = lb.batch_id
        LEFT JOIN (
          SELECT batch_id, COUNT(*) as student_count
          FROM student_batches 
          WHERE status = 'Active'
          GROUP BY batch_id
        ) sb_count ON b.id = sb_count.batch_id
        WHERE lb.lecturer_id = ? AND lb.status IN ('Assigned', 'Active')
        GROUP BY b.course_id
      ) course_stats ON course_stats.course_id = c.id
      WHERE lc.lecturer_id = ? AND lc.status = 'Active'
    `;
    
    const courses = await db.queryPromise(coursesQuery, [lecturerId, lecturerId]);
    
    // Get batches the lecturer is assigned to
    const batchesQuery = `
      SELECT b.id, b.batch_name, b.capacity, c.courseName,
             b.start_date, b.end_date, b.status, b.location,
             lb.module, lb.hours_assigned, lb.payment_rate,
             (SELECT COUNT(*) FROM student_batches WHERE batch_id = b.id) as enrolled_students
      FROM lecturer_batches lb
      JOIN batches b ON lb.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE lb.lecturer_id = ? AND lb.status IN ('Assigned', 'Active')
      ORDER BY b.start_date DESC
    `;
    
    const batches = await db.queryPromise(batchesQuery, [lecturerId]);
    
    // Parse experience if it's a JSON string
    let experience = [];
    try {
      experience = lecturer.experience ? JSON.parse(lecturer.experience) : [];
    } catch (e) {
      experience = [];
    }
    
    // Format the response
    const lecturerData = {
      id: lecturer.id,
      full_name: lecturer.full_name,
      email: lecturer.email,
      phone: lecturer.phone,
      address: lecturer.address,
      date_of_birth: lecturer.date_of_birth,
      id_number: lecturer.id_number,
      category: lecturer.category,
      cdc_number: lecturer.cdc_number,
      vehicle_number: lecturer.vehicle_number,
      is_temp_password: lecturer.is_temp_password,
      status: lecturer.status,
      academic_details: {
        highest_qualification: lecturer.highest_qualification,
        other_qualifications: lecturer.other_qualifications,
        experience: experience
      },
      bank_details: {
        bank_name: lecturer.bank_name,
        branch_name: lecturer.branch_name,
        account_number: lecturer.account_number
      },
      courses: courses.map(course => ({
        id: course.id,
        courseId: course.courseId,
        courseName: course.courseName,
        stream: course.stream,
        primary_course: course.primary_course === 1,
        module: course.module,
        assignment_date: course.assignment_date,
        status: course.status,
        student_count: course.student_count || 0,
        enrolledStudents: course.student_count || 0, // Add alias for frontend compatibility
        completion_percentage: Math.round(course.completion_percentage || 0),
        progress: Math.round(course.completion_percentage || 0) // Add alias for frontend compatibility
      })),
      batches: batches.map(batch => ({
        id: batch.id,
        batch_name: batch.batch_name,
        courseName: batch.courseName,
        start_date: batch.start_date,
        end_date: batch.end_date,
        status: batch.status,
        location: batch.location,
        capacity: batch.capacity,
        enrolled_students: batch.enrolled_students,
        module: batch.module,
        hours_assigned: batch.hours_assigned,
        payment_rate: batch.payment_rate
      }))
    };
    
    res.json(lecturerData);
  } catch (error) {
    logger.error('Error fetching lecturer profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get lecturer's students
 * GET /api/lecturer-auth/students
 */
router.get('/students', lecturerAuthMiddleware, async (req, res) => {
  try {
    const lecturerId = req.lecturer.lecturerId;
    const { batchId, courseId } = req.query;
    
    let query = `
      SELECT DISTINCT s.id, s.full_name, s.email, s.emergency_contact_number as phone, s.id_number,
             sb.batch_id, b.batch_name, c.courseName,
             sb.attendance_percentage, sb.status as enrollment_status
      FROM students s
      JOIN student_batches sb ON s.id = sb.student_id
      JOIN batches b ON sb.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      JOIN lecturer_batches lb ON b.id = lb.batch_id
      WHERE lb.lecturer_id = ?
    `;
    
    const params = [lecturerId];
    
    if (batchId) {
      query += ' AND b.id = ?';
      params.push(batchId);
    }
    
    if (courseId) {
      query += ' AND c.id = ?';
      params.push(courseId);
    }
    
    query += ' ORDER BY s.full_name';
    
    const students = await db.queryPromise(query, params);
    
    res.json(students);
  } catch (error) {
    logger.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
module.exports.lecturerAuthMiddleware = lecturerAuthMiddleware; 