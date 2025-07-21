// routes/panelMeetingParticipants.js
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
  participant_type: Joi.string().required(),
  nos: Joi.number().integer().min(1).optional(),
  rate_per_hour: Joi.number().precision(2).min(0).optional(),
  smes: Joi.string().allow("").optional(),
  amount: Joi.number().precision(2).min(0).optional(),
});

router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = req.user;
  const {
    course_development_work_id,
    participant_type,
    nos,
    rate_per_hour: userRate,
    smes,
    amount: userAmount,
  } = value;

  // Step 1: Verify ownership (privileged users not allowed to create)
  db.query(
    `SELECT pmd.user_id
       FROM course_development_work cdw
       JOIN payments_main_details pmd ON cdw.payments_main_details_id = pmd.id
       WHERE cdw.id = ?`,
    [course_development_work_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res
          .status(400)
          .json({ error: "Invalid course_development_work_id." });

      const ownerId = rows[0].user_id;
      if (user.id !== ownerId) {
        return res.status(403).json({
          error: "Forbidden: Only the owner can add participants.",
        });
      }

      const privileged = isPrivileged(user);

      // Step 2: Rate lookup
      db.query(
        `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
        [participant_type, "Course Development Work"],
        (rateErr, rateRows) => {
          if (rateErr)
            return res.status(500).json({ error: "Rate lookup failed" });

          const rateEntry = rateRows[0] || null;

          // CASE A: Rate NOT found
          if (!rateEntry) {
            if (
              typeof userAmount === "number" &&
              typeof nos !== "number" &&
              typeof userRate !== "number"
            ) {
              // Accept user-provided amount if no other fields were given
              return insert(userAmount, userRate || 0);
            }

            // Try to calculate from provided fields if possible
            if (typeof nos === "number" && typeof userRate === "number") {
              const calculatedAmount = nos * userRate;
              return insert(calculatedAmount, userRate);
            }

            return res.status(400).json({
              error:
                "No rate found. Either provide only amount, or both nos and rate to calculate cost.",
            });
          }

          // CASE B: Rate exists — must be Hourly
          const { rate: dbRate, rate_type } = rateEntry;
          if (rate_type !== "Hourly") {
            return res.status(400).json({
              error: "Unsupported rate type. Only 'Hourly' is allowed.",
            });
          }

          // If user gave amount + other fields, ignore amount and calculate
          const userGaveAmountAndOthers =
            typeof userAmount === "number" &&
            (typeof nos === "number" || typeof userRate === "number");

          // If user gave only amount (and rate exists), ignore it
          if (typeof userAmount === "number" && !userGaveAmountAndOthers) {
            return res.status(400).json({
              error:
                "Amount cannot be accepted when a rate is defined. Provide quantity to calculate.",
            });
          }

          // Reject if only rate is given without quantity
          if (
            typeof userRate === "number" &&
            typeof nos !== "number" &&
            typeof userAmount !== "number"
          ) {
            return res.status(400).json({
              error:
                "Invalid input. You must provide quantity (nos) when providing a rate.",
            });
          }

          // At this point, we should calculate using available data
          if (typeof nos === "number") {
            const finalRate =
              privileged && typeof userRate === "number" ? userRate : dbRate;

            const calculatedAmount = nos * finalRate;
            return insert(calculatedAmount, finalRate);
          }

          return res.status(400).json({
            error:
              "Missing quantity (nos). Cost cannot be calculated and amount is not acceptable.",
          });

          // Final insert
          function insert(amount, rate) {
            db.query(
              `INSERT INTO panel_meeting_participants
                (course_development_work_id, participant_type, nos, rate_per_hour, smes, amount)
                VALUES (?, ?, ?, ?, ?, ?)`,
              [
                course_development_work_id,
                participant_type,
                nos || 0,
                rate || 0,
                smes || "",
                amount,
              ],
              (insertErr) => {
                if (insertErr) {
                  logger.error("Insert error:", insertErr);
                  return res
                    .status(500)
                    .json({ error: "Failed to insert participant." });
                }
                logger.info(`Panel participant created by user ${user.id}`);
                res.status(201).json({ message: "Panel participant added." });
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
    SELECT pmp.* 
    FROM panel_meeting_participants pmp
    JOIN course_development_work cdw ON pmp.course_development_work_id = cdw.id
    JOIN payments_main_details pmd ON cdw.payments_main_details_id = pmd.id
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
      logger.error("GET /panel-meeting-participants error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT course_development_work_id FROM panel_meeting_participants WHERE id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Item not found." });

      const cdwId = rows[0].course_development_work_id;

      db.query(
        `SELECT user_id FROM payments_main_details WHERE id = (
          SELECT payments_main_details_id FROM course_development_work WHERE id = ?
        )`,
        [cdwId],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: "DB error" });

          const isOwner = req.user.id === result[0]?.user_id;
          const isPrivilegedUser = isPrivileged(req.user);

          if (!isOwner && !isPrivilegedUser) {
            return res
              .status(403)
              .json({ error: "Forbidden: Not authorized to delete." });
          }

          db.query(
            `DELETE FROM panel_meeting_participants WHERE id = ?`,
            [id],
            (err3) => {
              if (err3) {
                logger.error("Delete error:", err3);
                return res
                  .status(500)
                  .json({ error: "Failed to delete participant." });
              }
              logger.info(
                `Panel participant ${id} deleted by user ${req.user.id}`
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
