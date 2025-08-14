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
  courseBatch_id: Joi.number().integer().required(),
});

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

  const { payments_main_details_id, courseBatch_id } = req.body;

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
              courseBatch_id,
              no_of_participants,
              paid_no_of_participants,
              total_course_revenue,
              revenue_received_total,
              all_fees_collected_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          const insertValues = [
            payments_main_details_id,
            courseBatch_id,
            no_of_participants,
            0,
            total_course_revenue,
            0,
            false,
          ];

          db.query(insertSql, insertValues, (err, result) => {
            if (err) {
              logger.error("Error inserting course_revenue_summary:", err);
              return res.status(500).json({ error: "Database error" });
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

module.exports = router;
