const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailService");
const logger = require("../logger");
const auth = require("../auth");

// Professional corporate email template structure
const createEmailTemplate = (data) => {
  const {
    subject,
    recipientName,
    mainMessage,
    details = [],
    actionItems = [],
    footerInfo = {},
    emailType = "notification"
  } = data;

  // Professional header with MPMA branding
  const header = `
    <div style="background-color: #ffffff; border-bottom: 3px solid #1e40af; padding: 25px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" style="vertical-align: middle;">
            <img src="https://mpma.slpa.lk/erp/MPMAA.png" alt="MPMA Logo" style="height: 50px; max-width: 200px;">
          </td>
          <td align="right" style="vertical-align: middle;">
            <div style="text-align: right;">
              <h1 style="color: #1e40af; margin: 0; font-size: 20px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">MAHAPOLA PORTS & MARITIME ACADEMY</h1>
              <p style="color: #6b7280; margin: 2px 0 0 0; font-size: 12px; font-weight: 400;">EnterpriseNET System</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  // Professional main content area
  const mainContent = `
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <h2 style="color: #1e40af; margin: 0 0 25px 0; font-size: 24px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">${subject}</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px; font-family: 'Segoe UI', Arial, sans-serif;">
        Dear <strong style="color: #1e40af;">${recipientName}</strong>,
      </p>
      
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
        <p style="font-size: 16px; line-height: 1.7; color: #1f2937; margin: 0; font-family: 'Segoe UI', Arial, sans-serif;">
          ${mainMessage}
        </p>
      </div>
  `;

  // Professional details section
  let detailsSection = '';
  if (details.length > 0) {
    detailsSection = `
      <h3 style="color: #1e40af; margin: 35px 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        DETAILS
      </h3>
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; margin-bottom: 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
          ${details.map((detail, index) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 15px 20px; background-color: #f8fafc; width: 180px; font-weight: 600; color: #374151; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; border-right: 1px solid #e5e7eb;">
                ${detail.label}
              </td>
              <td style="padding: 15px 20px; color: #1f2937; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;">
                ${detail.value}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  // Professional action items section
  let actionSection = '';
  if (actionItems.length > 0) {
    actionSection = `
      <h3 style="color: #1e40af; margin: 35px 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        REQUIRED ACTIONS
      </h3>
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; margin-bottom: 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
          ${actionItems.map((item, index) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 15px 20px; width: 30px; text-align: center; background-color: #f8fafc; border-right: 1px solid #e5e7eb;">
                <span style="color: #1e40af; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif;">${index + 1}.</span>
              </td>
              <td style="padding: 15px 20px; color: #1f2937; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.5;">
                ${item}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  // Professional footer with contact information
  const footer = `
    </div>
    <div style="background-color: #1e40af; padding: 30px; border-top: 3px solid #1e3a8a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <h4 style="margin: 0 0 20px 0; color: #ffffff; font-size: 16px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">CONTACT INFORMATION</h4>
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 0 20px; text-align: center; vertical-align: top;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #e0e7ff; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 600;">EMAIL</p>
                  <p style="margin: 0; font-size: 13px; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
                    <a href="mailto:mpma@slpa.lk" style="color: #ffffff; text-decoration: none;">mpma@slpa.lk</a>
                  </p>
                </td>
                <td style="padding: 0 20px; text-align: center; vertical-align: top;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #e0e7ff; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 600;">TELEPHONE</p>
                  <p style="margin: 0; font-size: 13px; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif;">+94 11 25 22 452</p>
                  <p style="margin: 0; font-size: 13px; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif;">+94 11 25 23 268</p>
                  <p style="margin: 0; font-size: 13px; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif;">+94 11 25 27 883</p>
                </td>
                <td style="padding: 0 20px; text-align: center; vertical-align: top;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #e0e7ff; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 600;">FAX</p>
                  <p style="margin: 0; font-size: 13px; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif;">+94 11 25 22 660</p>
                </td>
              </tr>
            </table>
            <div style="border-top: 1px solid #3b82f6; margin-top: 25px; padding-top: 20px;">
              <p style="margin: 0; font-size: 11px; color: #cbd5e1; font-family: 'Segoe UI', Arial, sans-serif;">
                © ${new Date().getFullYear()} Mahapola Ports & Maritime Academy | All rights reserved.
              </p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #cbd5e1; font-family: 'Segoe UI', Arial, sans-serif;">
                This is an automated message from the EnterpriseNET system.
              </p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb;">
      ${header}
      ${mainContent}
      ${detailsSection}
      ${actionSection}
      ${footer}
    </div>
  `;
};

// Test email endpoint
router.post("/test", auth.authMiddleware, async (req, res) => {
  const user_name = req.user.name;
  const now = new Date().toISOString();
  
  console.log(`[${now}] POST /api/test-emails/test`);
  console.log("Test email request body:", req.body);

  try {
    const {
      recipientEmail,
      recipientName = "Test User",
      emailType = "test",
      customSubject,
      customMessage
    } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        error: "recipientEmail is required"
      });
    }

    // Test email data structure
    const emailData = {
      subject: customSubject || "Test Email - EnterpriseNET System",
      recipientName,
      mainMessage: customMessage || "This is a test email from the EnterpriseNET system to verify email functionality and design.",
      details: [
        { label: "Email Type", value: emailType },
        { label: "Sent By", value: user_name },
        { label: "Sent At", value: new Date().toLocaleString() },
        { label: "System", value: "EnterpriseNET" },
        { label: "Version", value: "1.0.0" },
        { label: "Environment", value: process.env.NODE_ENV || "development" }
      ],
      actionItems: [
        "Verify email delivery and formatting",
        "Test responsive design on different devices",
        "Confirm all links and contact information are correct",
        "Review email template for any design improvements"
      ],
      footerInfo: {
        systemName: "EnterpriseNET",
        academyName: "Mahapola Ports & Maritime Academy"
      }
    };

    // Generate HTML content
    const htmlContent = createEmailTemplate(emailData);

    // Generate plain text version
    const textContent = `
${emailData.subject}

Dear ${emailData.recipientName},

${emailData.mainMessage}

Details:
${emailData.details.map(detail => `${detail.label}: ${detail.value}`).join('\n')}

Action Items:
${emailData.actionItems.map(item => `• ${item}`).join('\n')}

Contact Information:
Email: mpma@slpa.lk
Phone: +94 11 25 22 452 / +94 11 25 23 268 / +94 11 25 27 883
Fax: +94 11 25 22 660

© ${new Date().getFullYear()} Mahapola Ports & Maritime Academy | All rights reserved.
This is an automated message from the EnterpriseNET system.
    `;

    // Send email
    const result = await sendEmail({
      to: recipientEmail,
      subject: emailData.subject,
      html: htmlContent,
      text: textContent,
      userType: "test"
    });

    logger.info(`Test email sent by ${user_name} to ${recipientEmail} at ${now}`);

    res.json({
      success: true,
      emailSent: result.success,
      recipientEmail,
      emailType: emailData.emailType,
      error: result.success ? null : result.error,
      preview: {
        subject: emailData.subject,
        recipientName: emailData.recipientName,
        detailsCount: emailData.details.length,
        actionItemsCount: emailData.actionItems.length
      }
    });

  } catch (err) {
    logger.error("Error in sending test email:", err);
    res.status(500).json({ error: err.message });
  }
});

// Sample email templates endpoint
router.get("/templates", auth.authMiddleware, async (req, res) => {
  try {
    const templates = {
      welcome: {
        subject: "Welcome to EnterpriseNET",
        mainMessage: "Welcome to the EnterpriseNET system! Your account has been successfully created and you can now access all available features.",
        details: [
          { label: "Account Type", value: "Student/Lecturer/Staff" },
          { label: "Access Level", value: "Full Access" },
          { label: "Login URL", value: "https://mpma.slpa.lk/erp" }
        ],
        actionItems: [
          "Complete your profile setup",
          "Change your temporary password",
          "Explore available features",
          "Contact support if you need assistance"
        ]
      },
      notification: {
        subject: "System Notification",
        mainMessage: "This is an important notification from the EnterpriseNET system regarding your account or recent activities.",
        details: [
          { label: "Notification Type", value: "System Update" },
          { label: "Priority", value: "Medium" },
          { label: "Date", value: new Date().toLocaleDateString() }
        ],
        actionItems: [
          "Review the notification details",
          "Take any required actions",
          "Contact support if clarification is needed"
        ]
      },
      reminder: {
        subject: "Reminder - Action Required",
        mainMessage: "This is a friendly reminder that you have pending actions or deadlines that require your attention.",
        details: [
          { label: "Reminder Type", value: "Deadline" },
          { label: "Due Date", value: "Within 3 days" },
          { label: "Priority", value: "High" }
        ],
        actionItems: [
          "Complete pending tasks",
          "Review upcoming deadlines",
          "Update your status if needed"
        ]
      }
    };

    res.json({
      success: true,
      templates,
      usage: {
        endpoint: "POST /api/test-emails/test",
        body: {
          recipientEmail: "required",
          recipientName: "optional",
          emailType: "optional",
          customSubject: "optional",
          customMessage: "optional"
        }
      }
    });

  } catch (err) {
    logger.error("Error fetching email templates:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
