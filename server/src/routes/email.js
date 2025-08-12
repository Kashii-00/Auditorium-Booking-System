const express = require("express");
const db = require("../db");
const { sendBasicEmail } = require("../utils/emailService");
const router = express.Router();

router.post("/send", async (req, res) => {
  const { request_id, to, subject, message, email_type } = req.body;

  if (!request_id || !to || !subject || !message || !email_type) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!["approval", "denial"].includes(email_type)) {
    return res.status(400).json({ error: "Invalid email type." });
  }

  try {
    const result = await sendBasicEmail(to, subject, message, 'general');

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    // Log success
    const insertQuery = `
      INSERT INTO aid_request_emails 
      (request_id, email_type, email_address, subject, body, sent_status, error_message)
      VALUES (?, ?, ?, ?, ?, 'success', NULL)
    `;
    db.query(insertQuery, [request_id, email_type, to, subject, message]);

    res.json({ success: true, message: "Email sent and logged successfully." });
  } catch (error) {
    console.error("Email send error:", error);

    // Log failure
    const insertQuery = `
      INSERT INTO aid_request_emails 
      (request_id, email_type, email_address, subject, body, sent_status, error_message)
      VALUES (?, ?, ?, ?, ?, 'failed', ?)
    `;
    db.query(insertQuery, [
      request_id,
      email_type,
      to,
      subject,
      message,
      error.message,
    ]);

    res.status(500).json({ error: "Failed to send email." });
  }
});

module.exports = router;
