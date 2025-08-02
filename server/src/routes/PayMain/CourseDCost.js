const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const logger = require("../../logger");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");

const router = express.Router();

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

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];

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
  payments_main_details_id: Joi.number().required(),
  Md_approval_obtained: Joi.string().allow(null, "").optional(),
  Md_details: Joi.string().allow(null, "").optional(),
  total_cost: Joi.number().precision(2).optional(),
});

router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = req.user;
  const {
    payments_main_details_id,
    Md_approval_obtained,
    Md_details,
    total_cost,
  } = value;

  db.query(
    `SELECT user_id FROM payments_main_details WHERE id = ?`,
    [payments_main_details_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res
          .status(400)
          .json({ error: "Invalid payments_main_details_id" });

      if (rows[0].user_id !== user.id) {
        return res
          .status(403)
          .json({ error: "Only the owner can create this record" });
      }

      db.query(
        `INSERT INTO course_delivery_costs (payments_main_details_id, Md_approval_obtained, Md_details, total_cost)
         VALUES (?, ?, ?, ?)`,
        [
          payments_main_details_id,
          Md_approval_obtained,
          Md_details,
          total_cost,
        ],
        (insertErr, result) => {
          if (insertErr) {
            logger.error("Insert error:", insertErr);
            return res.status(500).json({ error: "Failed to create record" });
          }
          logger.info(`Course delivery cost created by user ${user.id}`);
          res.status(201).json({
            message: "Course delivery cost created",
            id: result.insertId,
          });
        }
      );
    }
  );
});

router.get("/", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  let query = `
    SELECT cdc.*
    FROM course_delivery_costs cdc
    JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
  `;
  const params = [];

  if (!privileged) {
    query += ` WHERE pmd.user_id = ?`;
    params.push(user.id);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      logger.error("GET /course-delivery-costs error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT payments_main_details_id FROM course_delivery_costs WHERE id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Record not found" });

      const paymentsMainId = rows[0].payments_main_details_id;

      db.query(
        `SELECT user_id FROM payments_main_details WHERE id = ?`,
        [paymentsMainId],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: "DB error" });

          const isOwner =
            result.length > 0 && result[0].user_id === req.user.id;
          const isPrivilegedUser = isPrivileged(req.user);

          if (!isOwner && !isPrivilegedUser) {
            return res.status(403).json({ error: "Not authorized to delete" });
          }

          db.query(
            `DELETE FROM course_delivery_costs WHERE id = ?`,
            [id],
            (err3) => {
              if (err3) {
                logger.error("Delete error:", err3);
                return res.status(500).json({ error: "Delete failed" });
              }
              logger.info(
                `Course delivery cost ${id} deleted by user ${req.user.id}`
              );
              res.json({ message: "Record deleted" });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
