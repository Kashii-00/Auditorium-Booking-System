const express = require("express");
const router = express.Router();
const db = require("../db");
const { sendEmail } = require("../utils/emailService");
const logger = require("../logger");
const auth = require("../auth");

// POST /emails
router.post("/", auth.authMiddleware, async (req, res) => {
  const user_name = req.user.name;
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/emails`);
  console.log("Email POST body:", req.body);

  try {
    const { aid_request_id, classroom_booking_calendar_id } = req.body;

    if (!aid_request_id && !classroom_booking_calendar_id) {
      return res.status(400).json({
        error: "aid_request_id or classroom_booking_calendar_id is required",
      });
    }

    let recipientEmail,
      subject,
      htmlContent,
      textContent,
      relatedType,
      emailType;

    // Aid item renderer with bullet symbol
    const renderAidItem = (item, html = true) => {
      const content = `• ${item.description} - Qty: ${item.quantity}`;
      if (html)
        return `<p style="margin:0; padding:0; font-size: 14px; line-height: 1.6;">${content}</p>`;
      return content;
    };

    // --- Fetch aid_request data if applicable ---
    if (aid_request_id) {
      relatedType = "aid_request";

      const [request] = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM aid_requests WHERE id = ?",
          [aid_request_id],
          (err, results) => (err ? reject(err) : resolve(results))
        );
      });

      if (!request) {
        return res
          .status(404)
          .json({ error: "Classroom Aid Request not found" });
      }

      const aidItems = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM aid_items WHERE request_id = ? ORDER BY item_no",
          [aid_request_id],
          (err, results) => (err ? reject(err) : resolve(results))
        );
      });

      recipientEmail = request.requesting_officer_email;

      // Determine email type based on request_status
      const status = (request.request_status || "").toLowerCase();
      if (status === "approved") {
        emailType = "approval";
        subject = "Your Classroom Aid Request Approved";
      } else if (status === "denied") {
        emailType = "denial";
        subject = "Your Classroom Aid Request Denied";
      } else if (status === "pending") {
        emailType = "pending";
        subject = "Your Classroom Aid Request Pending Review";
      } else {
        return res.status(400).json({
          error: `Unsupported request_status: ${request.request_status}`,
        });
      }

      const aidItemsHtml = aidItems.length
        ? aidItems.map(renderAidItem).join("")
        : "<p>No aid items.</p>";

      const aidItemsText = aidItems.length
        ? aidItems.map((item) => renderAidItem(item, false)).join("\n")
        : "No aid items.";

      htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
<h2 style="color: #2c3e50; margin-bottom: 20px;">${subject}</h2>
<p style="font-size: 16px; line-height: 1.5;">Dear ${
        request.requesting_officer_name
      },</p>
<p style="font-size: 16px; line-height: 1.5;">Your Classroom Aid Request for course <strong>${
        request.course_name
      }</strong> has been <strong>${request.request_status}</strong>.</p>
<h3 style="color: #2c3e50; margin-top: 30px;">Course Details</h3>
<ul style="margin:0; padding-left:20px; list-style-type: disc; font-size: 14px; line-height: 1.6;">
  <li><strong>Duration:</strong> ${request.duration || "N/A"}</li>
  <li><strong>Audience Type:</strong> ${request.audience_type || "N/A"}</li>
  <li><strong>No. of Participants:</strong> ${
    request.no_of_participants || 0
  }</li>
  <li><strong>Course Coordinator:</strong> ${
    request.course_coordinator || "N/A"
  }</li>
  <li><strong>Preferred Days:</strong> ${
    request.preferred_days_of_week || "N/A"
  }</li>
  <li><strong>Date:</strong> ${request.date_from || "N/A"} to ${
        request.date_to || "N/A"
      }</li>
  <li><strong>Time:</strong> ${request.time_from || "N/A"} - ${
        request.time_to || "N/A"
      }</li>
  <li><strong>Signed Date:</strong> ${request.signed_date || "N/A"}</li>
  <li><strong>Paid Course:</strong> ${request.paid_course_or_not}</li>
  <li><strong>Payment Status:</strong> ${request.payment_status}</li>
  <li><strong>Classrooms Requested:</strong> ${
    request.classrooms_allocated || "N/A"
  }</li>
  <li><strong>Exam:</strong> ${request.exam_or_not}</li>
  <li><strong>Cancelled by Requester:</strong> ${
    request.cancelled_by_requester
  }</li>
</ul>
<h3 style="color: #2c3e50; margin-top: 30px;">Aid Items</h3>
${aidItemsHtml}
<div style="margin-top: 40px; padding: 15px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #dee2e6; border-radius: 0 0 8px 8px;">
<p style="margin: 0; font-size: 14px; color: #6c757d;">Contact us: mpma@slpa.lk | Phone: +94 11 25 22 452 / +94 11 25 23 268 / +94 11 25 27 883 | Fax: +94 11 25 22 660</p>
</div>
</div>`;

      textContent = `${subject}\n\nDear ${
        request.requesting_officer_name
      },\n\nYour Classroom Aid Request for course "${
        request.course_name
      }" has been ${request.request_status}.\n\nCourse Details:\nDuration: ${
        request.duration || "N/A"
      }\nAudience Type: ${
        request.audience_type || "N/A"
      }\nNo. of Participants: ${
        request.no_of_participants || 0
      }\nCourse Coordinator: ${
        request.course_coordinator || "N/A"
      }\nPreferred Days: ${request.preferred_days_of_week || "N/A"}\nDate: ${
        request.date_from || "N/A"
      } to ${request.date_to || "N/A"}\nTime: ${request.time_from || "N/A"} - ${
        request.time_to || "N/A"
      }\nSigned Date: ${request.signed_date || "N/A"}\nPaid Course: ${
        request.paid_course_or_not
      }\nPayment Status: ${request.payment_status}\nClassrooms Requested: ${
        request.classrooms_allocated || "N/A"
      }\nExam: ${request.exam_or_not}\nCancelled by Requester: ${
        request.cancelled_by_requester
      }\n\nAid Items:\n${aidItemsText}\n\nContact us: mpma@slpa.lk | Phone: +94 11 25 22 452 / +94 11 25 23 268 / +94 11 25 27 883 | Fax: +94 11 25 22 660`;
    }

    // --- Fetch classroom_booking_calendar data if applicable ---
    if (classroom_booking_calendar_id) {
      relatedType = "classroom_booking";

      const [booking] = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM classroom_booking_calendar WHERE id = ?",
          [classroom_booking_calendar_id],
          (err, results) => (err ? reject(err) : resolve(results))
        );
      });

      if (!booking) {
        return res.status(404).json({ error: "Classroom booking not found" });
      }

      recipientEmail = booking.req_officer_email;
      subject = "Classroom Booking Approved";
      emailType = "approval";

      let linkedAidItemsHtml = "<p>No linked aid items.</p>";
      let linkedAidItemsText = "No linked aid items.";

      if (booking.request_id) {
        const aidItems = await new Promise((resolve, reject) => {
          db.query(
            "SELECT * FROM aid_items WHERE request_id = ? ORDER BY item_no",
            [booking.request_id],
            (err, results) => (err ? reject(err) : resolve(results))
          );
        });

        if (aidItems.length) {
          linkedAidItemsHtml = `<h4>Linked Aid Items:</h4>${aidItems
            .map(renderAidItem)
            .join("")}`;
          linkedAidItemsText = `Linked Aid Items:\n${aidItems
            .map((item) => renderAidItem(item, false))
            .join("\n")}`;
        }
      }

      htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
