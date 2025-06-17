const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { sendEmail } = require('../utils/emailService');
const crypto = require('crypto');

/**
 * Generate JWT tokens for student authentication
 */
const generateTokens = (student) => {
  // Access token - short lived (15 minutes)
  const accessToken = jwt.sign(
    { id: student.id, email: student.email, role: 'student' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15m' }
  );
  
  // Refresh token - longer lived (7 days)
  const refreshToken = jwt.sign(
    { id: student.id, tokenVersion: student.tokenVersion || 0 },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Middleware to verify student JWT token
 */
const studentAuthMiddleware = (req, res, next) => {
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
    
    // Check for studentId instead of role
    if (!decoded.studentId) {
      return res.status(403).json({ error: 'Not authorized as student' });
    }
    req.student = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', tokenExpired: true });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Student Login
 * POST /api/student-auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Query student_users table to find the student
    const users = await db.queryPromise(
      'SELECT u.id, u.student_id, u.email, u.password, u.is_temp_password, u.status, s.full_name FROM student_users u JOIN students s ON u.student_id = s.id WHERE u.email = ?', 
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
      logger.error(`Missing password for student user: ${user.id}, email: ${email}`);
      return res.status(500).json({ error: 'Authentication error: Invalid account setup' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate tokens with role included
    const token = jwt.sign(
      { studentId: user.student_id, email: user.email, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { studentId: user.student_id, email: user.email, role: 'student' },
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );
    
    // Return user data and tokens
    res.json({
      token,
      refreshToken,
      user: {
        id: user.student_id,
        email: user.email,
        full_name: user.full_name,
        is_temp_password: !!user.is_temp_password
      }
    });
    
  } catch (error) {
    logger.error('Student login error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

/**
 * Change Password
 * POST /api/student-auth/change-password
 */
router.post('/change-password', studentAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Get student user account
    const query = 'SELECT * FROM student_users WHERE student_id = ?';
    const students = await db.queryPromise(query, [req.student.studentId]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student account not found' });
    }
    
    const student = students[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, student.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear temporary flag
    await db.queryPromise(
      'UPDATE student_users SET password = ?, is_temp_password = FALSE, updated_at = NOW() WHERE student_id = ?',
      [hashedPassword, req.student.studentId] // Use studentId instead of id
    );
    
    res.json({ success: true, message: 'Password changed successfully' });
    
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Refresh Token
 * POST /api/student-auth/refresh-token
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
    
    // Check if the student exists and is active
    const [users] = await db.queryPromise(
      'SELECT su.student_id, su.email, s.full_name FROM student_users su ' +
      'JOIN students s ON su.student_id = s.id ' +
      'WHERE su.student_id = ? AND su.status = ?',
      [decoded.id, 'ACTIVE']
    );
    
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Create a new access token
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, type: 'student' },
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
 * POST /api/student-auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if student exists
    const query = `
      SELECT su.*, s.full_name
      FROM student_users su
      JOIN students s ON su.student_id = s.id
      WHERE su.email = ? AND su.status = 'ACTIVE'
    `;
    
    const students = await db.queryPromise(query, [email]);
    
    // For security, don't reveal if email exists or not
    if (students.length === 0) {
      return res.status(200).json({ success: true, message: 'If your email is registered, you will receive reset instructions' });
    }
    
    const student = students[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save reset token to database
    await db.queryPromise(
      'UPDATE student_users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, student.id]
    );
    
    // Send password reset email
    const resetUrl = `http://localhost:3000/student-reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Password Reset - Maritime Training Center',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6;">Password Reset Request</h2>
          <p>Dear ${student.full_name},</p>
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
 * POST /api/student-auth/reset-password
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
      SELECT * FROM student_users 
      WHERE reset_token = ? 
      AND reset_token_expires > NOW() 
      AND status = 'ACTIVE'
    `;
    
    const students = await db.queryPromise(query, [token]);
    
    if (students.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const student = students[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    await db.queryPromise(
      `UPDATE student_users 
       SET password = ?, 
           is_temp_password = FALSE, 
           reset_token = NULL, 
           reset_token_expires = NULL, 
           updated_at = NOW() 
       WHERE id = ?`,
      [hashedPassword, student.id]
    );
    
    res.json({ success: true, message: 'Password has been reset successfully' });
    
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get Student Profile
 * GET /api/student-auth/profile
 */
router.get('/profile', studentAuthMiddleware, async (req, res) => {
  try {
    // Get the student ID from the decoded token (set by middleware)
    const studentId = req.student.studentId;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found in token' });
    }
    
    // Query to get student information with joined data
    const query = `
      SELECT s.*, u.email, u.is_temp_password 
      FROM students s 
      JOIN student_users u ON s.id = u.student_id 
      WHERE s.id = ?
    `;
    
    const students = await db.queryPromise(query, [studentId]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = students[0];
    
    // Get courses the student is enrolled in
    const coursesQuery = `
      SELECT c.id, c.courseName, sc.primary_course, sc.status,
             sc.enrollment_date as enrollmentDate
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE sc.student_id = ?
    `;
    
    const courses = await db.queryPromise(coursesQuery, [studentId]);
    
    // Get batches the student is enrolled in with better sorting
    const batchesQuery = `
      SELECT b.id, b.batch_name as batchName, c.courseName, 
             b.start_date as startDate, b.end_date as endDate, 
             b.status, sb.enrollment_date as enrollmentDate,
             CASE
               WHEN b.start_date > CURDATE() THEN 'upcoming'
               WHEN b.end_date < CURDATE() THEN 'completed'
               ELSE 'active'
             END as batch_category
      FROM student_batches sb
      JOIN batches b ON sb.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE sb.student_id = ?
      ORDER BY 
        CASE
          WHEN b.start_date > CURDATE() THEN 0 -- Upcoming batches first
          WHEN b.end_date >= CURDATE() AND b.start_date <= CURDATE() THEN 1 -- Current batches second
          ELSE 2 -- Past batches last
        END,
        b.start_date ASC
    `;
    
    const batches = await db.queryPromise(batchesQuery, [studentId]);
    
    // Format the response
    const studentData = {
      ...student,
      courses: courses.map(course => ({
        id: course.id,
        courseName: course.courseName,
        course_type: course.primary_course ? 'primary' : 'secondary',
        primary: course.primary_course === 1,
        primary_course: course.primary_course === 1,
        status: course.status,
        enrollmentDate: course.enrollmentDate,
        // Add default values for financial information
        fee: course.fee || 0,
        amountPaid: course.amountPaid || 0,
        remainingFee: course.remainingFee || 0
      })),
      batches: batches.map(batch => ({
        id: batch.id,
        batchName: batch.batchName,
        courseName: batch.courseName,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status || 'Active',
        enrollmentDate: batch.enrollmentDate,
        attendancePercentage: batch.attendancePercentage || 0,
        category: batch.batch_category // Add category to identify upcoming/active/completed
      }))
    };
    
    res.json(studentData);
  } catch (error) {
    logger.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get student payments
 * GET /api/student-auth/payments
 */
router.get('/payments', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    // Get payments for the student
    const paymentsQuery = `
      SELECT p.id, p.amount, p.payment_date, p.status, p.payment_method,
             c.courseName, b.batch_name
      FROM payments p
      JOIN batches b ON p.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `;
    
    const payments = await db.queryPromise(paymentsQuery, [studentId]);
    
    // Get pending fees
    const pendingFeesQuery = `
      SELECT b.id as batch_id, b.batch_name, c.courseName, c.fee as course_fee,
             (SELECT COUNT(*) FROM student_batches WHERE batch_id = b.id) as student_count,
             (c.fee / (SELECT COUNT(*) FROM student_batches WHERE batch_id = b.id)) as fee_per_student,
             COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = ? AND batch_id = b.id), 0) as paid_amount
      FROM student_batches sb
      JOIN batches b ON sb.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE sb.student_id = ?
    `;
    
    const pendingFees = await db.queryPromise(pendingFeesQuery, [studentId, studentId]);
    
    res.json({
      payments: payments,
      pendingFees: pendingFees.map(fee => ({
        ...fee,
        remainingFee: fee.fee_per_student - fee.paid_amount
      }))
    });
  } catch (error) {
    logger.error('Error fetching student payments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Make payment
 * POST /api/student-auth/payments
 */
router.post('/payments', studentAuthMiddleware, async (req, res) => {
  let conn;
  try {
    const { batchId, amount, paymentMethod } = req.body;
    const studentId = req.student.studentId;
    
    if (!batchId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Batch ID, amount, and payment method are required' });
    }
    
    conn = await db.getConnectionPromise();
    await conn.beginTransactionPromise();
    
    // Insert payment record
    const insertQuery = `
      INSERT INTO payments (student_id, batch_id, amount, payment_date, status, payment_method)
      VALUES (?, ?, ?, NOW(), 'COMPLETED', ?)
    `;
    
    const result = await conn.queryPromise(insertQuery, [studentId, batchId, amount, paymentMethod]);
    
    await conn.commitPromise();
    
    res.status(201).json({ 
      success: true, 
      message: 'Payment recorded successfully',
      paymentId: result.insertId
    });
  } catch (error) {
    if (conn) await conn.rollbackPromise().catch(() => {});
    logger.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * Request OTP for Password Change
 * POST /api/student-auth/request-password-change-otp
 */
router.post('/request-password-change-otp', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    // Get student information
    const query = `
      SELECT su.*, s.full_name
      FROM student_users su
      JOIN students s ON su.student_id = s.id
      WHERE su.student_id = ? AND su.status = 'ACTIVE'
    `;
    
    const students = await db.queryPromise(query, [studentId]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student account not found' });
    }
    
    const student = students[0];
    
    // Generate OTP (6-digit code)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Use MySQL's NOW() function to ensure timezone consistency
    // This adds 10 minutes to the current database time
    const otpExpiryQuery = 'SELECT DATE_ADD(NOW(), INTERVAL 10 MINUTE) as expiry_time';
    const expiryResult = await db.queryPromise(otpExpiryQuery);
    const otpExpiry = expiryResult[0].expiry_time;
    
    // Log OTP generation details
    logger.info(`Generated OTP ${otp} for student ${studentId}, expires at ${otpExpiry}`);
    
    // Save OTP to database (using reset_token field temporarily)
    await db.queryPromise(
      'UPDATE student_users SET reset_token = ?, reset_token_expires = ? WHERE student_id = ?',
      [otp, otpExpiry, studentId]
    );
    
    // Verify the OTP was saved correctly
    const verifyQuery = 'SELECT reset_token, reset_token_expires FROM student_users WHERE student_id = ?';
    const verifyResult = await db.queryPromise(verifyQuery, [studentId]);
    logger.info(`OTP verification after save:`, verifyResult[0]);
    
    // Send OTP email
    await sendEmail({
      to: student.email,
      subject: 'Password Change Verification - Maritime Training Center',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6;">Password Change Verification</h2>
          <p>Dear ${student.full_name},</p>
          <p>You have requested to change your password. Please use the following one-time code to verify your identity:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
            </div>
          </div>
          <p>This code will expire in 10 minutes for security reasons.</p>
          <p>If you didn't request this password change, please ignore this email and your password will remain unchanged.</p>
          <p>Thank you,<br>Maritime Training Center Team</p>
        </div>
      `
    });
    
    logger.info(`OTP sent to student ${studentId} for password change`);
    
    res.json({ 
      success: true, 
      message: 'Verification code has been sent to your email' 
    });
    
  } catch (error) {
    logger.error('Request password change OTP error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * Verify OTP and Change Password
 * POST /api/student-auth/verify-otp-change-password
 */
router.post('/verify-otp-change-password', studentAuthMiddleware, async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const studentId = req.student.studentId;
    
    logger.info(`OTP verification attempt for student ${studentId} with OTP: ${otp}`);
    
    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'Verification code and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // First, let's check what's stored in the database
    const debugQuery = `
      SELECT student_id, reset_token, reset_token_expires, status,
             NOW() as server_time,
             CASE 
               WHEN reset_token_expires > NOW() THEN 'valid'
               ELSE 'expired'
             END as token_status
      FROM student_users 
      WHERE student_id = ?
    `;
    
    const debugResults = await db.queryPromise(debugQuery, [studentId]);
    logger.info('Debug - Student OTP data:', debugResults[0]);
    
    // Find user with this OTP and check if it's expired
    const query = `
      SELECT * FROM student_users 
      WHERE student_id = ? 
      AND reset_token = ? 
      AND reset_token_expires > NOW() 
      AND status = 'ACTIVE'
    `;
    
    const students = await db.queryPromise(query, [studentId, otp]);
    
    if (students.length === 0) {
      // Log more details about why it failed
      const checkQuery = `
        SELECT 
          CASE 
            WHEN reset_token IS NULL THEN 'No OTP found'
            WHEN reset_token != ? THEN 'OTP mismatch'
            WHEN reset_token_expires <= NOW() THEN 'OTP expired'
            WHEN status != 'ACTIVE' THEN 'Account not active'
            ELSE 'Unknown error'
          END as failure_reason,
          reset_token as stored_otp,
          reset_token_expires,
          NOW() as server_time
        FROM student_users 
        WHERE student_id = ?
      `;
      
      const failureDetails = await db.queryPromise(checkQuery, [otp, studentId]);
      logger.error('OTP verification failed:', failureDetails[0]);
      
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    const student = students[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear OTP
    await db.queryPromise(
      `UPDATE student_users 
       SET password = ?, 
           is_temp_password = FALSE, 
           reset_token = NULL, 
           reset_token_expires = NULL, 
           updated_at = NOW() 
       WHERE student_id = ?`,
      [hashedPassword, studentId]
    );
    
    logger.info(`Password changed successfully for student ${studentId}`);
    
    res.json({ success: true, message: 'Password has been changed successfully' });
    
  } catch (error) {
    logger.error('Verify OTP and change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * Debug endpoint to check OTP status - REMOVE IN PRODUCTION
 * GET /api/student-auth/debug-otp-status
 */
router.get('/debug-otp-status', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    const query = `
      SELECT 
        student_id,
        reset_token as current_otp,
        reset_token_expires as otp_expires_at,
        NOW() as current_server_time,
        TIMESTAMPDIFF(SECOND, NOW(), reset_token_expires) as seconds_until_expiry,
        CASE 
          WHEN reset_token IS NULL THEN 'No OTP set'
          WHEN reset_token_expires <= NOW() THEN 'OTP expired'
          ELSE 'OTP valid'
        END as otp_status
      FROM student_users 
      WHERE student_id = ?
    `;
    
    const result = await db.queryPromise(query, [studentId]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({
      debug_info: result[0],
      note: 'This is a debug endpoint - remove in production'
    });
    
  } catch (error) {
    logger.error('Debug OTP status error:', error);
    res.status(500).json({ error: 'Failed to get OTP status' });
  }
});

/**
 * Change Password (Legacy - with current password)
 * POST /api/student-auth/change-password
 * Keep this for backwards compatibility
 */
router.post('/change-password', studentAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Get student user account
    const query = 'SELECT * FROM student_users WHERE student_id = ?';
    const students = await db.queryPromise(query, [req.student.studentId]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student account not found' });
    }
    
    const student = students[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, student.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password with correct field (studentId)
    await db.queryPromise(
      'UPDATE student_users SET password = ?, is_temp_password = FALSE, updated_at = NOW() WHERE student_id = ?',
      [hashedPassword, req.student.studentId]
    );
    
    res.json({ success: true, message: 'Password changed successfully' });
    
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export both the router and the middleware for use in other files
module.exports = {
  studentAuthRouter: router,
  studentAuthMiddleware
};
