// routes/trainingTeachingAids.js
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
const CATEGORY = "Course Delivery (Teaching Aid)";

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
  required_hours: Joi.number().integer().min(1).optional(),
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
    required_quantity,
    required_hours,
    hourly_rate: userHourlyRate,
    cost: userCost,
  } = value;

  // Step 1: Check ownership via course_overheads_main → payments_main_details → user
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
          error: "Forbidden: Only the creator can add teaching aids.",
        });
      }

      const privileged = isPrivileged(user);

      // Step 2: Check rate entry first
      db.query(
        `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
        [item_description, CATEGORY],
        (rateErr, rateRows) => {
          if (rateErr)
            return res.status(500).json({ error: "Rate lookup failed" });

          const rateEntry = rateRows[0] || null;

          if (!rateEntry) {
            if (typeof userCost === "number") {
              insert(userCost, userHourlyRate || 0);
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
            insert(userCost, userHourlyRate || 0);
            return;
          }

          if (rate_type === "Quantity_Hourly") {
            if (
              typeof required_quantity !== "number" ||
              typeof required_hours !== "number"
            ) {
              return res.status(400).json({
                error: "Quantity and hours are required for this item.",
              });
            }

            const finalHourlyRate =
              privileged && typeof userHourlyRate === "number"
                ? userHourlyRate
                : dbRate;

            const calculatedCost =
              required_quantity * required_hours * finalHourlyRate;

            insert(calculatedCost, finalHourlyRate);
            return;
          }

          return res.status(400).json({ error: "Unsupported rate type." });

          function insert(cost, hourlyRate) {
            db.query(
              `INSERT INTO training_teaching_aids
              (course_overheads_main_id, item_description, required_quantity, required_hours, hourly_rate, cost)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                course_overheads_main_id,
                item_description,
                required_quantity || 0,
                required_hours || 0,
                hourlyRate || 0,
                cost,
              ],
              (insertErr) => {
                if (insertErr) {
                  logger.error("Insert error:", insertErr);
                  return res
                    .status(500)
                    .json({ error: "Failed to insert item." });
                }
                logger.info(`Teaching aid created by user ${user.id}`);
                res.status(201).json({ message: "Teaching aid created." });
              }
            );
          }
        }
      );
    }
  );
});

router.get("/", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  let query = `
    SELECT tta.*
    FROM training_teaching_aids tta
    JOIN course_overheads_main com ON tta.course_overheads_main_id = com.id
    JOIN payments_main_details pmd ON com.payments_main_details_id = pmd.id
  `;
  const params = [];

  if (!privileged) {
    query += ` WHERE pmd.user_id = ?`;
    params.push(user.id);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      logger.error("GET /training-teaching-aids error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT tta.course_overheads_main_id, pmd.user_id
     FROM training_teaching_aids tta
     JOIN course_overheads_main com ON tta.course_overheads_main_id = com.id
     JOIN payments_main_details pmd ON com.payments_main_details_id = pmd.id
     WHERE tta.id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Item not found." });

      const { user_id } = rows[0];
      const isOwner = req.user.id === user_id;
      const isPrivilegedUser = isPrivileged(req.user);

      if (!isOwner && !isPrivilegedUser) {
        return res
          .status(403)
          .json({ error: "Forbidden: Not authorized to delete." });
      }

      db.query(
        `DELETE FROM training_teaching_aids WHERE id = ?`,
        [id],
        (err3) => {
          if (err3) {
            logger.error("Delete error:", err3);
            return res.status(500).json({ error: "Failed to delete item." });
          }
          logger.info(`Teaching aid ${id} deleted by user ${req.user.id}`);
          res.json({ message: "Item deleted." });
        }
      );
    }
  );
});

module.exports = router;

// // routes/trainingTeachingAids.js
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
// const CATEGORY = "Course Delivery (Teaching Aid)";

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
//   required_hours: Joi.number().integer().min(1).optional(),
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
//     required_quantity,
//     required_hours,
//     hourly_rate: userHourlyRate,
//     cost: userCost,
//   } = value;

//   // Step 1: Check FK exists and ownership
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
//             "Forbidden: Only the creator of this record can add teaching aids.",
//         });
//       }

//       const privileged = isPrivileged(user);

//       // Step 2: Check rate entry first
//       db.query(
//         `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
//         [item_description, CATEGORY],
//         (rateErr, rateRows) => {
//           if (rateErr)
//             return res.status(500).json({ error: "Rate lookup failed" });

//           const rateEntry = rateRows[0] || null;

