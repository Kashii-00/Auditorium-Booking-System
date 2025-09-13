const express = require("express");
const db = require("../../../db");
const auth = require("../../../auth");
const logger = require("../../../logger");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  },
});

router.use(auth.authMiddleware);
router.use(limiter);

const PRIVILEGED_ROLES = ["SuperAdmin", "admin", "finance_manager"];

function normalizeRoles(rawRole) {
  if (!rawRole) return [];
  if (Array.isArray(rawRole)) return rawRole;
  try {
    return JSON.parse(rawRole);
  } catch {
    return [rawRole];
  }
}

function isPrivileged(user) {
  const roles = normalizeRoles(user.role);
  return roles.some((r) => PRIVILEGED_ROLES.includes(r));
}

const schema = Joi.object({
  payments_main_details_id: Joi.number().integer().required(),
  no_of_panel_meetings: Joi.number().integer().min(0).required(),
  total_cost: Joi.number().precision(2).min(0).optional(),
});

// POST /api/course-development-work
router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { payments_main_details_id, no_of_panel_meetings, total_cost } = value;
  const user = req.user;

  // Step 1: Ensure user owns the payment record
  db.query(
    `SELECT user_id FROM payments_main_details WHERE id = ?`,
    [payments_main_details_id],
    (err, rows) => {
      if (err) {
        logger.error("FK lookup error:", err);
        return res.status(500).json({ error: "DB error" });
      }

      if (rows.length === 0) {
        return res
          .status(400)
          .json({ error: "Invalid payments_main_details_id." });
      }

      if (rows[0].user_id !== user.id) {
        return res.status(403).json({
          error:
            "Forbidden: Only the owner of this payment can add development work.",
        });
      }

      // Step 2: Insert record (total_cost optional)
      const insertQuery =
        total_cost !== undefined
          ? `INSERT INTO course_development_work 
               (payments_main_details_id, no_of_panel_meetings, total_cost) 
             VALUES (?, ?, ?)`
          : `INSERT INTO course_development_work 
               (payments_main_details_id, no_of_panel_meetings) 
             VALUES (?, ?)`;

      const insertParams =
        total_cost !== undefined
          ? [payments_main_details_id, no_of_panel_meetings, total_cost]
          : [payments_main_details_id, no_of_panel_meetings];

      db.query(insertQuery, insertParams, (err2) => {
        if (err2) {
          logger.error("Insert error:", err2);
          return res.status(500).json({ error: "Failed to create record." });
        }

        logger.info(`Course development work added by user ${user.id}`);
        res.status(201).json({ message: "Course development work created." });
      });
    }
  );
});

router.get("/", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  let query = `
    SELECT w.*
    FROM course_development_work w
    JOIN payments_main_details pmd ON w.payments_main_details_id = pmd.id
  `;

  const conditions = [];
  const params = [];

  if (!privileged) {
    conditions.push("pmd.user_id = ?");
    params.push(user.id);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      logger.error("GET /course-development-work error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const privileged = isPrivileged(user);

  db.query(
    `SELECT w.payments_main_details_id, pmd.user_id
       FROM course_development_work w
       JOIN payments_main_details pmd ON w.payments_main_details_id = pmd.id
       WHERE w.id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Record not found." });

      const isOwner = rows[0].user_id === user.id;
      if (!isOwner && !privileged) {
        return res.status(403).json({
          error: "Forbidden: Not authorized to delete this record.",
        });
      }

      db.query(
        `DELETE FROM course_development_work WHERE id = ?`,
        [id],
        (err2) => {
          if (err2) {
            logger.error("Delete error:", err2);
            return res.status(500).json({ error: "Failed to delete." });
          }
          logger.info(
            `Course development work ${id} deleted by user ${user.id}`
          );
          res.json({ message: "Deleted successfully." });
        }
      );
    }
  );
});

module.exports = router;
