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
  teaching_aids: Joi.array()
    .items(
      Joi.object({
        item_description: Joi.string().required(),
        required_quantity: Joi.number().integer().min(0).optional(),
        required_hours: Joi.number().integer().min(0).optional(),
        hourly_rate: Joi.number().precision(2).min(0).optional(),
        cost: Joi.number().precision(2).min(0).optional(),
      })
    )
    .default([]),
  training_environments: Joi.array()
    .items(
      Joi.object({
        item_description: Joi.string().required(),
        required_hours: Joi.number().integer().min(0).optional(),
        hourly_rate: Joi.number().precision(2).min(0).optional(),
        cost: Joi.number().precision(2).min(0).optional(),
      })
    )
    .default([]),
  overheads: Joi.array()
    .items(
      Joi.object({
        item_description: Joi.string().required(),
        required_quantity: Joi.number().integer().min(0).optional(),
        rate: Joi.number().precision(2).min(0).optional(),
        cost: Joi.number().precision(2).min(0).optional(),
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
    teaching_aids,
    training_environments,
    overheads,
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
        return res
          .status(403)
          .json({ error: "Only the owner can create this record." });
      }

      db.getConnection((connErr, connection) => {
        if (connErr) return res.status(500).json({ error: "Connection error" });

        connection.beginTransaction((transErr) => {
          if (transErr)
            return connection.release(() =>
              res.status(500).json({ error: "Transaction error" })
            );

          connection.query(
            `INSERT INTO course_overheads_main (payments_main_details_id, total_cost) VALUES (?, 0)`,
            [payments_main_details_id],
            (insertErr, result) => {
              if (insertErr)
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ error: "Insert failed" });
                });

              const mainId = result.insertId;
              const privileged = isPrivileged(user);

              const insertItems = (index, items, table, insertFn, next) => {
                if (index >= items.length) return next();
                insertFn(
                  connection,
                  user,
                  privileged,
                  mainId,
                  items[index],
                  (err) => {
                    if (err)
                      return connection.rollback(() => {
                        connection.release();
                        res.status(400).json({ error: err });
                      });
                    insertItems(index + 1, items, table, insertFn, next);
                  }
                );
              };

              const calculateAndUpdateTotal = () => {
                const query = `SELECT
                  IFNULL((SELECT SUM(cost) FROM training_teaching_aids WHERE course_overheads_main_id = ?), 0) +
                  IFNULL((SELECT SUM(cost) FROM training_environments WHERE course_overheads_main_id = ?), 0) +
                  IFNULL((SELECT SUM(cost) FROM overheads WHERE course_overheads_main_id = ?), 0) AS total_cost`;

                connection.query(
                  query,
                  [mainId, mainId, mainId],
                  (err, rows) => {
                    if (err)
                      return connection.rollback(() => {
                        connection.release();
                        res
                          .status(500)
                          .json({ error: "Cost calculation failed" });
                      });

                    const total = rows[0].total_cost;
                    connection.query(
                      `UPDATE course_overheads_main SET total_cost = ? WHERE id = ?`,
                      [total, mainId],
                      (err2) => {
                        if (err2)
                          return connection.rollback(() => {
                            connection.release();
                            res
                              .status(500)
                              .json({ error: "Total cost update failed" });
                          });

                        connection.commit((commitErr) => {
                          if (commitErr)
                            return connection.rollback(() => {
                              connection.release();
                              res.status(500).json({ error: "Commit failed" });
                            });
                          connection.release();
                          res.status(201).json({
                            message: "Course overheads created successfully.",
                          });
                        });
                      }
                    );
                  }
                );
              };

              insertItems(
                0,
                teaching_aids,
                "training_teaching_aids",
                insertTeachingAid,
                () => {
                  insertItems(
                    0,
                    training_environments,
                    "training_environments",
                    insertTrainingEnv,
                    () => {
                      insertItems(
                        0,
                        overheads,
                        "overheads",
                        insertOverhead,
                        calculateAndUpdateTotal
                      );
                    }
                  );
                }
              );
            }
          );
        });
      });
    }
  );
});