//           // If rate entry NOT found:
//           if (!rateEntry) {
//             if (typeof userCost === "number") {
//               // Accept user-provided cost if given
//               insert(userCost, userHourlyRate || 0);
//               return;
//             } else {
//               // Reject if no cost provided
//               return res.status(403).json({
//                 error: "Rate not found for this item. Cost must be provided.",
//               });
//             }
//           }

//           // Rate entry exists
//           const { rate: dbRate, rate_type } = rateEntry;

//           if (rate_type === "Full Payment") {
//             if (typeof userCost !== "number") {
//               return res.status(400).json({
//                 error: "Cost must be provided for Full Payment items.",
//               });
//             }
//             // Accept user provided cost as-is
//             insert(userCost, userHourlyRate || 0);
//             return;
//           }

//           if (rate_type === "Quantity_Hourly") {
//             if (
//               typeof required_quantity !== "number" ||
//               typeof required_hours !== "number"
//             ) {
//               return res.status(400).json({
//                 error: "Quantity and hours are required for this item.",
//               });
//             }

//             // Privileged users can override hourly rate, else use DB rate
//             const finalHourlyRate =
//               privileged && typeof userHourlyRate === "number"
//                 ? userHourlyRate
//                 : dbRate;

//             // Calculate cost (ignore userCost even if provided)
//             const calculatedCost =
//               required_quantity * required_hours * finalHourlyRate;

//             insert(calculatedCost, finalHourlyRate);
//             return;
//           }

//           return res.status(400).json({ error: "Unsupported rate type." });

//           function insert(cost, hourlyRate) {
//             db.query(
//               `INSERT INTO training_teaching_aids
//               (payments_main_details_id, item_description, required_quantity, required_hours, hourly_rate, cost)
//               VALUES (?, ?, ?, ?, ?, ?)`,
//               [
//                 payments_main_details_id,
//                 item_description,
//                 required_quantity || 0,
//                 required_hours || 0,
//                 hourlyRate || 0,
//                 cost,
//               ],
//               (insertErr) => {
//                 if (insertErr) {
//                   logger.error("Insert error:", insertErr);
//                   return res
//                     .status(500)
//                     .json({ error: "Failed to insert item." });
//                 }
//                 logger.info(`Teaching aid created by user ${user.id}`);
//                 res.status(201).json({ message: "Teaching aid created." });
//               }
//             );
//           }
//         }
//       );
//     }
//   );
// });

// router.get("/", (req, res) => {
//   const user = req.user;
//   const privileged = isPrivileged(user);

//   let query = `
//     SELECT tta.*
//     FROM training_teaching_aids tta
//     JOIN payments_main_details pmd ON tta.payments_main_details_id = pmd.id
//   `;
//   const params = [];

//   if (!privileged) {
//     query += ` WHERE pmd.user_id = ?`;
//     params.push(user.id);
//   }

//   db.query(query, params, (err, rows) => {
//     if (err) {
//       logger.error("GET /training-teaching-aids error:", err);
//       return res.status(500).json({ error: "Internal server error" });
//     }
//     res.json(rows);
//   });
// });

// router.delete("/:id", (req, res) => {
//   const id = req.params.id;

//   db.query(
//     `SELECT payments_main_details_id FROM training_teaching_aids WHERE id = ?`,
//     [id],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: "DB error" });
//       if (rows.length === 0)
//         return res.status(404).json({ error: "Item not found." });

//       const trainingAid = rows[0];
//       db.query(
//         `SELECT user_id FROM payments_main_details WHERE id = ?`,
//         [trainingAid.payments_main_details_id],
//         (err2, details) => {
//           if (err2) return res.status(500).json({ error: "DB error" });
//           const isOwner = req.user.id === details[0].user_id;
//           const isPrivilegedUser = isPrivileged(req.user);

//           if (!isOwner && !isPrivilegedUser) {
//             return res
//               .status(403)
//               .json({ error: "Forbidden: Not authorized to delete." });
//           }

//           db.query(
//             `DELETE FROM training_teaching_aids WHERE id = ?`,
//             [id],
//             (err3) => {
//               if (err3) {
//                 logger.error("Delete error:", err3);
//                 return res
//                   .status(500)
//                   .json({ error: "Failed to delete item." });
//               }
//               logger.info(`Teaching aid ${id} deleted by user ${req.user.id}`);
//               res.json({ message: "Item deleted." });
//             }
//           );
//         }
//       );
//     }
//   );
// });

// module.exports = router;
