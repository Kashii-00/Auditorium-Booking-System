const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const logger = require("../../logger");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");

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

const router = express.Router();
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
  payments_main_details_id: Joi.number().required(),
  no_of_panel_meetings: Joi.number().integer().min(0).required(),
  expenses: Joi.array()
    .items(
      Joi.object({
        item_description: Joi.string().required(),
        required_quantity: Joi.number().integer().min(1).optional(),
        rate: Joi.number().precision(2).min(0).optional(),
        amount: Joi.number().precision(2).min(0).optional(),
      })
    )
    .default([]),
  participants: Joi.array()
    .items(
      Joi.object({
        participant_type: Joi.string().required(),
        nos: Joi.number().integer().min(1).optional(),
        rate_per_hour: Joi.number().precision(2).min(0).optional(),
        smes: Joi.string().allow("").optional(),
        amount: Joi.number().precision(2).min(0).optional(),
      })
    )
    .default([]),
});

router.post("/full", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = req.user;
  const {
    payments_main_details_id,
    no_of_panel_meetings,
    expenses,
    participants,
  } = value;

  db.query(
    `SELECT user_id FROM payments_main_details WHERE id = ?`,
    [payments_main_details_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res
          .status(400)
          .json({ error: "Invalid payments_main_details_id." });

      if (rows[0].user_id !== user.id) {
        return res.status(403).json({
          error:
            "Forbidden: Only the actual owner can create course development work.",
        });
      }

      db.getConnection((connErr, connection) => {
        if (connErr) return res.status(500).json({ error: "Connection error" });

        connection.beginTransaction((err) => {
          if (err) {
            connection.release();
            return res.status(500).json({ error: "Transaction error" });
          }

          connection.query(
            `INSERT INTO course_development_work (payments_main_details_id, no_of_panel_meetings) VALUES (?, ?)`,
            [payments_main_details_id, no_of_panel_meetings],
            (err2, result) => {
              if (err2) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({
                    error: "Failed to create course development work.",
                  });
                });
              }

              const courseDevWorkId = result.insertId;

              function insertExpense(index) {
                if (index >= expenses.length) return insertParticipant(0);

                const { item_description, required_quantity, rate, amount } =
                  expenses[index];

                connection.query(
                  `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
                  [item_description, CATEGORY],
                  (rateErr, rateRows) => {
                    if (rateErr) {
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ error: "Rates lookup failed." });
                      });
                    }

                    const rateEntry = rateRows[0];
                    let resolvedRate = rate;
                    let resolvedAmount = amount;

                    if (rateEntry) {
                      if (rateEntry.rate_type === "Full Payment") {
                        if (typeof amount !== "number") {
                          return connection.rollback(() => {
                            connection.release();
                            res.status(400).json({
                              error: "Amount required for Full Payment items.",
                            });
                          });
                        }
                        resolvedRate = isPrivileged(user)
                          ? resolvedRate ?? rateEntry.rate
                          : rateEntry.rate;
                      } else if (rateEntry.rate_type === "Quantity") {
                        if (typeof required_quantity !== "number") {
                          return connection.rollback(() => {
                            connection.release();
                            res.status(400).json({
                              error: "Quantity required for this item.",
                            });
                          });
                        }
                        resolvedRate = isPrivileged(user)
                          ? resolvedRate ?? rateEntry.rate
                          : rateEntry.rate;
                        resolvedAmount = resolvedRate * required_quantity;
                      }
                    } else {
                      if (isPrivileged(user) && typeof amount === "number") {
                        // accept as is
                      } else if (
                        typeof rate === "number" &&
                        typeof required_quantity === "number"
                      ) {
                        resolvedAmount = rate * required_quantity;
                      } else {
                        return connection.rollback(() => {
                          connection.release();
                          res.status(400).json({
                            error:
                              "Rate not found. Provide amount or rate + quantity.",
                          });
                        });
                      }
                    }

                    connection.query(
                      `INSERT INTO course_development_work_expenses (course_development_work_id, item_description, required_quantity, rate, amount) VALUES (?, ?, ?, ?, ?)`,
                      [
                        courseDevWorkId,
                        item_description,
                        required_quantity || 0,
                        resolvedRate || 0,
                        resolvedAmount,
                      ],
                      (err3) => {
                        if (err3) {
                          return connection.rollback(() => {
                            connection.release();
                            res
                              .status(500)
                              .json({ error: "Failed to insert expense." });
                          });
                        }
                        insertExpense(index + 1);
                      }
                    );
                  }
                );
              }

              function insertParticipant(index) {
                if (index >= participants.length) {
                  // After all participants are added, calculate total cost
                  const costQuery = `
                    SELECT 
                      (SELECT IFNULL(SUM(amount), 0) FROM course_development_work_expenses WHERE course_development_work_id = ?) +
                      (SELECT IFNULL(SUM(amount), 0) FROM panel_meeting_participants WHERE course_development_work_id = ?)
                      AS total_cost
                  `;

                  connection.query(
                    costQuery,
                    [courseDevWorkId, courseDevWorkId],
                    (costErr, costRows) => {
                      if (costErr) {
                        return connection.rollback(() => {
                          connection.release();
                          res
                            .status(500)
                            .json({ error: "Failed to calculate total cost." });
                        });
                      }

                      const totalCost = costRows[0].total_cost;

                      connection.query(
                        `UPDATE course_development_work SET total_cost = ? WHERE id = ?`,
                        [totalCost, courseDevWorkId],
                        (updateErr) => {
                          if (updateErr) {
                            return connection.rollback(() => {
                              connection.release();
                              res.status(500).json({
                                error: "Failed to update total cost.",
                              });
                            });
                          }

                          connection.commit((commitErr) => {
                            if (commitErr) {
                              return connection.rollback(() => {
                                connection.release();
                                res
                                  .status(500)
                                  .json({ error: "Commit failed" });
                              });
                            }

                            connection.release();
                            logger.info(
                              `Course development work full record created by user ${user.id}`
                            );
                            res.status(201).json({
                              message:
                                "Course development work created successfully.",
                            });
                          });
                        }
                      );
                    }
                  );

                  return;
                }

                const { participant_type, nos, rate_per_hour, amount, smes } =
                  participants[index];

                connection.query(
                  `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
                  [participant_type, CATEGORY],
                  (rateErr, rateRows) => {
                    if (rateErr) {
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ error: "Rates lookup failed." });
                      });
                    }

                    const rateEntry = rateRows[0];
                    let finalRate = rate_per_hour;
                    let finalAmount = amount;

                    if (!rateEntry) {
                      if (isPrivileged(user) && typeof amount === "number") {
                        // Accept direct amount
                      } else if (
                        typeof nos === "number" &&
                        typeof rate_per_hour === "number"
                      ) {
                        finalAmount = nos * rate_per_hour;
                      } else {
                        return connection.rollback(() => {
                          connection.release();
                          res.status(400).json({
                            error:
                              "No rate found and insufficient data to calculate participant cost.",
                          });
                        });
                      }
                    } else if (rateEntry.rate_type === "Hourly") {
                      if (typeof nos !== "number") {
                        return connection.rollback(() => {
                          connection.release();
                          res.status(400).json({
                            error: "nos is required for Hourly rate.",
                          });
                        });
                      }
                      finalRate = isPrivileged(user)
                        ? finalRate ?? rateEntry.rate
                        : rateEntry.rate;
                      finalAmount = nos * finalRate;
                    } else {
                      return connection.rollback(() => {
                        connection.release();
                        res.status(400).json({
                          error:
                            "Only 'Hourly' rate type supported for participants.",
                        });
                      });
                    }

                    connection.query(
                      `INSERT INTO panel_meeting_participants (course_development_work_id, participant_type, nos, rate_per_hour, smes, amount) VALUES (?, ?, ?, ?, ?, ?)`,
                      [
                        courseDevWorkId,
                        participant_type,
                        nos || 0,
                        finalRate || 0,
                        smes || "",
                        finalAmount,
                      ],
                      (err4) => {
                        if (err4) {
                          return connection.rollback(() => {
                            connection.release();
                            res
                              .status(500)
                              .json({ error: "Failed to insert participant." });
                          });
                        }
                        insertParticipant(index + 1);
                      }
                    );
                  }
                );
              }

              insertExpense(0);
            }
          );
        });
      });
    }
  );
});

