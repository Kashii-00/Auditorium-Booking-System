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
 * Forgot Password - Request Reset (Enhanced Security)
 * POST /api/student-auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
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
      // Log failed attempt
      await db.queryPromise(
        'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        ['student', 0, email, 'failed_attempt', clientIp, userAgent]
      );
      return res.status(200).json({ success: true, message: 'If your email is registered, you will receive reset instructions' });
    }
    
    const student = students[0];
    
    // Check for rate limiting - no more than 3 requests per hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    if (student.last_reset_request && new Date(student.last_reset_request) > oneHourAgo) {
      const timeLeft = Math.ceil((60 - (Date.now() - new Date(student.last_reset_request).getTime()) / 60000));
      
      // Log rate limit attempt
      await db.queryPromise(
        'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        ['student', student.id, email, 'failed_attempt', clientIp, userAgent]
      );
      
      return res.status(429).json({ 
        error: `Too many password reset requests. Please try again in ${timeLeft} minutes.`,
        retryAfter: timeLeft * 60
      });
    }
    
    // Check if user has recently reset password (within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 86400000);
    if (student.last_password_reset && new Date(student.last_password_reset) > twentyFourHoursAgo) {
      // Log this attempt
      await db.queryPromise(
        'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        ['student', student.id, email, 'failed_attempt', clientIp, userAgent]
      );
      
      return res.status(400).json({ 
        error: 'You have recently reset your password. Please wait 24 hours before requesting another reset.',
        canRetryAt: new Date(new Date(student.last_password_reset).getTime() + 86400000).toISOString()
      });
    }
    
    // Check if there's already a valid, unused token
    if (student.reset_token && student.reset_token_expires) {
      const tokenExpiry = new Date(student.reset_token_expires);
      if (tokenExpiry > new Date()) {
        const timeLeft = Math.ceil((tokenExpiry.getTime() - Date.now()) / 60000);
        
        // Log duplicate request attempt
        await db.queryPromise(
          'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
          ['student', student.id, email, 'failed_attempt', clientIp, userAgent]
        );
        
        return res.status(400).json({ 
          error: `A password reset email was already sent. Please check your email or wait ${timeLeft} minutes for the link to expire.`,
          expiresIn: timeLeft * 60
        });
      }
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Update tracking fields and save reset token to database
    const utcExpiryTime = resetTokenExpiry.toISOString().slice(0, 19).replace('T', ' ');
    await db.queryPromise(
      `UPDATE student_users 
       SET reset_token = ?, 
           reset_token_expires = ?, 
           last_reset_request = NOW(),
           reset_request_count = reset_request_count + 1 
       WHERE id = ?`,
      [resetToken, utcExpiryTime, student.id]
    );
    
    // Log the password reset request
    await db.queryPromise(
      'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent, token_used) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['student', student.id, email, 'request', clientIp, userAgent, resetToken]
    );
    
    // Send password reset email
    const resetUrl = `http://localhost:3000/student-reset-password?token=${resetToken}`;
    
    try {
      await sendEmail({
        to: email,
        subject: '🔐 Password Reset Request - MPMA Student Portal',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: 800;">🔐 Password Reset</h1>
                <p style="color: #64748b; font-size: 16px; margin: 10px 0;">MPMA Student Portal</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border-radius: 15px; padding: 25px; margin: 25px 0;">
                <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 15px 0;">Hello ${student.full_name},</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                  We received a request to reset your password for your MPMA Student Portal account.
                </p>
                <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0;">
                  ⚠️ This link will expire in 1 hour for security reasons.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); transition: all 0.3s ease;">
                  🔑 Reset My Password
                </a>
              </div>
              
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin: 25px 0;">
                <p style="color: #b91c1c; font-size: 14px; margin: 0; font-weight: 600;">
                  🚨 Security Notice: If you didn't request this password reset, please ignore this email. Your account remains secure.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">
                  © 2025 MPMA Student Portal. This is an automated message.
                </p>
              </div>
            </div>
          </div>
        `
      });
      
      logger.info(`Password reset email sent successfully to student: ${email}`);
      
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      
      // Clear the reset token if email failed
      await db.queryPromise(
        'UPDATE student_users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [student.id]
      );
      
      return res.status(500).json({ error: 'Failed to send password reset email. Please try again later.' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Password reset instructions have been sent to your email',
      expiresIn: 3600 // 1 hour in seconds
    });
    
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Reset Password with Token (Enhanced Security)
 * POST /api/student-auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
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
      AND reset_token_expires > UTC_TIMESTAMP() 
      AND status = 'ACTIVE'
    `;
    
    const students = await db.queryPromise(query, [token]);
    
    if (students.length === 0) {
      // Log failed attempt
      await db.queryPromise(
        'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent, token_used) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['student', 0, 'unknown', 'failed_attempt', clientIp, userAgent, token]
      );
      
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const student = students[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password, clear reset token, and track the reset
    await db.queryPromise(
      `UPDATE student_users 
       SET password = ?, 
           is_temp_password = FALSE, 
           reset_token = NULL, 
           reset_token_expires = NULL, 
           last_password_reset = NOW(),
           password_reset_count = password_reset_count + 1,
           updated_at = NOW() 
       WHERE id = ?`,
      [hashedPassword, student.id]
    );
    
    // Log successful password reset
    await db.queryPromise(
      'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent, token_used) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['student', student.id, student.email, 'reset', clientIp, userAgent, token]
    );
    
    logger.info(`Password reset successfully completed for student: ${student.email}`);
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.',
      redirectTo: '/student-login'
    });
    
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
      SELECT b.id, as batchName, c.courseName, 
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
             c.courseName,
      FROM payments p
      JOIN batches b ON p.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `;
    
    const payments = await db.queryPromise(paymentsQuery, [studentId]);
    
    // Get pending fees
    const pendingFeesQuery = `
      SELECT b.id as batch_id, c.courseName, c.fee as course_fee,
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

// Fix in change-password endpoint: use studentId from token
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

/**
 * Request Password Change OTP
 * POST /api/student-auth/request-password-change-otp
 */
router.post('/request-password-change-otp', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found in token' });
    }
    
    // Get student information
    const students = await db.queryPromise(
      'SELECT s.*, u.email FROM students s JOIN student_users u ON s.id = u.student_id WHERE s.id = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = students[0];
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    // Store OTP in database (update student_users table) - use UTC time format
    const utcExpiryTime = new Date(otpExpiry).toISOString().slice(0, 19).replace('T', ' ');
    await db.queryPromise(
      'UPDATE student_users SET reset_otp = ?, reset_otp_expires = ? WHERE student_id = ?',
      [otp, utcExpiryTime, studentId]
    );
    
    // Send OTP email
    const emailResult = await sendEmail({
      to: student.email,
      subject: 'Password Change Verification Code - Maritime Training Center',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6;">Password Change Request</h2>
          <p>Dear ${student.full_name},</p>
          <p>You have requested to change your password. Please use the verification code below:</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #1e40af; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #ef4444;">This code will expire in 10 minutes.</p>
          <p>If you did not request this password change, please ignore this email and contact support immediately.</p>
          <p>Thank you,<br>Maritime Training Center Team</p>
        </div>
      `
    });
    
    if (emailResult.success) {
      logger.info(`Password change OTP sent to student: ${student.email}`);
      res.json({ success: true, message: 'Verification code sent to your email' });
    } else {
      logger.error(`Failed to send password change OTP to: ${student.email}`);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
    
  } catch (error) {
    logger.error('Request password change OTP error:', error);
    res.status(500).json({ error: 'Server error' });
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
    
    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'OTP and new password are required' });
    }
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found in token' });
    }
    
    // Get student user with OTP info
    const users = await db.queryPromise(
      'SELECT * FROM student_users WHERE student_id = ?',
      [studentId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const user = users[0];
    
    // Check if OTP exists and is not expired
    if (!user.reset_otp) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }
    
    // Compare times properly - database now stores UTC time
    const now = Date.now(); // Current time in UTC milliseconds
    const expiryTime = new Date(user.reset_otp_expires + 'Z').getTime(); // Add Z to ensure UTC interpretation
    
    if (now > expiryTime) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }
    
    // Verify OTP
    if (user.reset_otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear OTP fields
    await db.queryPromise(
      'UPDATE student_users SET password = ?, is_temp_password = FALSE, reset_otp = NULL, reset_otp_expires = NULL, updated_at = NOW() WHERE student_id = ?',
      [hashedPassword, studentId]
    );
    
    logger.info(`Password changed successfully for student ID: ${studentId}`);
    res.json({ success: true, message: 'Password changed successfully' });
    
  } catch (error) {
    logger.error('Verify OTP and change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export both the router and the middleware for use in other files
module.exports = {
  studentAuthRouter: router,
  studentAuthMiddleware
};