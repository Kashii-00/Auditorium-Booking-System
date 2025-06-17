const nodemailer = require('nodemailer');
const logger = require('../logger');

// Email configuration
const transporter = nodemailer.createTransport({
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

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Plain text alternative (optional)
 * @returns {Promise} - Resolves when email sent, rejects on error
 */
const sendEmail = async (options) => {
  try {
    // If emails are disabled in development, log instead of sending
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_EMAILS === 'true') {
      logger.info('Email sending disabled in development. Would have sent:', {
        to: options.to,
        subject: options.subject,
      });
      return { success: true, info: { response: 'Email disabled in development' } };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Maritime Training Center" <no-reply@maritimetraining.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${info.response}`);
    return { success: true, info };
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
async function sendBasicEmail(to, subject, content) {
  return sendEmail({
    to,
    subject,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${content}</div>`,
    text: stripHtml(content)
  });
}

module.exports = {
  sendEmail,
  sendBasicEmail
};