router.get("/full", (req, res) => {
  const user = req.user;
  const isPriv = isPrivileged(user);

  const query = isPriv
    ? `SELECT * FROM course_development_work`
    : `SELECT * FROM course_development_work WHERE payments_main_details_id IN (
        SELECT id FROM payments_main_details WHERE user_id = ?
      )`;

  const params = isPriv ? [] : [user.id];

  db.query(query, params, (err, works) => {
    if (err) return res.status(500).json({ error: "Failed to fetch records" });

    if (works.length === 0) return res.json([]);

    const workIds = works.map((w) => w.id);

    // Get all expenses
    db.query(
      `SELECT * FROM course_development_work_expenses WHERE course_development_work_id IN (?)`,
      [workIds],
      (expErr, expenses) => {
        if (expErr)
          return res.status(500).json({ error: "Failed to fetch expenses" });

        // Get all participants
        db.query(
          `SELECT * FROM panel_meeting_participants WHERE course_development_work_id IN (?)`,
          [workIds],
          (partErr, participants) => {
            if (partErr)
              return res
                .status(500)
                .json({ error: "Failed to fetch participants" });

            const data = works.map((work) => ({
              ...work,
              expenses: expenses.filter(
                (e) => e.course_development_work_id === work.id
              ),
              participants: participants.filter(
                (p) => p.course_development_work_id === work.id
              ),
            }));

            res.json(data);
          }
        );
      }
    );
  });
});

router.delete("/full/:id", (req, res) => {
  const id = req.params.id;
  const user = req.user;

  const query = `
    SELECT payments_main_details.user_id
    FROM course_development_work
    JOIN payments_main_details ON course_development_work.payments_main_details_id = payments_main_details.id
    WHERE course_development_work.id = ?
  `;

  db.query(query, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (rows.length === 0)
      return res.status(404).json({ error: "Record not found" });

    const ownerId = rows[0].user_id;
    const isPriv = isPrivileged(user);

    if (!isPriv && ownerId !== user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this record." });
    }

    db.query(
      `DELETE FROM course_development_work WHERE id = ?`,
      [id],
      (delErr, result) => {
        if (delErr) return res.status(500).json({ error: "Failed to delete" });

        logger.info(
          `Course development work ID ${id} deleted by user ${user.id}`
        );
        res.json({ message: "Deleted successfully." });
      }
    );
  });
});

module.exports = router;