function insertTeachingAid(connection, user, privileged, mainId, item, cb) {
  const CATEGORY = "Course Delivery (Teaching Aid)";
  db.query(
    `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
    [item.item_description, CATEGORY],
    (err, rateRows) => {
      if (err) return cb("Rate lookup failed");
      const rate = rateRows[0];

      let cost = item.cost;
      let hourlyRate = item.hourly_rate || 0;
      if (!rate && typeof cost === "number") {
        return connection.query(
          `INSERT INTO training_teaching_aids (course_overheads_main_id, item_description, required_quantity, required_hours, hourly_rate, cost) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            mainId,
            item.item_description,
            item.required_quantity || 0,
            item.required_hours || 0,
            hourlyRate,
            cost,
          ],
          cb
        );
      }

      if (!rate) return cb("Rate not found. Cost must be provided.");

      if (rate.rate_type === "Full Payment") {
        if (typeof cost !== "number") {
          if (
            privileged &&
            typeof item.required_quantity === "number" &&
            typeof item.required_hours === "number"
          ) {
            hourlyRate =
              typeof item.hourly_rate === "number"
                ? item.hourly_rate
                : rate.rate;
            cost = item.required_quantity * item.required_hours * hourlyRate;
          } else {
            return cb("Cost required for Full Payment");
          }
        }
      } else if (rate.rate_type === "Quantity_Hourly") {
        if (
          typeof item.required_quantity !== "number" ||
          typeof item.required_hours !== "number"
        )
          return cb("Quantity and hours required");
        hourlyRate =
          privileged && typeof item.hourly_rate === "number"
            ? item.hourly_rate
            : rate.rate;
        cost = item.required_quantity * item.required_hours * hourlyRate;
      } else {
        return cb("Unsupported rate type");
      }

      connection.query(
        `INSERT INTO training_teaching_aids (course_overheads_main_id, item_description, required_quantity, required_hours, hourly_rate, cost) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          mainId,
          item.item_description,
          item.required_quantity || 0,
          item.required_hours || 0,
          hourlyRate,
          cost,
        ],
        cb
      );
    }
  );
}

function insertTrainingEnv(connection, user, privileged, mainId, item, cb) {
  const CATEGORY = "Course Delivery (Teaching Env)";
  db.query(
    `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
    [item.item_description, CATEGORY],
    (err, rateRows) => {
      if (err) return cb("Rate lookup failed");

      const rate = rateRows[0];
      const hours = item.required_hours || 0;

      // ✅ Case 1: No rate found
      if (!rate) {
        const hourlyRate = item.hourly_rate || 0;
        const cost = item.cost || hourlyRate * hours;

        if (typeof cost === "number" && cost > 0) {
          return connection.query(
            `INSERT INTO training_environments (course_overheads_main_id, item_description, required_hours, hourly_rate, cost) VALUES (?, ?, ?, ?, ?)`,
            [mainId, item.item_description, hours, hourlyRate, cost],
            cb
          );
        }

        return cb("Rate not found. Cost must be provided.");
      }

      // ✅ Case 2: Rate exists
      if (rate.rate_type === "Hourly") {
        if (typeof hours !== "number" || hours <= 0)
          return cb("Hours required for Hourly item");

        const hourlyRate =
          privileged && typeof item.hourly_rate === "number"
            ? item.hourly_rate
            : rate.rate;

        const cost = hourlyRate * hours;

        return connection.query(
          `INSERT INTO training_environments (course_overheads_main_id, item_description, required_hours, hourly_rate, cost) VALUES (?, ?, ?, ?, ?)`,
          [mainId, item.item_description, hours, hourlyRate, cost],
          cb
        );
      }

      return cb("Unsupported rate type");
    }
  );
}

