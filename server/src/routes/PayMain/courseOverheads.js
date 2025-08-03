const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const logger = require("../../logger");
const Joi = require("joi");
const { standardLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

// Using standardLimiter for IPv6-compatible rate limiting


router.use(auth.authMiddleware);
router.use(standardLimiter);

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];
const CATEGORY = "Overheads";

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
  course_overheads_main_id: Joi.number().integer().required(),
  item_description: Joi.string().required(),
  required_quantity: Joi.number().integer().min(1).optional(),
  rate: Joi.number().precision(2).min(0).optional(),
  cost: Joi.number().precision(2).min(0).optional(),
});

// POST /overheads
router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = req.user;
  const {
    course_overheads_main_id,
    item_description,
    required_quantity,
    rate: userRate,
    cost: userCost,
  } = value;

  // Step 1: Validate ownership via course_overheads_main
  db.query(
    `SELECT pmd.user_id
     FROM course_overheads_main com
     JOIN payments_main_details pmd ON com.payments_main_details_id = pmd.id
     WHERE com.id = ?`,
    [course_overheads_main_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res
          .status(400)
          .json({ error: "Invalid course_overheads_main_id." });

      const ownerId = rows[0].user_id;
      if (user.id !== ownerId) {
        return res.status(403).json({
          error: "Forbidden: Only the creator can add overheads.",
        });
      }

      const privileged = isPrivileged(user);

      db.query(
        `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
        [item_description, CATEGORY],
        (rateErr, rateRows) => {
          if (rateErr)
            return res.status(500).json({ error: "Rate lookup failed" });

          const rateEntry = rateRows[0] || null;

          if (!rateEntry) {
            if (typeof userCost === "number") {
              insert(userCost, userRate || 0);
              return;
            } else {
              return res.status(403).json({
                error: "Rate not found for this item. Cost must be provided.",
              });
            }
          }

          const { rate: dbRate, rate_type } = rateEntry;

          if (rate_type === "Full Payment") {
            if (typeof userCost !== "number") {
              return res.status(400).json({
                error: "Cost must be provided for Full Payment items.",
              });
            }
            insert(userCost, userRate || 0);
            return;
          }

          if (rate_type === "Quantity") {
            if (typeof required_quantity !== "number") {
              return res.status(400).json({
                error: "Quantity is required for this item.",
              });
            }

            const finalRate =
              privileged && typeof userRate === "number" ? userRate : dbRate;

            const calculatedCost = required_quantity * finalRate;

            insert(calculatedCost, finalRate);
            return;
          }

          return res.status(400).json({ error: "Unsupported rate type." });

          function insert(cost, rate) {
            db.query(
              `INSERT INTO overheads
              (course_overheads_main_id, item_description, required_quantity, rate, cost)
              VALUES (?, ?, ?, ?, ?)`,
              [
                course_overheads_main_id,
                item_description,
                required_quantity || 0,
                rate || 0,
                cost,
              ],
              (insertErr) => {
                if (insertErr) {
                  logger.error("Insert error:", insertErr);
                  return res
                    .status(500)
                    .json({ error: "Failed to insert item." });
                }
                logger.info(`Overhead created by user ${user.id}`);
                res.status(201).json({ message: "Overhead item created." });
              }
            );
          }
        }
      );
    }
  );
});

// GET /overheads
router.get("/", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  let query = `
    SELECT oh.*
    FROM overheads oh
    JOIN course_overheads_main com ON oh.course_overheads_main_id = com.id
    JOIN payments_main_details pmd ON com.payments_main_details_id = pmd.id
  `;
  const params = [];

  if (!privileged) {
    query += ` WHERE pmd.user_id = ?`;
    params.push(user.id);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      logger.error("GET /overheads error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// DELETE /overheads/:id
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT oh.course_overheads_main_id, pmd.user_id
     FROM overheads oh
     JOIN course_overheads_main com ON oh.course_overheads_main_id = com.id
     JOIN payments_main_details pmd ON com.payments_main_details_id = pmd.id
     WHERE oh.id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Item not found." });

      const isOwner = req.user.id === rows[0].user_id;
      const isPrivilegedUser = isPrivileged(req.user);

      if (!isOwner && !isPrivilegedUser) {
        return res
          .status(403)
          .json({ error: "Forbidden: Not authorized to delete." });
      }

      db.query(`DELETE FROM overheads WHERE id = ?`, [id], (err3) => {
        if (err3) {
          logger.error("Delete error:", err3);
          return res.status(500).json({ error: "Failed to delete item." });
        }
        logger.info(`Overhead ${id} deleted by user ${req.user.id}`);
        res.json({ message: "Item deleted." });
      });
    }
  );
});

module.exports = router;

// const express = require("express");
// const db = require("../../db");
// const auth = require("../../auth");
// const logger = require("../../logger");
// const Joi = require("joi");
// const rateLimit = require("express-rate-limit");

// const router = express.Router();

// // Using standardLimiter for IPv6-compatible rate limiting
//   },
// });

// router.use(auth.authMiddleware);
// router.use(standardLimiter);

// const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];
// const CATEGORY = "Overheads";

// function normalizeRoles(rawRole) {
//   if (!rawRole) return [];
//   if (Array.isArray(rawRole)) return rawRole;
//   if (typeof rawRole === "string") {
//     try {
//       return JSON.parse(rawRole);
//     } catch {
//       return [rawRole];
//     }
//   }
//   return [];
// }

// function isPrivileged(user) {
//   const roles = normalizeRoles(user.role);
//   return roles.some((r) => PRIVILEGED_ROLES.includes(r));
// }

// const schema = Joi.object({
//   payments_main_details_id: Joi.number().integer().required(),
//   item_description: Joi.string().required(),
//   required_quantity: Joi.number().integer().min(1).optional(),
//   rate: Joi.number().precision(2).min(0).optional(),
//   cost: Joi.number().precision(2).min(0).optional(),
// });

// // POST /overheads
// router.post("/", (req, res) => {
//   const { error, value } = schema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   const user = req.user;
//   const {
//     payments_main_details_id,
//     item_description,
//     required_quantity,
//     rate: userRate,
//     cost: userCost,
//   } = value;

//   db.query(
//     `SELECT user_id FROM payments_main_details WHERE id = ?`,
//     [payments_main_details_id],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: "DB error" });
//       if (rows.length === 0)
//         return res
//           .status(400)
//           .json({ error: "Invalid payments_main_details_id." });

//       const ownerId = rows[0].user_id;
//       if (user.id !== ownerId) {
//         return res.status(403).json({
//           error:
//             "Forbidden: Only the creator of this record can add overheads.",
//         });
//       }

//       const privileged = isPrivileged(user);

//       db.query(
//         `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
//         [item_description, CATEGORY],
//         (rateErr, rateRows) => {
//           if (rateErr)
//             return res.status(500).json({ error: "Rate lookup failed" });

//           const rateEntry = rateRows[0] || null;

//           if (!rateEntry) {
//             if (typeof userCost === "number") {
//               insert(userCost, userRate || 0);
//               return;
//             } else {
//               return res.status(403).json({
//                 error: "Rate not found for this item. Cost must be provided.",
//               });
//             }
//           }

//           const { rate: dbRate, rate_type } = rateEntry;

//           if (rate_type === "Full Payment") {
//             if (typeof userCost !== "number") {
//               return res.status(400).json({
//                 error: "Cost must be provided for Full Payment items.",
//               });
//             }
//             insert(userCost, userRate || 0);
//             return;
//           }

//           if (rate_type === "Quantity") {
//             if (typeof required_quantity !== "number") {
//               return res.status(400).json({
//                 error: "Quantity is required for this item.",
//               });
//             }

//             const finalRate =
//               privileged && typeof userRate === "number" ? userRate : dbRate;

//             const calculatedCost = required_quantity * finalRate;

//             insert(calculatedCost, finalRate);
//             return;
//           }

//           return res.status(400).json({ error: "Unsupported rate type." });

//           function insert(cost, rate) {
//             db.query(
//               `INSERT INTO overheads
//               (payments_main_details_id, item_description, required_quantity, rate, cost)
//               VALUES (?, ?, ?, ?, ?)`,
//               [
//                 payments_main_details_id,
//                 item_description,
//                 required_quantity || 0,
//                 rate || 0,
//                 cost,
//               ],
//               (insertErr) => {
//                 if (insertErr) {
//                   logger.error("Insert error:", insertErr);
//                   return res
//                     .status(500)
//                     .json({ error: "Failed to insert item." });
//                 }
//                 logger.info(`Overhead created by user ${user.id}`);
//                 res.status(201).json({ message: "Overhead item created." });
//               }
//             );
//           }
//         }
//       );
//     }
//   );
// });

// // GET /overheads
// router.get("/", (req, res) => {
//   const user = req.user;
//   const privileged = isPrivileged(user);

//   let query = `
//     SELECT oh.*
//     FROM overheads oh
//     JOIN payments_main_details pmd ON oh.payments_main_details_id = pmd.id
//   `;
//   const params = [];

//   if (!privileged) {
//     query += ` WHERE pmd.user_id = ?`;
//     params.push(user.id);
//   }

//   db.query(query, params, (err, rows) => {
//     if (err) {
//       logger.error("GET /overheads error:", err);
//       return res.status(500).json({ error: "Internal server error" });
//     }
//     res.json(rows);
//   });
// });

// // DELETE /overheads/:id
// router.delete("/:id", (req, res) => {
//   const id = req.params.id;

//   db.query(
//     `SELECT payments_main_details_id FROM overheads WHERE id = ?`,
//     [id],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: "DB error" });
//       if (rows.length === 0)
//         return res.status(404).json({ error: "Item not found." });

//       const overhead = rows[0];
//       db.query(
//         `SELECT user_id FROM payments_main_details WHERE id = ?`,
//         [overhead.payments_main_details_id],
//         (err2, details) => {
//           if (err2) return res.status(500).json({ error: "DB error" });
//           const isOwner = req.user.id === details[0].user_id;
//           const isPrivilegedUser = isPrivileged(req.user);

//           if (!isOwner && !isPrivilegedUser) {
//             return res
//               .status(403)
//               .json({ error: "Forbidden: Not authorized to delete." });
//           }

//           db.query(`DELETE FROM overheads WHERE id = ?`, [id], (err3) => {
//             if (err3) {
//               logger.error("Delete error:", err3);
//               return res.status(500).json({ error: "Failed to delete item." });
//             }
//             logger.info(`Overhead ${id} deleted by user ${req.user.id}`);
//             res.json({ message: "Item deleted." });
//           });
//         }
//       );
//     }
//   );
// });

// module.exports = router;
