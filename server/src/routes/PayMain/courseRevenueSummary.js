// routes/courseRevenueSummary.js
const express = require("express");
const Joi = require("joi");
const db = require("../../db");
const logger = require("../../logger");
const auth = require("../../auth");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const router = express.Router();

// Rate limit config
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests. Please slow down." });
  },
});

// Middleware
router.use(auth.authMiddleware);
router.use(limiter);

// Roles allowed to create revenue summary
const PRIVILEGED_ROLES = [
  "SuperAdmin",
  "finance_manager",
  "CTM",
  "DCTM01",
  "DCTM02",
  "sectional_head",
];

// Normalize roles helper (exact from payments_main_details)
function normalizeRoles(rawRole) {
  if (!rawRole) return [];

  if (Array.isArray(rawRole)) {
    if (
      rawRole.length === 1 &&
      typeof rawRole[0] === "string" &&
      rawRole[0].startsWith("[") &&
      rawRole[0].endsWith("]")
    ) {
      try {
        return JSON.parse(rawRole[0]);
      } catch {
        return rawRole;
      }
    }
    return rawRole;
  }

  if (typeof rawRole === "string") {
    if (rawRole.startsWith("[") && rawRole.endsWith("]")) {
      try {
        return JSON.parse(rawRole);
      } catch {
        return [rawRole];
      }
    }
    return [rawRole];
  }

  return [];
}

// Validation schema
const revenueSchema = Joi.object({
  payments_main_details_id: Joi.number().integer().required(),
  batch_id: Joi.number().integer().required(),
  min_paid_no_of_participants: Joi.number().integer().min(0).default(0),
});

const patchSchema = Joi.object({
  no_of_participants: Joi.number().integer().min(0),
  paid_no_of_participants: Joi.number().integer().min(0),
  min_paid_no_of_participants: Joi.number().integer().min(0),
}).min(1);

