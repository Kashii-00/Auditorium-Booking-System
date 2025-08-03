const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const logger = require("../../logger");
const Joi = require("joi");
const { standardLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

// Rate limiter
// Using standardLimiter for IPv6-compatible rate limiting

router.use(auth.authMiddleware);
router.use(standardLimiter);

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];
const CATEGORY = "Course Development Work";

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
  course_development_work_id: Joi.number().integer().required(),
  item_description: Joi.string().required(),
  required_quantity: Joi.number().integer().min(1).optional(),
  rate: Joi.number().precision(2).min(0).optional(),
  amount: Joi.number().precision(2).min(0).optional(),
});

//POST
router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = req.user;
  const { course_development_work_id, item_description, required_quantity } =
    value;
  let { rate, amount } = value;

  const privileged = isPrivileged(user);

  // Step 1: Validate FK and enforce ownership (no privileged bypass)
  db.query(
    `SELECT cdw.payments_main_details_id, pmd.user_id 
     FROM course_development_work cdw
     JOIN payments_main_details pmd ON cdw.payments_main_details_id = pmd.id
     WHERE cdw.id = ?`,
    [course_development_work_id],
    (err, rows) => {
      if (err) {
        logger.error("FK lookup error:", err);
        return res.status(500).json({ error: "DB error" });
      }
      if (rows.length === 0) {
        return res
          .status(400)
          .json({ error: "Invalid course_development_work_id." });
      }

      const ownerUserId = rows[0].user_id;
      if (user.id !== ownerUserId) {
        return res
          .status(403)
          .json({ error: "Forbidden: Only the owner can create expenses." });
      }

      // Step 2: Lookup rate from rates table
      db.query(
        `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
        [item_description, "Course Development Work"],
        (err2, rateRows) => {
          if (err2) {
            logger.error("Rates lookup error:", err2);
            return res.status(500).json({ error: "DB error" });
          }

          const rateEntry = rateRows[0] || null;

          if (rateEntry) {
            if (
              typeof amount === "number" &&
              typeof rate !== "number" &&
              typeof required_quantity !== "number"
            ) {
              // Cost-only mode — accept user-provided amount
            } else if (rateEntry.rate_type === "Full Payment") {
              if (typeof amount !== "number") {
                return res.status(400).json({
                  error: "Amount must be provided for Full Payment items.",
                });
              }

              // Allow privileged users to override rate
              rate = parseFloat(
                privileged && typeof rate === "number" ? rate : rateEntry.rate
              );

              // Do not modify amount
            } else if (rateEntry.rate_type === "Quantity") {
              if (typeof required_quantity !== "number") {
                return res
                  .status(400)
                  .json({ error: "Quantity is required for this item." });
              }

              // Allow privileged users to override rate
              rate = parseFloat(
                privileged && typeof rate === "number" ? rate : rateEntry.rate
              );

              amount = rate * required_quantity;
            }
          } else {
            // No rate entry found
            if (typeof amount === "number") {
              // Accept cost-only if user provides it
            } else if (privileged) {
              if (
                typeof rate === "number" &&
                typeof required_quantity === "number"
              ) {
                amount = rate * required_quantity;
              } else {
                return res.status(400).json({
                  error:
                    "Privileged users must provide either amount or rate + quantity.",
                });
              }
            } else {
              return res.status(403).json({
                error:
                  "Item not in rates. Non-privileged users must provide amount directly.",
              });
            }
          }

          if (typeof amount !== "number") {
            return res.status(400).json({ error: "Amount is required." });
          }

          // Step 3: Insert into course_development_work_expenses
          db.query(
            `INSERT INTO course_development_work_expenses 
             (course_development_work_id, item_description, required_quantity, rate, amount)
             VALUES (?, ?, ?, ?, ?)`,
            [
              course_development_work_id,
              item_description,
              required_quantity || 0,
              rate || 0,
              amount,
            ],
            (err3) => {
              if (err3) {
                logger.error("Insert error:", err3);
                return res
                  .status(500)
                  .json({ error: "Failed to insert expense." });
              }

              logger.info(
                `Course development expense created by user ${user.id}`
              );
              res.status(201).json({ message: "Expense added." });
            }
          );
        }
      );
    }
  );
});

// // GET
// router.get("/", (req, res) => {
//   const user = req.user;
//   const privileged = isPrivileged(user);

//   let query = `
//     SELECT e.*
//     FROM course_development_work_expenses e
//     JOIN course_development_work w ON e.course_development_work_id = w.id
//     JOIN payments_main_details pmd ON w.payments_main_details_id = pmd.id
//   `;
//   const params = [];

//   if (!privileged) {
//     query += ` WHERE pmd.user_id = ?`;
//     params.push(user.id);
//   }

//   db.query(query, params, (err, rows) => {
//     if (err) {
//       logger.error("GET /course-development-work-expenses error:", err);
//       return res.status(500).json({ error: "Internal server error" });
//     }
//     res.json(rows);
//   });
// });

router.get("/", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  let query = `
    SELECT e.*
    FROM course_development_work_expenses e
    JOIN course_development_work w ON e.course_development_work_id = w.id
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
      logger.error("GET /course-development-work-expenses error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// DELETE
router.delete("/:id", (req, res) => {
  const expenseId = req.params.id;

  db.query(
    `SELECT course_development_work_id FROM course_development_work_expenses WHERE id = ?`,
    [expenseId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      const expense = rows[0];
      if (!expense)
        return res.status(404).json({ error: "Expense not found." });

      db.query(
        `SELECT pmd.user_id
         FROM course_development_work w
         JOIN payments_main_details pmd ON w.payments_main_details_id = pmd.id
         WHERE w.id = ?`,
        [expense.course_development_work_id],
        (err2, detailsRows) => {
          if (err2) return res.status(500).json({ error: "DB error" });
          const isOwner = req.user.id === detailsRows[0]?.user_id;
          const privileged = isPrivileged(req.user);

          if (!isOwner && !privileged) {
            return res
              .status(403)
              .json({ error: "Forbidden: Not authorized to delete." });
          }

          db.query(
            `DELETE FROM course_development_work_expenses WHERE id = ?`,
            [expenseId],
            (err3) => {
              if (err3) {
                logger.error("Delete error:", err3);
                return res
                  .status(500)
                  .json({ error: "Failed to delete expense." });
              }
              logger.info(
                `Expense ${expenseId} deleted by user ${req.user.id}`
              );
              res.json({ message: "Expense deleted." });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
