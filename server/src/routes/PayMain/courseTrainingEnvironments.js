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
const CATEGORY = "Course Delivery (Teaching Env)";

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
  required_hours: Joi.number().integer().min(0).optional(),
  hourly_rate: Joi.number().precision(2).min(0).optional(),
  cost: Joi.number().precision(2).min(0).optional(),
});

router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = req.user;
  const {
    course_overheads_main_id,
    item_description,
    required_hours,
    hourly_rate: userHourlyRate,
    cost: userCost,
  } = value;

  // Step 1: Verify course_overheads_main ownership via nested join
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
          error: "Forbidden: Only the creator can add training environments.",
        });
      }

      const privileged = isPrivileged(user);

      // Step 2: Lookup rate
      db.query(
        `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
        [item_description, CATEGORY],
        (rateErr, rateRows) => {
          if (rateErr)
            return res.status(500).json({ error: "Rate lookup failed" });

          const rateEntry = rateRows[0] || null;

          if (!rateEntry) {
            if (typeof userCost === "number") {
              const safeHours =
                typeof required_hours === "number" ? required_hours : 0;
              insert(userCost, userHourlyRate || 0, safeHours);
              return;
            } else {
              return res.status(403).json({
                error: "Rate not found for this item. Cost must be provided.",
              });
            }
          }

          const { rate: dbRate, rate_type } = rateEntry;

          if (rate_type === "Hourly") {
            if (typeof required_hours !== "number") {
              return res.status(400).json({
                error: "Hours are required for this item.",
              });
            }

            const finalHourlyRate =
              privileged && typeof userHourlyRate === "number"
                ? userHourlyRate
                : dbRate;

            const calculatedCost = required_hours * finalHourlyRate;
            insert(calculatedCost, finalHourlyRate, required_hours);
            return;
          }

          return res.status(400).json({ error: "Unsupported rate type." });

          function insert(cost, hourlyRate, hours) {
            db.query(
              `INSERT INTO training_environments
              (course_overheads_main_id, item_description, required_hours, hourly_rate, cost)
              VALUES (?, ?, ?, ?, ?)`,
              [
                course_overheads_main_id,
                item_description,
                hours,
                hourlyRate,
                cost,
              ],
              (insertErr) => {
                if (insertErr) {
                  logger.error("Insert error:", insertErr);
                  return res
                    .status(500)
                    .json({ error: "Failed to insert item." });
                }
                logger.info(`Training environment created by user ${user.id}`);
                res
                  .status(201)
                  .json({ message: "Training environment created." });
              }
            );
          }
        }
      );
    }
  );
});

// GET - List all training environment entries
router.get("/", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  let query = `
    SELECT te.*
    FROM training_environments te
    JOIN course_overheads_main com ON te.course_overheads_main_id = com.id
    JOIN payments_main_details pmd ON com.payments_main_details_id = pmd.id
  `;
  const params = [];

  if (!privileged) {
    query += ` WHERE pmd.user_id = ?`;
    params.push(user.id);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      logger.error("GET /training-environments error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// DELETE - Remove training environment entry
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT te.course_overheads_main_id, pmd.user_id
     FROM training_environments te
     JOIN course_overheads_main com ON te.course_overheads_main_id = com.id
     JOIN payments_main_details pmd ON com.payments_main_details_id = pmd.id
     WHERE te.id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Item not found." });

      const isOwner = req.user.id === rows[0].user_id;
      const isPrivilegedUser = isPrivileged(req.user);

      if (!isOwner && !isPrivilegedUser) {
        return res.status(403).json({
          error: "Forbidden: Not authorized to delete.",
        });
      }

      db.query(
        `DELETE FROM training_environments WHERE id = ?`,
        [id],
        (err3) => {
          if (err3) {
            logger.error("Delete error:", err3);
            return res.status(500).json({ error: "Failed to delete item." });
          }
          logger.info(
            `Training environment ${id} deleted by user ${req.user.id}`
          );
          res.json({ message: "Item deleted." });
        }
      );
    }
  );
});

module.exports = router;

// // routes/trainingEnvironments.js
// const express = require("express");
// const db = require("../../db");
// const auth = require("../../auth");
// const logger = require("../../logger");
// const Joi = require("joi");
// const rateLimit = require("express-rate-limit");

// const router = express.Router();

// const limiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 15,
//   keyGenerator: (req) => req.user?.id || req.ip,
//   handler: (req, res) => {
//     res
//       .status(429)
//       .json({ error: "Too many requests. Please try again later." });
//   },
// });

// router.use(auth.authMiddleware);
// router.use(limiter);

// const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];
// const CATEGORY = "Course Delivery (Teaching Env)";

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
//   required_hours: Joi.number().integer().min(0).optional(),
//   hourly_rate: Joi.number().precision(2).min(0).optional(),
//   cost: Joi.number().precision(2).min(0).optional(),
// });

// router.post("/", (req, res) => {
//   const { error, value } = schema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   const user = req.user;
//   const {
//     payments_main_details_id,
//     item_description,
//     required_hours,
//     hourly_rate: userHourlyRate,
//     cost: userCost,
//   } = value;

//   // Step 1: FK and ownership check
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
//             "Forbidden: Only the creator of this record can add training environments.",
//         });
//       }

//       const privileged = isPrivileged(user);

//       // Step 2: Lookup rate
//       db.query(
//         `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
//         [item_description, CATEGORY],
//         (rateErr, rateRows) => {
//           if (rateErr)
//             return res.status(500).json({ error: "Rate lookup failed" });

//           const rateEntry = rateRows[0] || null;

//           if (!rateEntry) {
//             // Accept cost-only if provided
//             if (typeof userCost === "number") {
//               const safeHours =
//                 typeof required_hours === "number" ? required_hours : 0;
//               insert(userCost, userHourlyRate || 0, safeHours);
//               return;
//             } else {
//               return res.status(403).json({
//                 error: "Rate not found for this item. Cost must be provided.",
//               });
//             }
//           }

//           const { rate: dbRate, rate_type } = rateEntry;

//           if (rate_type === "Hourly") {
//             if (typeof required_hours !== "number") {
//               return res.status(400).json({
//                 error: "Hours are required for this item.",
//               });
//             }

//             const finalHourlyRate =
//               privileged && typeof userHourlyRate === "number"
//                 ? userHourlyRate
//                 : dbRate;

//             const calculatedCost = required_hours * finalHourlyRate;
//             insert(calculatedCost, finalHourlyRate, required_hours);
//             return;
//           }

//           return res.status(400).json({ error: "Unsupported rate type." });

//           function insert(cost, hourlyRate, hours) {
//             db.query(
//               `INSERT INTO training_environments
//               (payments_main_details_id, item_description, required_hours, hourly_rate, cost)
//               VALUES (?, ?, ?, ?, ?)`,
//               [
//                 payments_main_details_id,
//                 item_description,
//                 hours,
//                 hourlyRate,
//                 cost,
//               ],
//               (insertErr) => {
//                 if (insertErr) {
//                   logger.error("Insert error:", insertErr);
//                   return res
//                     .status(500)
//                     .json({ error: "Failed to insert item." });
//                 }
//                 logger.info(`Training environment created by user ${user.id}`);
//                 res
//                   .status(201)
//                   .json({ message: "Training environment created." });
//               }
//             );
//           }
//         }
//       );
//     }
//   );
// });

// // GET - List all training environment entries
// router.get("/", (req, res) => {
//   const user = req.user;
//   const privileged = isPrivileged(user);

//   let query = `
//     SELECT te.*
//     FROM training_environments te
//     JOIN payments_main_details pmd ON te.payments_main_details_id = pmd.id
//   `;
//   const params = [];

//   if (!privileged) {
//     query += ` WHERE pmd.user_id = ?`;
//     params.push(user.id);
//   }

//   db.query(query, params, (err, rows) => {
//     if (err) {
//       logger.error("GET /training-environments error:", err);
//       return res.status(500).json({ error: "Internal server error" });
//     }
//     res.json(rows);
//   });
// });

// // DELETE - Remove training environment entry
// router.delete("/:id", (req, res) => {
//   const id = req.params.id;

//   db.query(
//     `SELECT payments_main_details_id FROM training_environments WHERE id = ?`,
//     [id],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: "DB error" });
//       if (rows.length === 0)
//         return res.status(404).json({ error: "Item not found." });

//       const record = rows[0];
//       db.query(
//         `SELECT user_id FROM payments_main_details WHERE id = ?`,
//         [record.payments_main_details_id],
//         (err2, result) => {
//           if (err2) return res.status(500).json({ error: "DB error" });

//           const isOwner = req.user.id === result[0].user_id;
//           const isPrivilegedUser = isPrivileged(req.user);

//           if (!isOwner && !isPrivilegedUser) {
//             return res.status(403).json({
//               error: "Forbidden: Not authorized to delete.",
//             });
//           }

//           db.query(
//             `DELETE FROM training_environments WHERE id = ?`,
//             [id],
//             (err3) => {
//               if (err3) {
//                 logger.error("Delete error:", err3);
//                 return res
//                   .status(500)
//                   .json({ error: "Failed to delete item." });
//               }
//               logger.info(
//                 `Training environment ${id} deleted by user ${req.user.id}`
//               );
//               res.json({ message: "Item deleted." });
//             }
//           );
//         }
//       );
//     }
//   );
// });

// module.exports = router;
