const nodemailer = require('nodemailer');
const logger = require('../logger');
const MicrosoftGraphService = require('../services/microsoftGraphService');

// Determine email provider
const emailProvider = process.env.EMAIL_PROVIDER || 'nodemailer';

// Initialize email services
let transporter = null;
let graphService = null;

if (emailProvider === 'graph') {
  try {
    graphService = new MicrosoftGraphService();
    logger.info('Microsoft Graph email service initialized');
  } catch (error) {
    logger.error('Microsoft Graph initialization failed:', error);
    logger.info('Falling back to nodemailer');
  }
} 

if (!graphService || emailProvider === 'nodemailer') {
  // Email configuration for nodemailer
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add these options for better compatibility with various email providers
    tls: {
      rejectUnauthorized: false
    }
  });

  // Test connection on startup
  transporter.verify(function (error) {
    if (error) {
      logger.error('Email service configuration error:', error);
    } else {
      logger.info('Email server connection successful');
    }
  });
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Plain text alternative (optional)
 * @param {string} options.userType - User type ('student', 'lecturer', or 'general') for email control (optional)
 * @returns {Promise} - Resolves when email sent, rejects on error
 */
const sendEmail = async (options) => {
  try {
    // Check if emails are disabled globally in development
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_EMAILS === 'true') {
      logger.info('Email sending disabled in development. Would have sent:', {
        to: options.to,
        subject: options.subject,
        userType: options.userType || 'general'
      });
      return { success: true, info: { response: 'Email disabled in development' } };
    }

    // Check user-specific email controls
    const userType = options.userType || 'general';
    
    if (userType === 'student' && process.env.DISABLE_STUDENT_EMAILS === 'true') {
      logger.info('Student email sending disabled. Would have sent:', {
        to: options.to,
        subject: options.subject,
        userType: 'student'
      });
      return { success: true, info: { response: 'Student emails disabled' } };
    }
    
    if (userType === 'lecturer' && process.env.DISABLE_LECTURER_EMAILS === 'true') {
      logger.info('Lecturer email sending disabled. Would have sent:', {
        to: options.to,
        subject: options.subject,
        userType: 'lecturer'
      });
      return { success: true, info: { response: 'Lecturer emails disabled' } };
    }

    // Use Microsoft Graph if available, otherwise fallback to nodemailer
    if (graphService) {
      logger.info(`Sending email via Microsoft Graph to: ${options.to}`);
      return await graphService.sendEmail(options);
    } else if (transporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Maritime Training Center" <no-reply@maritimetraining.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || stripHtml(options.html),
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent via nodemailer to ${options.to}: ${info.response}`);
      return { success: true, info };
    } else {
      throw new Error('No email service available');
    }
  } catch (error) {
    logger.error('Email sending failed:', error);
    // Don't throw the error - return failure status instead
    return { success: false, error };
  }
};

// Helper to strip HTML for plain text alternative
function stripHtml(html) {
  return html.replace(/<[^>]*>?/gm, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

// Simple function to send basic emails
async function sendBasicEmail(to, subject, content, userType = 'general') {
  return sendEmail({
    to,
    subject,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${content}</div>`,
    text: stripHtml(content),
    userType
  });
}

// Test Microsoft Graph connection
async function testGraphConnection() {
  if (!graphService) {
    return { success: false, error: 'Microsoft Graph service not initialized' };
  }
  return await graphService.testConnection();
}

// Send test email
async function sendTestEmail(toEmail, testMessage) {
  if (!graphService) {
    return { success: false, error: 'Microsoft Graph service not initialized' };
  }
  return await graphService.sendTestEmail(toEmail, testMessage);
}

module.exports = {
  sendEmail,
  sendBasicEmail,
  testGraphConnection,
  sendTestEmail,
  graphService,
  emailProvider
};