router.post("/", (req, res) => {
  // RBAC check
  const roles = normalizeRoles(req.user.role);
  const isAllowed = roles.some((r) => PRIVILEGED_ROLES.includes(r));

  if (!isAllowed) {
    return res
      .status(403)
      .json({ error: "Forbidden: insufficient privileges" });
  }

  const { error } = revenueSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  }

  const { payments_main_details_id, batch_id, min_paid_no_of_participants } =
    req.body;

  // Step 1: Check payments_main_details
  db.query(
    "SELECT * FROM payments_main_details WHERE id = ?",
    [payments_main_details_id],
    (err, pmdRows) => {
      if (err) {
        logger.error("DB error checking payments_main_details:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (pmdRows.length === 0) {
        return res
          .status(404)
          .json({ error: "Payment main details not found" });
      }

      const pmd = pmdRows[0];

      if (pmd.CTM_approved !== "Approved") {
        return res.status(403).json({ error: "CTM approval not granted" });
      }

      const no_of_participants = pmd.no_of_participants;

      // Step 2: Get Rounded_CT from course_cost_summary
      db.query(
        "SELECT Rounded_CT FROM course_cost_summary WHERE payment_main_details_id = ?",
        [payments_main_details_id],
        (err, ccsRows) => {
          if (err) {
            logger.error("DB error checking course_cost_summary:", err);
            return res.status(500).json({ error: "Database error" });
          }
          if (ccsRows.length === 0) {
            return res
              .status(404)
              .json({ error: "Course cost summary not found" });
          }

          const total_course_revenue = ccsRows[0].Rounded_CT || 0;

          // Step 3: Insert into course_revenue_summary
          const insertSql = `
            INSERT INTO course_revenue_summary (
              payments_main_details_id,
              batch_id,
              no_of_participants,
              paid_no_of_participants,
              min_paid_no_of_participants,
              total_course_revenue,
              revenue_received_total,
              all_fees_collected_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const insertValues = [
            payments_main_details_id,
            batch_id,
            no_of_participants,
            0,
            min_paid_no_of_participants ?? 0,
            total_course_revenue,
            0,
            false,
          ];

          db.query(insertSql, insertValues, (err, result) => {
            if (err) {
              logger.error("Error inserting course_revenue_summary:", err);
              return res.status(500).json({ error: "Database error" + err });
            }

            logger.info(
              `course_revenue_summary created for PMD ID ${payments_main_details_id}`
            );
            res.status(201).json({ success: true, id: result.insertId });
          });
        }
      );
    }
  );
});

// --- GET ALL ---
router.get("/", (req, res) => {
  const roles = normalizeRoles(req.user.role);
  const isPrivileged = roles.some((r) => PRIVILEGED_ROLES.includes(r));

  let sql = `
    SELECT crs.*, pmd.user_id, pmd.course_name
    FROM course_revenue_summary crs
    JOIN payments_main_details pmd ON crs.payments_main_details_id = pmd.id
  `;
  const params = [];

  if (!isPrivileged) {
    sql += " WHERE pmd.user_id = ?";
    params.push(req.user.id);
  }

  db.query(sql, params, (err, rows) => {
    if (err) {
      logger.error("DB error fetching all course_revenue_summary:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// --- GET BY payments_main_details_id ---
router.get("/:payments_main_details_id", (req, res) => {
  const { payments_main_details_id } = req.params;
  const roles = normalizeRoles(req.user.role);
  const isPrivileged = roles.some((r) => PRIVILEGED_ROLES.includes(r));

  const sql = `
    SELECT crs.*, pmd.user_id, pmd.course_name
    FROM course_revenue_summary crs
    JOIN payments_main_details pmd ON crs.payments_main_details_id = pmd.id
    WHERE crs.payments_main_details_id = ?
    LIMIT 1
  `;

  db.query(sql, [payments_main_details_id], (err, rows) => {
    if (err) {
      logger.error("DB error fetching course_revenue_summary:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "course_revenue_summary not found" });
    }

    const record = rows[0];
    if (!isPrivileged && record.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient privileges" });
    }

    res.json(record);
  });
});

// --- DELETE BY payments_main_details_id ---
router.delete("/:payments_main_details_id", (req, res) => {
  const { payments_main_details_id } = req.params;
  const roles = normalizeRoles(req.user.role);
  const isPrivileged = roles.some((r) => PRIVILEGED_ROLES.includes(r));

  const sql = `
    SELECT crs.*, pmd.user_id
    FROM course_revenue_summary crs
    JOIN payments_main_details pmd ON crs.payments_main_details_id = pmd.id
    WHERE crs.payments_main_details_id = ?
    LIMIT 1
  `;

  db.query(sql, [payments_main_details_id], (err, rows) => {
    if (err) {
      logger.error("DB error checking before delete:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "course_revenue_summary not found" });
    }

    const record = rows[0];
    if (!isPrivileged && record.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient privileges" });
    }

    db.query(
      "DELETE FROM course_revenue_summary WHERE payments_main_details_id = ?",
      [payments_main_details_id],
      (err) => {
        if (err) {
          logger.error("DB error deleting course_revenue_summary:", err);
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true, message: "Deleted successfully" });
      }
    );
  });
});

// --- PATCH ---
router.patch("/:payments_main_details_id/:batch_id", (req, res) => {
  const { payments_main_details_id, batch_id } = req.params;
  const { error } = patchSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  }

  const {
    no_of_participants,
    paid_no_of_participants,
    min_paid_no_of_participants,
  } = req.body;

  const roles = normalizeRoles(req.user.role);
  const isPrivileged = roles.some((r) => PRIVILEGED_ROLES.includes(r));

  // Load record
  const sql = `
    SELECT crs.*, pmd.user_id
    FROM course_revenue_summary crs
    JOIN payments_main_details pmd ON crs.payments_main_details_id = pmd.id
    WHERE crs.payments_main_details_id = ? AND crs.batch_id = ?
  `;

  db.query(sql, [payments_main_details_id, batch_id], (err, rows) => {
    if (err) {
      logger.error("DB error fetching for patch:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "course_revenue_summary not found" });
    }

    const record = rows[0];
    if (!isPrivileged && record.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient privileges" });
    }

    let {
      no_of_participants: currentParticipants,
      paid_no_of_participants: currentPaid,
      total_course_revenue,
      revenue_received_total,
    } = record;

    // --- Apply updates in correct order ---
    // 1. update participant count (if provided)
    if (no_of_participants !== undefined) {
      if (no_of_participants < currentPaid) {
        return res.status(400).json({
          error:
            "no_of_participants cannot be less than paid_no_of_participants",
        });
      }
      const perParticipant =
        currentParticipants > 0
          ? total_course_revenue / currentParticipants
          : 0;
      total_course_revenue = perParticipant * no_of_participants;
      currentParticipants = no_of_participants;
    }

    // 2. update paid participants (if provided)
    if (paid_no_of_participants !== undefined) {
      if (paid_no_of_participants > currentParticipants) {
        return res.status(400).json({
          error: "paid_no_of_participants cannot exceed no_of_participants",
        });
      }
      const perParticipant =
        currentParticipants > 0
          ? total_course_revenue / currentParticipants
          : 0;
      revenue_received_total = perParticipant * paid_no_of_participants;
      currentPaid = paid_no_of_participants;
    }

    const all_fees_collected_status = currentPaid === currentParticipants;

    // Save update
    const updateSql = `
      UPDATE course_revenue_summary
      SET no_of_participants = ?,
          paid_no_of_participants = ?,
          min_paid_no_of_participants = ?,
          total_course_revenue = ?,
          revenue_received_total = ?,
          all_fees_collected_status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE payments_main_details_id = ? AND batch_id = ?
    `;

    db.query(
      updateSql,
      [
        currentParticipants,
        currentPaid,
        min_paid_no_of_participants ?? record.min_paid_no_of_participants,
        total_course_revenue,
        revenue_received_total,
        all_fees_collected_status,
        payments_main_details_id,
        batch_id,
      ],
      (err2) => {
        if (err2) {
          logger.error("DB error updating course_revenue_summary:", err2);
          return res.status(500).json({ error: "Database error" });
        }
        res.json({
          success: true,
          no_of_participants: currentParticipants,
          paid_no_of_participants: currentPaid,
          total_course_revenue,
          revenue_received_total,
          all_fees_collected_status,
        });
      }
    );
  });
});

module.exports = router;
