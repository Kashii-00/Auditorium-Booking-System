const express = require("express");
const router = express.Router();
const db = require("../db");
const logger = require("../logger");
const auth = require("../auth");
const moment = require("moment");

router.post("/", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/classroom-calendar`);
  console.log("Calendar entry POST body:", req.body);

  const {
    user_id,
    request_id,
    date_from,
    date_to,
    time_from,
    time_to,
    course_name,
    preferred_days_of_week,
    classes_allocated,
  } = req.body;

  const calendarSql = `
    INSERT INTO classroom_booking_calendar 
    (user_id, request_id, date_from, date_to, time_from, time_to, course_name, preferred_days_of_week, classes_allocated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const shortToFullDayMap = {
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
    sun: "sunday",
  };

  const calendarValues = [
    user_id,
    request_id || null,
    date_from,
    date_to,
    time_from,
    time_to,
    course_name,
    preferred_days_of_week,
    classes_allocated,
  ];

  db.query(calendarSql, calendarValues, (err, result) => {
    if (err) {
      logger.error("Error inserting calendar entry:", err);
      return res.status(500).json({ error: "Database insert error" });
    }

    const calendar_id = result.insertId;
    const preferredDays = preferred_days_of_week
      .split(",")
      .map((d) => shortToFullDayMap[d.trim().slice(0, 3).toLowerCase()])
      .filter(Boolean);

    const allDates = [];
    const start = moment(date_from);
    const end = moment(date_to);

    for (let m = start.clone(); m.isSameOrBefore(end); m.add(1, "days")) {
      const dayName = m.format("dddd").toLowerCase();
      if (preferredDays.includes(dayName)) {
        allDates.push(m.format("YYYY-MM-DD"));
      }
    }

    const cancelDates = [];

    const detailsSql = `
      INSERT INTO classroom_booking_dates
      (calendar_id, user_id, request_id, course_name, all_dates, cancel_dates, time_from, time_to, classes_allocated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const detailsValues = [
      calendar_id,
      user_id,
      request_id || null,
      course_name || null,
      JSON.stringify(allDates),
      JSON.stringify(cancelDates),
      time_from,
      time_to,
      classes_allocated,
    ];

    db.query(detailsSql, detailsValues, (err2) => {
      if (err2) {
        logger.error("Error inserting booking details:", err2);
        return res.status(500).json({ error: "Details insert error" });
      }

      // <-- Add this update query here
      if (request_id) {
        db.query(
          "UPDATE aid_requests SET last_updated = NOW() WHERE id = ?",
          [request_id],
          (updateErr) => {
            if (updateErr) {
              logger.error(
                `Error updating last_updated on aid_requests for id ${request_id}:`,
                updateErr
              );
              // Not critical: don't fail the request because of this
            }
          }
        );
      }

      const logtime = moment().format("YYYY-MM-DD HH:mm:ss");
      logger.info(
        `Booking detail created at ${logtime} for calendar ID ${calendar_id}`
      );

      return res.json({
        success: true,
        message: "Calendar and details created successfully",
        calendar_id,
        booked_dates: allDates,
      });
    });
  });
});

// GET all calendar entries
router.get("/", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/classroom-calendar`);

  const sql = `SELECT * FROM classroom_booking_calendar`;
  db.query(sql, (err, results) => {
    if (err) {
      logger.error("Error fetching calendar entries:", err);
      return res.status(500).json({ error: "Database fetch error" });
    }

    return res.json({
      success: true,
      message: "Calendar entries fetched successfully",
      data: results,
    });
  });
});

router.get("/details", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/classroom-calendar/details`);

  const sql = `
    SELECT cbd.*, u.name as user_name, cbc.course_name as calendar_course
    FROM classroom_booking_dates cbd
    LEFT JOIN users u ON cbd.user_id = u.id
    LEFT JOIN classroom_booking_calendar cbc ON cbd.calendar_id = cbc.id
    ORDER BY cbd.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error details:", err);
      return res.status(500).json({ error: "Database fetch error" });
    }

    // 🔁 Compute effectiveDates for each booking
    const transformedResults = results.map((row) => {
      const allDates = JSON.parse(row.all_dates || "[]");
      const cancelDates = JSON.parse(row.cancel_dates || "[]");
      const effectiveDates = allDates.filter(
        (date) => !cancelDates.includes(date)
      );

      return {
        ...row,
        effective_dates: effectiveDates,
      };
    });

    return res.json({
      success: true,
      message: "Classroom booking details fetched successfully",
      data: transformedResults,
    });
  });
});

router.get("/details-with-request-info", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/classroom-calendar/details-with-request-info`);

  const sql = `
    SELECT 
      cbd.*, 
      u.name AS user_name,
      cbc.course_name AS calendar_course,
      ar.id AS request_id,
      ar.requesting_officer_name
    FROM classroom_booking_dates cbd
    LEFT JOIN users u ON cbd.user_id = u.id
    LEFT JOIN classroom_booking_calendar cbc ON cbd.calendar_id = cbc.id
    LEFT JOIN aid_requests ar ON cbd.request_id = ar.id
    ORDER BY cbd.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error details:", err);
      return res.status(500).json({ error: "Database fetch error" });
    }

    const transformedResults = results.map((row) => {
      const allDates = JSON.parse(row.all_dates || "[]");
      const cancelDates = JSON.parse(row.cancel_dates || "[]");
      const effectiveDates = allDates.filter(
        (date) => !cancelDates.includes(date)
      );

      return {
        ...row,
        effective_dates: effectiveDates,
      };
    });

    return res.json({
      success: true,
      message:
        "Classroom booking details with request info fetched successfully",
      data: transformedResults,
    });
  });
});