function insertOverhead(connection, user, privileged, mainId, item, cb) {
  const CATEGORY = "Overheads";
  db.query(
    `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
    [item.item_description, CATEGORY],
    (err, rateRows) => {
      if (err) return cb("Rate lookup failed");

      const rate = rateRows[0];
      const qty = item.required_quantity || 0;

      // ✅ Case 1: No rate found
      if (!rate) {
        if (privileged) {
          // Privileged user can either provide cost OR calculate from rate * quantity
          if (typeof item.cost === "number") {
            return connection.query(
              `INSERT INTO overheads (course_overheads_main_id, item_description, required_quantity, rate, cost) VALUES (?, ?, ?, ?, ?)`,
              [mainId, item.item_description, qty, item.rate || 0, item.cost],
              cb
            );
          }

          if (
            typeof item.rate === "number" &&
            typeof qty === "number" &&
            qty > 0
          ) {
            const cost = item.rate * qty;
            return connection.query(
              `INSERT INTO overheads (course_overheads_main_id, item_description, required_quantity, rate, cost) VALUES (?, ?, ?, ?, ?)`,
              [mainId, item.item_description, qty, item.rate, cost],
              cb
            );
          }

          return cb(
            "Either cost or both rate and quantity must be provided by privileged user."
          );
        }

        // Regular user must give explicit cost only
        if (typeof item.cost === "number") {
          return connection.query(
            `INSERT INTO overheads (course_overheads_main_id, item_description, required_quantity, rate, cost) VALUES (?, ?, ?, ?, ?)`,
            [mainId, item.item_description, qty, item.rate || 0, item.cost],
            cb
          );
        }

        return cb("Rate not found. Cost must be provided.");
      }

      if (rate.rate_type === "Full Payment") {
        if (typeof item.cost === "number") {
          // Use provided cost
          return connection.query(
            `INSERT INTO overheads (course_overheads_main_id, item_description, required_quantity, rate, cost) VALUES (?, ?, ?, ?, ?)`,
            [mainId, item.item_description, qty, rate.rate, item.cost],
            cb
          );
        }

        if (privileged) {
          // Allow privileged user to use rate directly as cost
          return connection.query(
            `INSERT INTO overheads (...) VALUES (?, ?, ?, ?, ?)`,
            [mainId, item.item_description, qty, rate.rate, rate.rate],
            cb
          );
        }

        return cb("Cost required for Full Payment");
      }

      if (rate.rate_type === "Quantity") {
        if (typeof qty !== "number" || qty <= 0) return cb("Quantity required");

        const finalRate =
          privileged && typeof item.rate === "number" ? item.rate : rate.rate;

        const cost = finalRate * qty;

        return connection.query(
          `INSERT INTO overheads (course_overheads_main_id, item_description, required_quantity, rate, cost) VALUES (?, ?, ?, ?, ?)`,
          [mainId, item.item_description, qty, finalRate, cost],
          cb
        );
      }

      return cb("Unsupported rate type");
    }
  );
}

router.get("/full", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  const query = privileged
    ? `SELECT * FROM course_overheads_main`
    : `SELECT * FROM course_overheads_main WHERE payments_main_details_id IN (
        SELECT id FROM payments_main_details WHERE user_id = ?
      )`;

  const params = privileged ? [] : [user.id];

  db.query(query, params, (err, mains) => {
    if (err) return res.status(500).json({ error: "Failed to fetch records" });
    if (mains.length === 0) return res.json([]);

    const ids = mains.map((m) => m.id);

    db.query(
      `SELECT * FROM training_teaching_aids WHERE course_overheads_main_id IN (?)`,
      [ids],
      (err2, aids) => {
        if (err2)
          return res
            .status(500)
            .json({ error: "Failed to fetch teaching aids" });

        db.query(
          `SELECT * FROM training_environments WHERE course_overheads_main_id IN (?)`,
          [ids],
          (err3, envs) => {
            if (err3)
              return res
                .status(500)
                .json({ error: "Failed to fetch training environments" });

            db.query(
              `SELECT * FROM overheads WHERE course_overheads_main_id IN (?)`,
              [ids],
              (err4, ohs) => {
                if (err4)
                  return res
                    .status(500)
                    .json({ error: "Failed to fetch overheads" });

                const data = mains.map((main) => ({
                  ...main,
                  teaching_aids: aids.filter(
                    (a) => a.course_overheads_main_id === main.id
                  ),
                  training_environments: envs.filter(
                    (e) => e.course_overheads_main_id === main.id
                  ),
                  overheads: ohs.filter(
                    (o) => o.course_overheads_main_id === main.id
                  ),
                }));

                res.json(data);
              }
            );
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
    SELECT pmd.user_id FROM course_overheads_main coh
    JOIN payments_main_details pmd ON coh.payments_main_details_id = pmd.id
    WHERE coh.id = ?
  `;

  db.query(query, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (rows.length === 0)
      return res.status(404).json({ error: "Record not found" });

    const ownerId = rows[0].user_id;
    const privileged = isPrivileged(user);

    if (!privileged && ownerId !== user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this record." });
    }

    db.query(
      `DELETE FROM course_overheads_main WHERE id = ?`,
      [id],
      (delErr) => {
        if (delErr)
          return res.status(500).json({ error: "Failed to delete record" });

        logger.info(`Course overheads ID ${id} deleted by user ${user.id}`);
        res.json({ message: "Deleted successfully." });
      }
    );
  });
});

module.exports = router;
