const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Validate transporter connection
transporter.verify().then(() => {
  logger.info('Email server connection established');
}).catch(err => {
  logger.error('Email server connection failed:', err);
});

// Generate a random password of specified length

// Send welcome email with temporary password
const sendWelcomeEmail = async (email, fullName, tempPassword) => {
  try {
    const mailOptions = {
      from: `"SLPA Training Institute" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to SLPA Training Institute Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1e40af;">Welcome to SLPA Training Institute</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5;">Dear ${fullName},</p>
          
          <p style="font-size: 16px; line-height: 1.5;">Thank you for registering with SLPA Training Institute. Your student account has been created successfully.</p>
          
          <p style="font-size: 16px; line-height: 1.5;">Please use the following credentials to log in to your student portal:</p>
          
          <div style="background-color: #f5f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5;">For security reasons, you will be required to change your password upon first login.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5003'}/student-login" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Student Portal</a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">If you have any questions, please contact our support team.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    return false;
  }
};

// Create student login credentials when they register
const createStudentCredentials = async (studentId, email, fullName) => {
  const conn = await db.getConnectionPromise();
  
  try {
    await conn.beginTransactionPromise();
    
    // Generate a temporary password
    const tempPassword = generateTempPassword(10);
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    
    // Check if the student already has credentials
    const [existingCredentials] = await conn.queryPromise(
      'SELECT id FROM student_users WHERE student_id = ? OR email = ?',
      [studentId, email]
    );
    
    if (existingCredentials) {
      // Update existing credentials
      await conn.queryPromise(
        'UPDATE student_users SET password = ?, is_temp_password = TRUE, status = "ACTIVE", updated_at = NOW() WHERE student_id = ?',
        [hashedPassword, studentId]
      );
    } else {
      // Create new credentials
      await conn.queryPromise(
        'INSERT INTO student_users (student_id, email, password, is_temp_password) VALUES (?, ?, ?, TRUE)',
        [studentId, email, hashedPassword]
      );
    }
    
    await conn.commitPromise();
    
    // Send welcome email with credentials
    await sendWelcomeEmail(email, fullName, tempPassword);
    
    return true;
  } catch (error) {
    await conn.rollbackPromise();
    logger.error('Error creating student credentials:', error);
    return false;
  } finally {
    conn.release();
  }
};

// Student login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get student user by email
    const [student] = await db.queryPromise(
      `SELECT su.*, s.full_name, s.id_number, s.identification_type, s.photo_path
       FROM student_users su
       JOIN students s ON su.student_id = s.id
       WHERE su.email = ? AND su.status = 'ACTIVE'`,
      [email]
    );
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, student.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student.id,
        student_id: student.student_id,
        email: student.email,
        role: 'student'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { 
        id: student.id,
        student_id: student.student_id,
        email: student.email
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Prepare user data (excluding sensitive fields)
    const userData = {
      id: student.id,
      student_id: student.student_id,
      email: student.email,
      full_name: student.full_name,
      identification_type: student.identification_type,
      id_number: student.id_number,
      photo_path: student.photo_path,
      is_temp_password: student.is_temp_password === 1 || student.is_temp_password === true
    };
    
    // Return token and user data
    res.json({
      success: true,
      token,
      refreshToken,
      user: userData
    });
  } catch (error) {
    logger.error('Student login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if student exists
    const [student] = await db.queryPromise(
      `SELECT su.id, su.student_id, s.full_name 
       FROM student_users su
       JOIN students s ON su.student_id = s.id
       WHERE su.email = ? AND su.status = 'ACTIVE'`,
      [email]
    );
    
    if (!student) {
      // Don't reveal that the email doesn't exist for security reasons
      return res.json({ success: true, message: 'If your email exists in our system, you will receive a password reset link.' });
    }
    
    // Generate a temporary password
    const tempPassword = generateTempPassword(10);
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    
    // Update the password
    await db.queryPromise(
      'UPDATE student_users SET password = ?, is_temp_password = TRUE, updated_at = NOW() WHERE id = ?',
      [hashedPassword, student.id]
    );
    
    // Send reset email
    await sendPasswordResetEmail(email, student.full_name, tempPassword);
    
    res.json({ success: true, message: 'Password reset instructions sent to your email' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// Password reset email
const sendPasswordResetEmail = async (email, fullName, tempPassword) => {
  try {
    const mailOptions = {
      from: `"SLPA Training Institute" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset - SLPA Training Institute Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1e40af;">Password Reset</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5;">Dear ${fullName},</p>
          
          <p style="font-size: 16px; line-height: 1.5;">We received a request to reset your password for the SLPA Training Institute Student Portal.</p>
          
          <p style="font-size: 16px; line-height: 1.5;">Your new temporary password is:</p>
          
          <div style="background-color: #f5f7ff; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p style="margin: 5px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">${tempPassword}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5;">For security reasons, you will be required to change your password upon login.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5003'}/student-login" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Student Portal</a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">If you did not request a password reset, please contact our support team immediately.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    return false;
  }
};

// Change password route
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Get student user by email
    const [student] = await db.queryPromise(
      'SELECT * FROM student_users WHERE email = ? AND status = "ACTIVE"',
      [email]
    );
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    await db.queryPromise(
      'UPDATE student_users SET password = ?, is_temp_password = FALSE, updated_at = NOW() WHERE id = ?',
      [hashedPassword, student.id]
    );
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Server error during password change' });
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }
    
    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      
      // Get student user
      const [student] = await db.queryPromise(
        'SELECT * FROM student_users WHERE id = ? AND status = "ACTIVE"',
        [decoded.id]
      );
      
      if (!student) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Generate new JWT token
      const newToken = jwt.sign(
        { 
          id: student.id,
          student_id: student.student_id,
          email: student.email,
          role: 'student'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      res.json({
        success: true,
        token: newToken
      });
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ error: 'Server error during token refresh' });
  }
});

// Helper function to generate a temporary password
function generateTempPassword(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  // Ensure at least one uppercase, one lowercase, one number, and one special character
  password += charset.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += charset.charAt(26 + Math.floor(Math.random() * 26)); // Lowercase
  password += charset.charAt(52 + Math.floor(Math.random() * 10)); // Number
  password += charset.charAt(62 + Math.floor(Math.random() * 10)); // Special
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Student auth middleware
function authMiddleware(req, res, next) {
  const token = req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
}

module.exports = router;
