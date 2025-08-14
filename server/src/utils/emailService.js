const logger = require('../logger');
const MicrosoftGraphService = require('../services/microsoftGraphService');

// Initialize Microsoft Graph Service
let graphService = null;

try {
  graphService = new MicrosoftGraphService();
  logger.info('Microsoft Graph email service initialized 📧');
} catch (error) {
  logger.error('Microsoft Graph initialization failed:', error);
  throw new Error('Microsoft Graph service is required but failed to initialize');
}

/**
 * Send an email using Microsoft Graph
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
    // Check if emails are disabled globally
    if (process.env.DISABLE_EMAILS === 'true') {
      logger.info('Email sending disabled. Would have sent:', {
        to: options.to,
        subject: options.subject,
        userType: options.userType || 'general'
      });
      return { success: true, info: { response: 'Email disabled' } };
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

    // Use Microsoft Graph service
    if (!graphService) {
      throw new Error('Microsoft Graph service not available');
    }

    logger.info(`Sending email via Microsoft Graph to: ${options.to}`);
    return await graphService.sendEmail(options);

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
  return sendEmail({
    to: toEmail,
    subject: 'Microsoft Graph Email Test - ' + new Date().toLocaleString(),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Microsoft Graph Email Test</h2>
        <p>This is a test email sent using Microsoft Graph API.</p>
        <p><strong>Message:</strong> ${testMessage}</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>✅ Microsoft Graph Integration Working!</strong></p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Sent on: ${new Date().toLocaleString()}
        </p>
      </div>
    `,
    text: `Microsoft Graph Email Test\n\n${testMessage}\n\nSent on: ${new Date().toLocaleString()}`,
    userType: 'general'
  });
}

module.exports = {
  sendEmail,
  sendBasicEmail,
  testGraphConnection,
  sendTestEmail,
  graphService,
  emailProvider: 'graph'
};
