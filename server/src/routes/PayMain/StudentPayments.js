// routes/student_payments.js
const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const Joi = require("joi");

const router = express.Router();
router.use(auth.authMiddleware);

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager"];

function normalizeRoles(rawRole) {
  try {
    if (typeof rawRole === "string") {
      return JSON.parse(rawRole);
    }
    return Array.isArray(rawRole) ? rawRole : [rawRole];
  } catch {
    return [rawRole];
  }
}

function isPrivileged(user) {
  const roles = normalizeRoles(user.role);
  return roles.some((role) => PRIVILEGED_ROLES.includes(role));
}

const postSchema = Joi.object({
  student_id: Joi.number().integer().required(),
  course_id: Joi.number().integer().required(),
  batch_id: Joi.number().integer().required(),
  amount_paid: Joi.number().precision(2).min(0).required(),
});

const patchSchema = Joi.object({
  amount_paid: Joi.number().precision(2).min(0.01).required(),
});

function syncRevenueSummary(course_id, batch_id, callback) {
  const selectQuery = `
    SELECT COUNT(*) AS paid_count, SUM(amount_paid) AS total_received
    FROM student_payments
    WHERE course_id = ? AND batch_id = ?
      AND payment_completed = TRUE
      AND amount_paid = full_amount_payable
  `;
  db.query(selectQuery, [course_id, batch_id], (err, statsResult) => {
    if (err) return callback(err);
    const { paid_count, total_received } = statsResult[0];

    const updateRevenueQuery = `
      UPDATE course_revenue_summary
      SET
        paid_no_of_participants = ?,
        revenue_received_total = ?,
        all_fees_collected_status = IF(? >= no_of_participants, TRUE, FALSE)
      WHERE course_id = ? AND batch_id = ?
    `;
    db.query(
      updateRevenueQuery,
      [paid_count, total_received || 0.0, paid_count, course_id, batch_id],
      callback
    );
  });
}

function fetchFullAmountPayable(course_id, batch_id, callback) {
  const query = `
    SELECT ccs.Rounded_CFPH
    FROM course_cost_summary ccs
    JOIN payments_main_details pmd ON ccs.payment_main_details_id = pmd.id
    WHERE pmd.course_id = ? AND pmd.batch_id = ?
    ORDER BY ccs.created_at DESC
    LIMIT 1
  `;
  db.query(query, [course_id, batch_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0)
      return callback(new Error("Course cost summary not found"));
    callback(null, parseFloat(rows[0].Rounded_CFPH));
  });
}

router.post("/", (req, res) => {
  const { error, value } = postSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { student_id, course_id, batch_id, amount_paid } = value;

  db.query(
    `SELECT id FROM student_payments WHERE student_id = ? AND course_id = ? AND batch_id = ?`,
    [student_id, course_id, batch_id],
    (err, existing) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (existing.length > 0)
        return res.status(400).json({
          error:
            "Student already has a payment record for this course and batch.",
        });

      fetchFullAmountPayable(
        course_id,
        batch_id,
        (fetchErr, full_amount_payable) => {
          if (fetchErr)
            return res.status(400).json({ error: fetchErr.message });

          if (amount_paid > full_amount_payable) {
            return res
              .status(400)
              .json({ error: "Amount paid exceeds full amount payable." });
          }

          const payment_completed = amount_paid === full_amount_payable;

          const insertQuery = `
          INSERT INTO student_payments (
            student_id, course_id, batch_id, user_id,
            amount_paid, full_amount_payable, payment_completed
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

          db.query(
            insertQuery,
            [
              student_id,
              course_id,
              batch_id,
              req.user.id,
              amount_paid,
              full_amount_payable,
              payment_completed,
            ],
            (err) => {
              if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                  return res.status(400).json({
                    error:
                      "A Student with the same course id, and batch id already exists.",
                  });
                }
                return res.status(500).json({ error: "Insert failed" });
              }

              if (payment_completed) {
                syncRevenueSummary(course_id, batch_id, () => {
                  return res
                    .status(201)
                    .json({ message: "Payment recorded and revenue updated." });
                });
              } else {
                return res.status(201).json({ message: "Payment recorded." });
              }
            }
          );
        }
      );
    }
  );
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;

  const { error, value } = patchSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { amount_paid } = value;

  db.query(`SELECT * FROM student_payments WHERE id = ?`, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (rows.length === 0)
      return res.status(404).json({ error: "Payment record not found." });

    const record = rows[0];
    if (record.user_id !== req.user.id) {
      return res.status(403).json({
        error: "Forbidden. You cannot update as you do not own this record.",
      });
    }

    const newAmountPaid =
      parseFloat(record.amount_paid) + parseFloat(amount_paid);

    if (newAmountPaid > record.full_amount_payable) {
      return res
        .status(400)
        .json({ error: "Total payment exceeds full amount payable." });
    }

    const payment_completed = newAmountPaid === record.full_amount_payable;

    const updateQuery = `
      UPDATE student_payments
      SET amount_paid = ?, payment_completed = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [newAmountPaid, payment_completed, id], (err) => {
      if (err) return res.status(500).json({ error: "Update failed" });

      syncRevenueSummary(record.course_id, record.batch_id, (err2) => {
        if (err2) return res.status(500).json({ error: "Revenue sync failed" });

        return res.json({
          message: "Payment incremented and revenue updated if needed.",
        });
      });
    });
  });
});

router.get("/", (req, res) => {
  const { course_id, batch_id } = req.query;
  const query = `
    SELECT * FROM student_payments
    WHERE (? IS NULL OR course_id = ?)
      AND (? IS NULL OR batch_id = ?)
  `;

  db.query(
    query,
    [course_id, course_id, batch_id, batch_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });

      const user = req.user;
      const filtered = isPrivileged(user)
        ? results
        : results.filter((rec) => rec.user_id === user.id);

      res.json(filtered);
    }
  );
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query(`SELECT * FROM student_payments WHERE id = ?`, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (rows.length === 0)
      return res.status(404).json({ error: "Payment not found" });

    const record = rows[0];
    if (record.user_id !== req.user.id) {
      return res.status(403).json({
        error:
          "Forbidden. You can not delete this as you do not own this record.",
      });
    }

    db.query(`DELETE FROM student_payments WHERE id = ?`, [id], (err2) => {
      if (err2) return res.status(500).json({ error: "Delete failed" });

      syncRevenueSummary(record.course_id, record.batch_id, (err3) => {
        if (err3)
          return res
            .status(500)
            .json({ error: "Revenue update failed after delete" });

        res.json({ message: "Deleted and revenue updated." });
      });
    });
  });
});

module.exports = router;
