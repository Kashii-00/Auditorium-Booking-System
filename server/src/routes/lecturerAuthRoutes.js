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
 * Forgot Password - Request Reset (Enhanced Security)
 * POST /api/lecturer-auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
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
      // Log failed attempt
      await db.queryPromise(
        'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        ['lecturer', 0, email, 'failed_attempt', clientIp, userAgent]
      );
      return res.status(200).json({ success: true, message: 'If your email is registered, you will receive reset instructions' });
    }
    
    const lecturer = lecturers[0];
    
    // Check for rate limiting - no more than 3 requests per hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    if (lecturer.last_reset_request && new Date(lecturer.last_reset_request) > oneHourAgo) {
      const timeLeft = Math.ceil((60 - (Date.now() - new Date(lecturer.last_reset_request).getTime()) / 60000));
      
      // Log rate limit attempt
      await db.queryPromise(
        'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        ['lecturer', lecturer.id, email, 'failed_attempt', clientIp, userAgent]
      );
      
      return res.status(429).json({ 
        error: `Too many password reset requests. Please try again in ${timeLeft} minutes.`,
        retryAfter: timeLeft * 60
      });
    }
    
    // Check if user has recently reset password (within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 86400000);
    if (lecturer.last_password_reset && new Date(lecturer.last_password_reset) > twentyFourHoursAgo) {
      // Log this attempt
      await db.queryPromise(
        'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        ['lecturer', lecturer.id, email, 'failed_attempt', clientIp, userAgent]
      );
      
      return res.status(400).json({ 
        error: 'You have recently reset your password. Please wait 24 hours before requesting another reset.',
        canRetryAt: new Date(new Date(lecturer.last_password_reset).getTime() + 86400000).toISOString()
      });
    }
    
    // Check if there's already a valid, unused token
    if (lecturer.reset_token && lecturer.reset_token_expires) {
      const tokenExpiry = new Date(lecturer.reset_token_expires);
      if (tokenExpiry > new Date()) {
        const timeLeft = Math.ceil((tokenExpiry.getTime() - Date.now()) / 60000);
        
        // Log duplicate request attempt
        await db.queryPromise(
          'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
          ['lecturer', lecturer.id, email, 'failed_attempt', clientIp, userAgent]
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
      `UPDATE lecturer_users 
       SET reset_token = ?, 
           reset_token_expires = ?, 
           last_reset_request = NOW(),
           reset_request_count = reset_request_count + 1 
       WHERE id = ?`,
      [resetToken, utcExpiryTime, lecturer.id]
    );
    
    // Log the password reset request
    await db.queryPromise(
      'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent, token_used) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['lecturer', lecturer.id, email, 'request', clientIp, userAgent, resetToken]
    );
    
    // Send password reset email
    const resetUrl = `http://localhost:3000/lecturer-reset-password?token=${resetToken}`;
    
    try {
      await sendEmail({
        to: email,
        subject: '🔐 Password Reset Request - MPMA Lecturer Portal',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
            <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: 800;">🔐 Password Reset</h1>
                <p style="color: #64748b; font-size: 16px; margin: 10px 0;">MPMA Lecturer Portal</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border-radius: 15px; padding: 25px; margin: 25px 0;">
                <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 15px 0;">Hello ${lecturer.full_name},</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                  We received a request to reset your password for your MPMA Lecturer Portal account.
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
                  © 2025 MPMA Lecturer Portal. This is an automated message.
                </p>
              </div>
            </div>
          </div>
        `
      });
      
      logger.info(`Password reset email sent successfully to lecturer: ${email}`);
      
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      
      // Clear the reset token if email failed
      await db.queryPromise(
        'UPDATE lecturer_users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [lecturer.id]
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
 * POST /api/lecturer-auth/reset-password
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
      SELECT * FROM lecturer_users 
      WHERE reset_token = ? 
      AND reset_token_expires > UTC_TIMESTAMP() 
      AND status = 'ACTIVE'
    `;
    
    const lecturers = await db.queryPromise(query, [token]);
    
    if (lecturers.length === 0) {
      // Log failed attempt
      await db.queryPromise(
        'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent, token_used) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['lecturer', 0, 'unknown', 'failed_attempt', clientIp, userAgent, token]
      );
      
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const lecturer = lecturers[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password, clear reset token, and track the reset
    await db.queryPromise(
      `UPDATE lecturer_users 
       SET password = ?, 
           is_temp_password = FALSE, 
           reset_token = NULL, 
           reset_token_expires = NULL, 
           last_password_reset = NOW(),
           password_reset_count = password_reset_count + 1,
           updated_at = NOW() 
       WHERE id = ?`,
      [hashedPassword, lecturer.id]
    );
    
    // Log successful password reset
    await db.queryPromise(
      'INSERT INTO password_reset_logs (user_type, user_id, email, action, ip_address, user_agent, token_used) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['lecturer', lecturer.id, lecturer.email, 'reset', clientIp, userAgent, token]
    );
    
    logger.info(`Password reset successfully completed for lecturer: ${lecturer.email}`);
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.',
      redirectTo: '/lecturer-login'
    });
    
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
      SELECT b.id, b.capacity, c.courseName,
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
             sb.batch_id,c.courseName,
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