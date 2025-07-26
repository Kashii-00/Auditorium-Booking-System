const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const Joi = require("joi");

const router = express.Router();
router.use(auth.authMiddleware);

const postSchema = Joi.object({
  lecturer_attend_id: Joi.number().integer().required(),
  paid_worked_hours: Joi.number().integer().min(1).required(),
  payment_received_amount: Joi.number().precision(2).min(0),
});

const patchSchema = Joi.object({
  increment_by: Joi.number().integer().min(1).required(),
});

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];

function normalizeRoles(rawRole) {
  try {
    if (typeof rawRole === "string") return JSON.parse(rawRole);
    return Array.isArray(rawRole) ? rawRole : [rawRole];
  } catch {
    return [rawRole];
  }
}

function isPrivileged(user) {
  const roles = normalizeRoles(user.role);
  return roles.some((role) => PRIVILEGED_ROLES.includes(role));
}

router.post("/", (req, res) => {
  const { error, value } = postSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const {
    lecturer_attend_id,
    paid_worked_hours = 0,
    payment_received_amount,
  } = value;
  const user_id = req.user.id;

  // Step 1: Fetch lecturer_attendance details including role and metadata
  db.query(
    `SELECT la.worked_hours, la.expected_work_hours, la.rate, la.role, la.payments_main_details_id
     FROM lecturer_attendance la
     WHERE la.id = ?`,
    [lecturer_attend_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Invalid lecturer_attend_id" });

      const {
        worked_hours,
        expected_work_hours,
        rate,
        role,
        payments_main_details_id,
      } = rows[0];
      const roleCleaned = role.trim();

      // Step 2: Check rate_type for this role
      db.query(
        `SELECT rate_type FROM rates 
         WHERE item_description = ? AND category = 'Course Delivery Human Resources' LIMIT 1`,
        [roleCleaned],
        (err, rateRows) => {
          if (err)
            return res
              .status(500)
              .json({ error: "DB error during rate check" });

          const isFullPayment =
            rateRows.length > 0 && rateRows[0].rate_type === "Full Payment";

          if (isFullPayment) {
            // Step 3a: Lookup amount from course_delivery_cost_items
            db.query(
              `SELECT cdc.id AS course_delivery_cost_id
               FROM course_delivery_costs cdc
               WHERE cdc.payments_main_details_id = ? LIMIT 1`,
              [payments_main_details_id],
              (err, costRows) => {
                if (err)
                  return res
                    .status(500)
                    .json({ error: "DB error during delivery cost fetch" });
                if (costRows.length === 0)
                  return res
                    .status(404)
                    .json({ error: "Related delivery cost not found." });

                const course_delivery_cost_id =
                  costRows[0].course_delivery_cost_id;

                db.query(
                  `SELECT amount FROM course_delivery_cost_items
                   WHERE course_delivery_cost_id = ? AND role = ? LIMIT 1`,
                  [course_delivery_cost_id, roleCleaned],
                  (err, itemRows) => {
                    if (err)
                      return res
                        .status(500)
                        .json({ error: "DB error during cost item lookup" });
                    if (itemRows.length === 0)
                      return res
                        .status(404)
                        .json({ error: "Matching cost item not found." });

                    const requiredAmount = parseFloat(itemRows[0].amount);

                    if (
                      payment_received_amount === undefined ||
                      parseFloat(payment_received_amount.toFixed(2)) !==
                        parseFloat(requiredAmount.toFixed(2))
                    ) {
                      return res.status(400).json({
                        error: `Payment amount must be exactly ${requiredAmount.toFixed(
                          2
                        )} for full payment role "${roleCleaned}".`,
                      });
                    }

                    // Insert payment for Full Payment
                    db.query(
                      `INSERT INTO lecturer_payments (
                        user_id, paid_worked_hours, payment_received_amount,
                        full_amount_payable, payment_completed, lecturer_attend_id
                      ) VALUES (?, ?, ?, ?, ?, ?)`,
                      [
                        user_id,
                        0, // no hours
                        requiredAmount,
                        requiredAmount,
                        true, // payment completed always
                        lecturer_attend_id,
                      ],
                      (err) => {
                        if (err)
                          return res
                            .status(500)
                            .json({ error: "Insert failed" });

                        res.status(201).json({
                          message: "Full payment recorded successfully.",
                          payment_received_amount: requiredAmount,
                          full_amount_payable: requiredAmount,
                          payment_completed: true,
                        });
                      }
                    );
                  }
                );
              }
            );
          } else {
            // Step 3b: Normal hourly-based logic
            if (paid_worked_hours > worked_hours) {
              return res.status(400).json({
                error: "Paid worked hours cannot exceed worked hours.",
              });
            }

            const full_amount_payable = expected_work_hours * rate;
            const received_amount = paid_worked_hours * rate;
            const payment_completed = received_amount === full_amount_payable;

            db.query(
              `INSERT INTO lecturer_payments (
                user_id, paid_worked_hours, payment_received_amount,
                full_amount_payable, payment_completed, lecturer_attend_id
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                user_id,
                paid_worked_hours,
                received_amount,
                full_amount_payable,
                payment_completed,
                lecturer_attend_id,
              ],
              (err) => {
                if (err)
                  return res.status(500).json({ error: "Insert failed" });

                res.status(201).json({
                  message: "Lecturer payment recorded successfully.",
                  payment_received_amount: received_amount,
                  full_amount_payable,
                  payment_completed,
                });
              }
            );
          }
        }
      );
    }
  );
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { error, value } = patchSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const increment_by = value.increment_by;
  const user = req.user;
  const isPriv = isPrivileged(user);

  // Step 1: Get existing lecturer_payment record
  db.query(
    "SELECT * FROM lecturer_payments WHERE id = ?",
    [id],
    (err, payRows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (payRows.length === 0)
        return res.status(404).json({ error: "Payment record not found." });

      const payment = payRows[0];

      // Step 2: Access Control
      if (!isPriv && payment.user_id !== user.id) {
        return res.status(403).json({
          error: "Forbidden. You can only update your own record.",
        });
      }

      // Step 3: Fetch related lecturer_attendance record (with role)
      db.query(
        "SELECT worked_hours, expected_work_hours, rate, role FROM lecturer_attendance WHERE id = ?",
        [payment.lecturer_attend_id],
        (err, laRows) => {
          if (err) return res.status(500).json({ error: "DB error" });
          if (laRows.length === 0)
            return res
              .status(404)
              .json({ error: "Associated attendance record not found." });

          const la = laRows[0];
          const roleCleaned = la.role.trim();

          // Step 4: Check if this is a Full Payment role
          db.query(
            "SELECT rate_type FROM rates WHERE item_description = ? AND category = 'Course Delivery Human Resources' LIMIT 1",
            [roleCleaned],
            (err, rateRows) => {
              if (err)
                return res
                  .status(500)
                  .json({ error: "DB error during rate check" });

              if (
                rateRows.length > 0 &&
                rateRows[0].rate_type === "Full Payment"
              ) {
                return res.status(400).json({
                  error: `Cannot update payment for role "${roleCleaned}" because it uses a 'Full Payment' rate.`,
                });
              }

              // Step 5: Continue with update
              const newPaidWorkedHours =
                payment.paid_worked_hours + increment_by;

              if (newPaidWorkedHours > la.worked_hours) {
                return res.status(400).json({
                  error: `Increment exceeds worked hours (${la.worked_hours}).`,
                });
              }

              const incrementAmount = parseFloat(la.rate) * increment_by;
              const newPaymentReceived =
                parseFloat(payment.payment_received_amount) + incrementAmount;
              const fullAmountPayable =
                parseFloat(la.rate) * la.expected_work_hours;
              const paymentCompleted =
                newPaymentReceived.toFixed(2) === fullAmountPayable.toFixed(2);

              db.query(
                `UPDATE lecturer_payments
                 SET paid_worked_hours = ?, 
                     payment_received_amount = ?, 
                     full_amount_payable = ?, 
                     payment_completed = ?
                 WHERE id = ?`,
                [
                  newPaidWorkedHours,
                  newPaymentReceived,
                  fullAmountPayable,
                  paymentCompleted,
                  id,
                ],
                (err) => {
                  if (err)
                    return res.status(500).json({ error: "Update failed." });

                  res.json({
                    message: "Lecturer payment updated successfully.",
                    increment_amount: incrementAmount,
                    updated_fields: {
                      paid_worked_hours: newPaidWorkedHours,
                      payment_received_amount: newPaymentReceived,
                      full_amount_payable: fullAmountPayable,
                      payment_completed: paymentCompleted,
                    },
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

router.get("/", (req, res) => {
  const user = req.user;
  const isPriv = isPrivileged(user);

  const query = isPriv
    ? "SELECT * FROM lecturer_payments"
    : "SELECT * FROM lecturer_payments WHERE user_id = ?";
  const params = isPriv ? [] : [user.id];

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const isPriv = isPrivileged(user);

  db.query(
    "SELECT user_id FROM lecturer_payments WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Record not found" });

      const record = rows[0];
      if (!isPriv && record.user_id !== user.id) {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this record" });
      }

      db.query("DELETE FROM lecturer_payments WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Delete failed" });
        res.json({ message: "Deleted successfully." });
      });
    }
  );
});

module.exports = router;