router.get("/details-v2", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/classroom-calendar/details-v2`);

  const sql = `
    SELECT 
      cbd.*, 
      u.name AS user_name,
      cbc.course_name AS calendar_course,
      ar.id AS request_id,
      ar.requesting_officer_name,
      ar.requesting_officer_email   -- added here
    FROM classroom_booking_dates cbd
    LEFT JOIN users u ON cbd.user_id = u.id
    LEFT JOIN classroom_booking_calendar cbc ON cbd.calendar_id = cbc.id
    LEFT JOIN aid_requests ar ON cbd.request_id = ar.id
    ORDER BY cbd.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Database error details:", err);
      return res.status(500).json({ error: "Database fetch error" });
    }

    const transformedResults = results.map((row) => {
      let allDates = [];
      let cancelDates = [];

      try {
        allDates = JSON.parse(row.all_dates || "[]");
        cancelDates = JSON.parse(row.cancel_dates || "[]");
      } catch (err) {
        console.error("❌ JSON parse error:", err, row);
      }

      const effectiveDates = allDates.filter(
        (date) => !cancelDates.includes(date)
      );

      return {
        ...row,
        effective_dates: effectiveDates,
      };
    });

    return res.json({
      success: true,
      message: "Classroom booking details fetched with aid request info",
      data: transformedResults,
    });
  });
});

// GET aid_request IDs that are NOT in classroom_booking_calendar.request_id
router.get("/unassigned-request-ids", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/classroom-calendar/unassigned-request-ids`);

  const sql = `
    SELECT ar.id
    FROM aid_requests ar
    WHERE ar.request_status = 'Approved'
      AND NOT EXISTS (
        SELECT 1
        FROM classroom_booking_calendar cbc
        WHERE cbc.request_id = ar.id
      )
  `;

  db.query(sql, (err, results) => {
    if (err) {
      logger.error("Error fetching unassigned aid request IDs:", err);
      return res.status(500).json({ error: "Database fetch error" });
    }

    // Extract the IDs into a flat array
    const unassignedIds = results.map((row) => row.id);

    return res.json({
      success: true,
      message: "Unassigned aid request IDs fetched successfully",
      unassignedRequestIds: unassignedIds,
    });
  });
});

// GET calendar entry by ID
router.get("/:request_id", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/classroom-calendar/${req.params.request_id}`);

  const sql = `SELECT * FROM classroom_booking_calendar WHERE id = ?`;
  db.query(sql, [req.params.request_id], (err, results) => {
    if (err) {
      logger.error("Error fetching calendar entry by ID:", err);
      return res.status(500).json({ error: "Database fetch error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Calendar entry not found" });
    }

    return res.json({
      success: true,
      message: "Calendar entry fetched successfully",
      data: results[0],
    });
  });
});

router.put(
  "/details/by-request/:request_id/cancel-dates",
  auth.authMiddleware,
  (req, res) => {
    const { request_id } = req.params;
    const { cancel_dates } = req.body;

    if (!Array.isArray(cancel_dates)) {
      return res
        .status(400)
        .json({ error: "cancel_dates must be an array of dates" });
    }

    const updateCancelDatesSql = `
    UPDATE classroom_booking_dates
    SET cancel_dates = ?
    WHERE request_id = ?
    LIMIT 1
  `;

    db.query(
      updateCancelDatesSql,
      [JSON.stringify(cancel_dates), request_id],
      (err, result) => {
        if (err) {
          logger.error(
            `Error updating cancel_dates for request_id ${request_id}:`,
            err
          );
          return res.status(500).json({ error: "Database update error" });
        }

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ error: "No booking found for this request_id" });
        }

        // Update last_updated in aid_requests
        const updateAidRequestSql = `
      UPDATE aid_requests
      SET last_updated = NOW()
      WHERE id = ?
    `;

        db.query(updateAidRequestSql, [request_id], (aidErr) => {
          if (aidErr) {
            logger.error(
              `Error updating last_updated for aid_request ${request_id}:`,
              aidErr
            );
            // Not critical, still return success
            return res.json({
              success: true,
              message:
                "cancel_dates updated, but failed to update aid_request timestamp",
            });
          }

          return res.json({
            success: true,
            message:
              "cancel_dates and aid_request.last_updated updated successfully",
          });
        });
      }
    );
  }
);

// DELETE calendar entry by ID
router.delete("/:id", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/classroom-calendar/${req.params.id}`);

  const sql = `DELETE FROM classroom_booking_calendar WHERE id = ?`;
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      logger.error("Error deleting calendar entry:", err);
      return res.status(500).json({ error: "Database delete error" });
    }

    const logtime = moment().format("YYYY-MM-DD HH:mm:ss");
    logger.info(
      `Calendar entry deleted at ${logtime} by user ${req.user.name}`
    );
    return res.json({
      success: true,
      message: "Calendar entry deleted successfully",
    });
  });
});

module.exports = router;
