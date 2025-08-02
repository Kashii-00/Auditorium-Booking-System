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
const CATEGORY = "Course Delivery Human Resources";

function normalizeRoles(rawRole) {
  if (!rawRole) return [];
  if (Array.isArray(rawRole)) return rawRole;
  if (typeof rawRole === "string") {
    try {
      return JSON.parse(rawRole);
    } catch {
      return [rawRole];
    }
  }
  return [];
}

function isPrivileged(user) {
  const roles = normalizeRoles(user.role);
  return roles.some((r) => PRIVILEGED_ROLES.includes(r));
}

const schema = Joi.object({
  course_delivery_cost_id: Joi.number().integer().required(),
  role: Joi.string().required(),
  no_of_officers: Joi.number().integer().min(1).optional(),
  hours: Joi.number().integer().min(1).optional(),
  rate: Joi.number().precision(2).min(0).optional(),
  amount: Joi.number().precision(2).min(0).optional(),
});

router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = req.user;
  const {
    course_delivery_cost_id,
    role,
    no_of_officers,
    hours,
    rate: userRate,
    amount: userAmount,
  } = value;

  // Step 1: Confirm ownership via course_delivery_costs → payments_main_details
  db.query(
    `SELECT pmd.user_id FROM course_delivery_costs cdc
       JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
       WHERE cdc.id = ?`,
    [course_delivery_cost_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res
          .status(400)
          .json({ error: "Invalid course_delivery_cost_id." });

      const ownerId = rows[0].user_id;
      if (user.id !== ownerId) {
        return res.status(403).json({
          error: "Forbidden: Only the owner can add cost items.",
        });
      }

      const privileged = isPrivileged(user);

      // Step 2: Rate lookup
      db.query(
        `SELECT rate, rate_type FROM rates WHERE item_description = ? AND category = ?`,
        [role, CATEGORY],
        (rateErr, rateRows) => {
          if (rateErr)
            return res.status(500).json({ error: "Rate lookup failed." });

          if (rateRows.length === 0) {
            return res.status(403).json({
              error:
                "Rate not found for this role under Course Delivery Human Resources.",
            });
          }

          const { rate: dbRate, rate_type } = rateRows[0];

          if (rate_type === "Hourly") {
            // Require no_of_officers and hours
            if (
              typeof no_of_officers !== "number" ||
              typeof hours !== "number"
            ) {
              return res.status(400).json({
                error:
                  "no_of_officers and hours are required for Hourly rate type.",
              });
            }

            // Privileged users can override rate
            const finalRate =
              privileged && typeof userRate === "number" ? userRate : dbRate;

            const calculatedAmount = no_of_officers * hours * finalRate;

            insert(calculatedAmount, finalRate);
            return;
          }

          if (rate_type === "Full Payment") {
            // User must provide amount
            if (typeof userAmount !== "number") {
              return res.status(400).json({
                error: "Amount must be provided for Full Payment rate type.",
              });
            }

            insert(userAmount, userRate || 0);
            return;
          }

          return res.status(400).json({ error: "Unsupported rate type." });

          // Insert function
          function insert(amount, rate) {
            db.query(
              `INSERT INTO course_delivery_cost_items
                 (course_delivery_cost_id, role, no_of_officers, hours, rate, amount)
                 VALUES (?, ?, ?, ?, ?, ?)`,
              [
                course_delivery_cost_id,
                role,
                no_of_officers || 0,
                hours || 0,
                rate || 0,
                amount,
              ],
              (insertErr) => {
                if (insertErr) {
                  logger.error("Insert error:", insertErr);
                  return res.status(500).json({ error: "Insert failed." });
                }
                logger.info(
                  `Course delivery cost item added by user ${user.id}`
                );
                res.status(201).json({ message: "Cost item created." });
              }
            );
          }
        }
      );
    }
  );
});

// GET all cost items (privileged can see all, others see only theirs)
router.get("/", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  let query = `
    SELECT cdcit.*
    FROM course_delivery_cost_items cdcit
    JOIN course_delivery_costs cdc ON cdcit.course_delivery_cost_id = cdc.id
    JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
  `;
  const params = [];

  if (!privileged) {
    query += ` WHERE pmd.user_id = ?`;
    params.push(user.id);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      logger.error("GET /course-delivery-cost-items error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// DELETE by id
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT course_delivery_cost_id FROM course_delivery_cost_items WHERE id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Item not found." });

      const courseDeliveryCostId = rows[0].course_delivery_cost_id;

      db.query(
        `SELECT pmd.user_id FROM course_delivery_costs cdc
         JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
         WHERE cdc.id = ?`,
        [courseDeliveryCostId],
        (err2, details) => {
          if (err2) return res.status(500).json({ error: "DB error" });

          if (details.length === 0)
            return res.status(404).json({ error: "Owner not found." });

          const isOwner = req.user.id === details[0].user_id;
          const isPrivilegedUser = isPrivileged(req.user);

          if (!isOwner && !isPrivilegedUser) {
            return res
              .status(403)
              .json({ error: "Forbidden: Not authorized to delete." });
          }

          db.query(
            `DELETE FROM course_delivery_cost_items WHERE id = ?`,
            [id],
            (err3) => {
              if (err3) {
                logger.error("Delete error:", err3);
                return res
                  .status(500)
                  .json({ error: "Failed to delete item." });
              }
              logger.info(
                `Course delivery item ${id} deleted by user ${req.user.id}`
              );
              res.json({ message: "Item deleted." });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