<h2 style="color: #2c3e50; margin-bottom: 20px;">${subject}</h2>
<p style="font-size: 16px; line-height: 1.5;">Dear ${
        booking.req_officer_name
      },</p>
<p style="font-size: 16px; line-height: 1.5;">Your classroom booking for <strong>${
        booking.course_name
      }</strong> has been approved.</p>
<ul style="margin:0; padding-left:20px; list-style-type: disc; font-size: 14px; line-height: 1.6;">
  <li><strong>Date:</strong> ${booking.date_from} to ${booking.date_to}</li>
  <li><strong>Time:</strong> ${booking.time_from} - ${booking.time_to}</li>
  <li><strong>Preferred Days:</strong> ${
    booking.preferred_days_of_week || "N/A"
  }</li>
  <li><strong>Classes Allocated:</strong> ${
    booking.classes_allocated || "N/A"
  }</li>
</ul>
${linkedAidItemsHtml}
<div style="margin-top: 40px; padding: 15px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #dee2e6; border-radius: 0 0 8px 8px;">
<p style="margin: 0; font-size: 14px; color: #6c757d;">Contact us: mpma@slpa.lk | Phone: +94 11 25 22 452 / +94 11 25 23 268 / +94 11 25 27 883 | Fax: +94 11 25 22 660</p>
</div>
</div>`;

      textContent = `${subject}\n\nDear ${
        booking.req_officer_name
      },\n\nYour classroom booking for "${
        booking.course_name
      }" has been approved.\n\nBooking Details:\nDate: ${
        booking.date_from
      } to ${booking.date_to}\nTime: ${booking.time_from} - ${
        booking.time_to
      }\nPreferred Days: ${
        booking.preferred_days_of_week || "N/A"
      }\nClasses Allocated: ${
        booking.classes_allocated || "N/A"
      }\n\n${linkedAidItemsText}\n\nContact us: mpma@slpa.lk | Phone: +94 11 25 22 452 / +94 11 25 23 268 / +94 11 25 27 883 | Fax: +94 11 25 22 660`;
    }

    // --- Send Email ---
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: textContent,
      userType: "general",
    });

    // --- Insert into email log table ---
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO classroom_booking_email_notifications
         (aid_request_id, classroom_booking_calendar_id, recipient_email, subject, body, email_type, related_type, status, error_message, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          aid_request_id || null,
          classroom_booking_calendar_id || null,
          recipientEmail,
          subject,
          textContent,
          emailType,
          relatedType,
          result.success ? "sent" : "failed",
          result.success ? null : result.error?.message || "Unknown error",
        ],
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });

    logger.info(`Email sent by ${user_name} to ${recipientEmail} at ${now}`);

    res.json({
      success: true,
      emailSent: result.success,
      recipientEmail,
      emailType,
      error: result.success ? null : result.error,
    });
  } catch (err) {
    logger.error("Error in sending email:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
