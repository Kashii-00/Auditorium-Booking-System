//node -e "require('./src/utils/emailProcessor')()"

const db = require("../db");
const MicrosoftGraphService = require('../services/microsoftGraphService');
const logger = require('../logger');

// Initialize Microsoft Graph Service
let graphService;
try {
  graphService = new MicrosoftGraphService();
  logger.info('EmailProcessor: Microsoft Graph service initialized');
} catch (error) {
  logger.error('EmailProcessor: Failed to initialize Microsoft Graph service:', error);
}

// Step 1: Get all requests with status Approved/Denied AND no entry in aid_request_emails
const fetchPendingEmailRequests = async () => {
  const query = `
  SELECT ar.id, ar.requesting_officer_email, ar.requesting_officer_name, ar.designation,
         ar.request_status, ar.course_name, ar.duration, ar.audience_type,
         ar.no_of_participants, ar.course_coordinator, ar.preferred_days_of_week,
         ar.date_from, ar.date_to, ar.time_from, ar.time_to,
         ar.paid_course_or_not, ar.payment_status, ar.classrooms_allocated, ar.exam_or_not, ar.cancelled_by_requester
  FROM aid_requests ar
  LEFT JOIN (
    SELECT request_id, MAX(sent_at) AS last_email_sent_at
    FROM aid_request_emails
    GROUP BY request_id
  ) ae ON ae.request_id = ar.id
  WHERE ar.request_status IN ('Approved', 'Denied')
  AND (ae.last_email_sent_at IS NULL OR ar.last_updated > ae.last_email_sent_at)
`;

  return new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Step 2: Fetch aid items for a given request ID
const fetchAidItemsForRequest = async (requestId) => {
  const query = `
  SELECT item_no, description, quantity, remark,
         md_approval_required_or_not, md_approval_obtained, md_approval_details,
         CTM_approval_obtained, CTM_Details
  FROM aid_items
  WHERE request_id = ?
  ORDER BY item_no
`;

  return new Promise((resolve, reject) => {
    db.query(query, [requestId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

const fetchCancelDates = async (requestId) => {
  const query = `
    SELECT cancel_dates
    FROM classroom_booking_dates
    WHERE request_id = ?
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    db.query(query, [requestId], (err, results) => {
      if (err) return reject(err);
      const raw = results[0]?.cancel_dates;
      if (!raw) return resolve([]);
      try {
        const parsed = JSON.parse(raw);
        resolve(Array.isArray(parsed) ? parsed : []);
      } catch {
        resolve([]);
      }
    });
  });
};

const fetchClassesAllocated = async (requestId) => {
  const query = `
    SELECT GROUP_CONCAT(DISTINCT classes_allocated ORDER BY classes_allocated SEPARATOR ', ') AS classes_allocated
    FROM classroom_booking_calendar
    WHERE request_id = ?
  `;

  return new Promise((resolve, reject) => {
    db.query(query, [requestId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]?.classes_allocated || "N/A");
    });
  });
};

// Helper to format dates safely
const formatDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "N/A");

const processPendingEmails = async () => {
  try {
    if (!graphService) {
      logger.error('❌ Microsoft Graph service not initialized for email processing');
      return;
    }

    const requests = await fetchPendingEmailRequests();
    logger.info(`📧 Processing ${requests.length} pending email requests`);

    for (const req of requests) {
      const status = req.request_status.toLowerCase(); // 'approved' or 'denied'
      const email_type = status === "approved" ? "approval" : "denial";

      // Get aid items for this request
      const aidItems = await fetchAidItemsForRequest(req.id);

      // Fetch classes_allocated if approved
      let classesAllocated = "N/A";
      if (status === "approved") {
        // Fetch classes allocated
        classesAllocated = await fetchClassesAllocated(req.id);
      }

      // Fetch cancel_dates if present
      const cancelDates = await fetchCancelDates(req.id);
      const formattedCancelDates = cancelDates.length
        ? cancelDates.map((d) => `  - ${formatDate(d)}`).join("\n")
        : null;

      const aidItemsList = aidItems.length
        ? aidItems
            .map((item) => {
              const base = `  ${item.item_no}. ${item.description} - Qty: ${
                item.quantity
              }${item.remark ? ` (${item.remark})` : ""}`;

              const isAuditoriumOrMisc =
                (item.description || "").toLowerCase().includes("auditorium") ||
                item.item_no === "14" ||
                item.item_no === 14;

              const isCTMRequired =
                req.paid_course_or_not === "Yes" &&
                (item.item_no === "03" || item.item_no === 3);

              const mdInfo = isAuditoriumOrMisc
                ? `\n      - MD Approval Required: ${
                    item.md_approval_required_or_not || "N/A"
                  }\n      - MD Approval Obtained: ${
                    item.md_approval_obtained || "N/A"
                  }\n      - MD Approval Details: ${
                    item.md_approval_details || "N/A"
                  }`
                : "";

              const ctmInfo = isCTMRequired
                ? `\n      - CTM Approval Obtained: ${
                    item.CTM_approval_obtained || "N/A"
                  }\n      - CTM Details: ${item.CTM_Details || "N/A"}`
                : "";

              return `${base}${mdInfo}${ctmInfo}`;
            })
            .join("\n")
        : "  None";

      const subject =
        status === "approved"
          ? "Classroom Booking Request Approved"
          : "Classroom Booking Request Denied";

      // Create HTML email content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0;">Mahapola Ports & Maritime Academy</h2>
          </div>
          
          <div style="background-color: ${status === 'approved' ? '#d1fae5' : '#fee2e2'}; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: ${status === 'approved' ? '#065f46' : '#991b1b'}; margin: 0;">
              ${status === 'approved' ? '✅ Request Approved' : '❌ Request Denied'}
            </h3>
          </div>
          
          <p style="color: #374151; margin-bottom: 20px;">
            Dear <strong>${req.requesting_officer_name}</strong> (${req.designation}),
          </p>
          
          <p style="color: #374151; margin-bottom: 20px;">
            Your classroom booking request (Request ID: <strong>${req.id}</strong>) for the course 
            "<strong>${req.course_name}</strong>" has been <strong>${status}</strong>.
          </p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #1f2937; margin-top: 0;">Request Details:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0; color: #6b7280;">Duration:</td><td style="padding: 5px 0; color: #374151;">${req.duration || "N/A"}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Audience Type:</td><td style="padding: 5px 0; color: #374151;">${req.audience_type || "N/A"}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Number of Participants:</td><td style="padding: 5px 0; color: #374151;">${req.no_of_participants || 0}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Course Coordinator:</td><td style="padding: 5px 0; color: #374151;">${req.course_coordinator || "N/A"}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Preferred Days:</td><td style="padding: 5px 0; color: #374151;">${req.preferred_days_of_week || "N/A"}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Date Range:</td><td style="padding: 5px 0; color: #374151;">${formatDate(req.date_from)} to ${formatDate(req.date_to)}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Time:</td><td style="padding: 5px 0; color: #374151;">${req.time_from || "N/A"} to ${req.time_to || "N/A"}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Paid Course:</td><td style="padding: 5px 0; color: #374151;">${req.paid_course_or_not}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Payment Status:</td><td style="padding: 5px 0; color: #374151;">${req.payment_status}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Exam or Not:</td><td style="padding: 5px 0; color: #374151;">${req.exam_or_not || "N/A"}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Cancelled by Requester:</td><td style="padding: 5px 0; color: #374151;">${req.cancelled_by_requester ? "Yes" : "No"}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280;">Classrooms Requested:</td><td style="padding: 5px 0; color: #374151;">${(req.classrooms_allocated || "N/A").split(",").map((room) => room.trim()).join(", ")}</td></tr>
              ${status === "approved" ? `<tr><td style="padding: 5px 0; color: #6b7280;">Classes Allocated:</td><td style="padding: 5px 0; color: #374151;">${classesAllocated}</td></tr>` : ''}
            </table>
          </div>
          
          ${formattedCancelDates ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #92400e; margin-top: 0;">Cancelled Dates:</h4>
            <pre style="margin: 0; color: #92400e; font-family: inherit;">${formattedCancelDates}</pre>
          </div>
          ` : ''}
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #1f2937; margin-top: 0;">Requested Aid Items:</h4>
            <pre style="margin: 0; color: #374151; font-family: inherit; white-space: pre-line;">${aidItemsList}</pre>
          </div>
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af;">
              If you have any questions or concerns, please contact the admin team.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Best regards,<br>
              <strong>Admin Team</strong><br>
              Mahapola Ports & Maritime Academy
            </p>
          </div>
        </div>
      `;

      // Create plain text version for fallback
      const textContent = `
Dear ${req.requesting_officer_name} (${req.designation}),

Your classroom booking request (Request ID: ${req.id}) for the course "${req.course_name}" has been ${status}.

Details of your request:
- Duration: ${req.duration || "N/A"}
- Audience Type: ${req.audience_type || "N/A"}
- Number of Participants: ${req.no_of_participants || 0}
- Course Coordinator: ${req.course_coordinator || "N/A"}
- Preferred Days: ${req.preferred_days_of_week || "N/A"}
- Date Range: ${formatDate(req.date_from)} to ${formatDate(req.date_to)}
- Time: ${req.time_from || "N/A"} to ${req.time_to || "N/A"}
- Paid Course: ${req.paid_course_or_not}
- Payment Status: ${req.payment_status}
- Exam or Not: ${req.exam_or_not || "N/A"}
- Cancelled by Requester: ${req.cancelled_by_requester ? "Yes" : "No"}
- Classrooms Requested: ${(req.classrooms_allocated || "N/A").split(",").map((room) => room.trim()).join(", ")}
${status === "approved" ? `- Classes Allocated: ${classesAllocated}` : ""}
${formattedCancelDates ? `\nCancelled Dates:\n${formattedCancelDates}` : ""}

Requested Aid Items:
${aidItemsList}

If you have any questions or concerns, please contact the admin team.

Regards,
Admin Team
      `;

      try {
        const result = await graphService.sendEmail({
          to: req.requesting_officer_email,
          subject: subject,
          html: htmlContent,
          text: textContent
        });

        // Log success
        const successQuery = `
          INSERT INTO aid_request_emails 
          (request_id, email_type, email_address, subject, body, sent_status, error_message)
          VALUES (?, ?, ?, ?, ?, 'success', NULL)
        `;
        db.query(successQuery, [
          req.id,
          email_type,
          req.requesting_officer_email,
          subject,
          textContent, // Store plain text version in database
        ]);

        logger.info(`✅ Email sent successfully via Microsoft Graph to ${req.requesting_officer_email} for request ${req.id}`);
        console.log(`✅ Email sent to ${req.requesting_officer_email} for request ${req.id}`);
      } catch (error) {
        const failQuery = `
          INSERT INTO aid_request_emails 
          (request_id, email_type, email_address, subject, body, sent_status, error_message)
          VALUES (?, ?, ?, ?, ?, 'failed', ?)
        `;
        db.query(failQuery, [
          req.id,
          email_type,
          req.requesting_officer_email,
          subject,
          textContent, // Store plain text version in database
          error.message,
        ]);

        logger.error(`❌ Failed to email ${req.requesting_officer_email} via Microsoft Graph: ${error.message}`);
        console.error(`❌ Failed to email ${req.requesting_officer_email}: ${error.message}`);
      }
    }
  } catch (err) {
    logger.error("❌ Error fetching pending emails:", err);
    console.error("❌ Error fetching pending emails:", err);
  }
};

module.exports = processPendingEmails;
