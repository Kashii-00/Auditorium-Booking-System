// routes/student_payments.js
const express = require("express");
const db = require("../../../db");
const auth = require("../../../auth");
const Joi = require("joi");
const crypto = require("crypto");
const config = require("../../../config/app.config");

require("dotenv").config();

const router = express.Router();

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
  courseBatch_id: Joi.number().integer().required(),
  amount_paid: Joi.number().precision(2).min(0).required(),
});

const patchSchema = Joi.object({
  amount_paid: Joi.number().precision(2).min(0.01).required(),
});

// Add a small epsilon for float comparison
const EPSILON = 0.01;

// PayHere fee percentage (3.30% as per your plan)
const PAYHERE_FEE_PERCENT = 0.033;
const PAYHERE_FIXED_FEE = 0; // No fixed fee for PayHere

// Helper: Calculate gross amount to charge so net amount received after fees is correct
function calculateGrossAmount(netAmount, feePercent, fixedFee = 0) {
  return +((netAmount + fixedFee) / (1 - feePercent)).toFixed(2);
}

function calculateNetAmount(grossAmount, feePercent, fixedFee = 0) {
  // Reverse of calculateGrossAmount
  return +((grossAmount - fixedFee) * (1 - feePercent)).toFixed(2);
}

// Helper to sync revenue summary
function syncRevenueSummary(courseBatch_id, callback) {
  const selectQuery = `
    SELECT COUNT(*) AS paid_count, SUM(amount_paid) AS total_received
    FROM student_payments
    WHERE courseBatch_id = ?
      AND payment_completed = TRUE
  `;
  //      AND amount_paid = full_amount_payable
  db.query(selectQuery, [courseBatch_id], (err, statsResult) => {
    if (err) return callback(err);
    const { paid_count, total_received } = statsResult[0];

    const updateRevenueQuery = `
      UPDATE course_revenue_summary
      SET
        paid_no_of_participants = ?,
        revenue_received_total = ?,
        all_fees_collected_status = IF(? >= no_of_participants, TRUE, FALSE)
      WHERE courseBatch_id = ?
    `;
    db.query(
      updateRevenueQuery,
      [paid_count, total_received || 0.0, paid_count, courseBatch_id],
      callback
    );
  });
}

function fetchFullAmountPayable(courseBatch_id, callback) {
  const query = `
    SELECT ccs.Rounded_CFPH
    FROM course_cost_summary ccs
    JOIN course_revenue_summary crs ON ccs.payment_main_details_id = crs.payments_main_details_id
    WHERE crs.courseBatch_id = ?
    ORDER BY ccs.created_at DESC
    LIMIT 1
  `;
  db.query(query, [courseBatch_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0)
      return callback(new Error("Course cost summary not found"));
    callback(null, parseFloat(rows[0].Rounded_CFPH));
  });
}

// --- PayHere hash generator ---
function generatePayHereHash(
  merchantId,
  orderId,
  amount,
  currency,
  merchantSecret
) {
  const formattedAmount = Number(amount).toFixed(2);
  const innerHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const hashString =
    merchantId + orderId + formattedAmount + currency + innerHash;

  const finalHash = crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  return finalHash;
}

// --- Helper to update student_payments based on all completed transactions ---
function updatePaymentFromTransactions(student_payment_id, callback) {
  db.query(
    `SELECT SUM(amount_paid) AS total_paid 
     FROM student_payment_transactions 
     WHERE student_payment_id = ? AND status = 'completed'`,
    [student_payment_id],
    (err, sumResults) => {
      if (err) return callback(err);

      const totalPaid = parseFloat(sumResults[0].total_paid) || 0;

      db.query(
        `SELECT full_amount_payable, courseBatch_id 
         FROM student_payments WHERE id = ?`,
        [student_payment_id],
        (err2, paymentRows) => {
          if (err2) return callback(err2);
          if (paymentRows.length === 0)
            return callback(new Error("Payment record not found"));

          const payment = paymentRows[0];
          const paymentCompleted =
            totalPaid === parseFloat(payment.full_amount_payable);

          db.query(
            `UPDATE student_payments 
             SET amount_paid = ?, payment_completed = ? 
             WHERE id = ?`,
            [totalPaid, paymentCompleted, student_payment_id],
            (err3) => {
              if (err3) return callback(err3);

              if (paymentCompleted) {
                return syncRevenueSummary(payment.courseBatch_id, callback);
              }
              callback(null);
            }
          );
        }
      );
    }
  );
}

router.post("/payhere/notify", (req, res) => {
  const {
    status_code,
    custom_1: studentId,
    payment_id,
    payhere_amount, // gross amount customer paid (includes fees)
    order_id,
  } = req.body;

  console.log("[Notify] Incoming payload:", req.body);

  db.query(
    `SELECT * FROM student_payment_transactions WHERE order_id = ?`,
    [order_id],
    (err, transactions) => {
      if (err) {
        console.error(
          `[Notify] DB error querying transactions for order_id=${order_id}:`,
          err
        );
        return res.status(500).send("DB error");
      }
      if (transactions.length === 0) {
        console.warn(`[Notify] Transaction not found for order_id=${order_id}`);
        return res.status(404).send("Transaction not found");
      }

      const transaction = transactions[0];

      // 📌 Add this log here
      console.log({
        status_code,
        payhere_amount,
        netReceived: calculateNetAmount(
          parseFloat(payhere_amount),
          PAYHERE_FEE_PERCENT,
          PAYHERE_FIXED_FEE
        ),
        transaction_amount: transaction.amount_paid,
      });

      if (status_code === "2") {
        // Calculate net amount received (subtract PayHere fees)
        const netReceived = calculateNetAmount(
          parseFloat(payhere_amount),
          PAYHERE_FEE_PERCENT,
          PAYHERE_FIXED_FEE
        );

        // Check net amount matches expected
        if (netReceived !== parseFloat(transaction.amount_paid)) {
          console.warn(
            `[Notify] Amount mismatch for order_id=${order_id}: expected net ${transaction.amount_paid}, received net ${netReceived}`
          );
          return res.status(400).send("Amount mismatch");
        }

        // Mark transaction completed
        db.query(
          `UPDATE student_payment_transactions 
           SET status = 'completed', 
               payment_id = ?, 
               payment_date = NOW(),
               amount_paid = ?
           WHERE id = ?`,
          [payment_id, netReceived, transaction.id],
          (err2) => {
            if (err2) {
              console.error(
                `[Notify] Failed to update transaction ID ${transaction.id}:`,
                err2
              );
              return res.status(500).send("Failed to update transaction");
            }

            // Use unified helper to recalc total & update student_payments + revenue
            updatePaymentFromTransactions(
              transaction.student_payment_id,
              (err3) => {
                if (err3) {
                  console.error(
                    `[Notify] Failed to update payment summary for student_payment_id=${transaction.student_payment_id}:`,
                    err3
                  );
                  return res
                    .status(500)
                    .send("Failed to update payment summary");
                }
                return res.sendStatus(200);
              }
            );
          }
        );
      } else {
        // Payment failed or cancelled
        db.query(
          `UPDATE student_payment_transactions 
           SET status = 'failed' 
           WHERE id = ?`,
          [transaction.id],
          (failErr) => {
            if (failErr) {
              console.error(
                `[Notify] Failed to update failed status for transaction id=${transaction.id}:`,
                failErr
              );
            }
            return res.sendStatus(200);
          }
        );
      }
    }
  );
});

router.use(auth.authMiddleware);

function checkCourseCapacity(courseBatch_id, callback) {
  const query = `
    SELECT no_of_participants, paid_no_of_participants
    FROM course_revenue_summary
    WHERE courseBatch_id = ?
    LIMIT 1
  `;
  db.query(query, [courseBatch_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0)
      return callback(new Error("Course revenue summary not found"));

    const { no_of_participants, paid_no_of_participants } = rows[0];
    if (paid_no_of_participants >= no_of_participants) {
      return callback(
        new Error("Course capacity is full. No more payments allowed.")
      );
    }
    callback(null);
  });
}

// --- POST endpoint for manual/offline payments ---
router.post("/", (req, res) => {
  const { error, value } = postSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { student_id, courseBatch_id, amount_paid } = value;

  // 🔹 Step 1: Capacity check before doing anything
  checkCourseCapacity(courseBatch_id, (capErr) => {
    if (capErr) return res.status(400).json({ error: capErr.message });

    // Step 2: Check if student already has payment record for this batch
    db.query(
      `SELECT id FROM student_payments WHERE student_id = ? AND courseBatch_id = ?`,
      [student_id, courseBatch_id],
      (err, existing) => {
        if (err) return res.status(500).json({ error: "DB error" });

        const insertTransaction = (student_payment_id) => {
          const orderId = `MANUAL_${Date.now()}`;
          const paymentId = `MANUAL_${Date.now()}_${Math.floor(
            10000 + Math.random() * 90000
          )}`;
          db.query(
            `INSERT INTO student_payment_transactions 
            (student_payment_id, order_id, amount_paid, status, payment_id, payment_date) 
            VALUES (?, ?, ?, 'completed', ?, NOW())`,
            [student_payment_id, orderId, amount_paid, paymentId],
            (err2) => {
              if (err2)
                return res.status(500).json({
                  error: "Failed to record manual payment transaction",
                });

              updatePaymentFromTransactions(student_payment_id, (err3) => {
                if (err3)
                  return res
                    .status(500)
                    .json({ error: "Failed to update payment summary" });
                res
                  .status(201)
                  .json({ message: "Manual payment recorded successfully." });
              });
            }
          );
        };

        if (existing.length > 0) {
          return res.status(400).json({
            error:
              "Student already has a payment record for this course batch.",
          });
        }

        // Step 3: Fetch payable amount and insert payment record
        fetchFullAmountPayable(
          courseBatch_id,
          (fetchErr, full_amount_payable) => {
            if (fetchErr)
              return res.status(400).json({ error: fetchErr.message });

            if (amount_paid > full_amount_payable) {
              return res
                .status(400)
                .json({ error: "Amount paid exceeds full amount payable." });
            }

            db.query(
              `INSERT INTO student_payments (
                student_id, courseBatch_id, user_id,
                amount_paid, full_amount_payable, payment_completed
              ) VALUES (?, ?, ?, 0, ?, FALSE)`,
              [student_id, courseBatch_id, req.user.id, full_amount_payable],
              (err4, result) => {
                if (err4) {
                  if (err4.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                      error:
                        "A Student with the same course batch already exists.",
                    });
                  }
                  return res.status(500).json({ error: "Insert failed" });
                }
                insertTransaction(result.insertId);
              }
            );
          }
        );
      }
    );
  });
});

// --- PATCH endpoint for manual/offline payment increments ---
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

    const remaining =
      parseFloat(record.full_amount_payable) - parseFloat(record.amount_paid);
    if (amount_paid > remaining) {
      return res
        .status(400)
        .json({ error: "Total payment exceeds full amount payable." });
    }

    const orderId = `MANUAL_${Date.now()}`;
    const paymentId = `MANUAL_${Date.now()}_${Math.floor(
      10000 + Math.random() * 90000
    )}`;
    db.query(
      `INSERT INTO student_payment_transactions 
      (student_payment_id, order_id, amount_paid, status, payment_id, payment_date) 
      VALUES (?, ?, ?, 'completed', ?, NOW())`,
      [id, orderId, amount_paid, paymentId],
      (err2) => {
        if (err2)
          return res
            .status(500)
            .json({ error: "Failed to record manual payment transaction" });

        updatePaymentFromTransactions(id, (err3) => {
          if (err3)
            return res
              .status(500)
              .json({ error: "Failed to update payment summary" });
          res.json({
            message: "Manual payment increment recorded successfully.",
          });
        });
      }
    );
  });
});

// Existing GET and DELETE remain unchanged
router.get("/", (req, res) => {
  const { courseBatch_id } = req.query;
  const query = `
    SELECT * FROM student_payments
    WHERE (? IS NULL OR courseBatch_id = ?)
  `;

  db.query(query, [courseBatch_id, courseBatch_id], (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });

    const user = req.user;
    const filtered = isPrivileged(user)
      ? results
      : results.filter((rec) => rec.user_id === user.id);

    res.json(filtered);
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query(`SELECT * FROM student_payments WHERE id = ?`, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (rows.length === 0)
      return res.status(404).json({ error: "Payment not found" });

    const record = rows[0];

    // ✅ Allow owner OR privileged role to delete
    if (record.user_id !== req.user.id && !isPrivileged(req.user)) {
      return res.status(403).json({
        error: "Forbidden. You cannot delete this payment record.",
      });
    }

    const wasFullySettled = !!record.payment_completed;

    db.query(`DELETE FROM student_payments WHERE id = ?`, [id], (err2) => {
      if (err2) return res.status(500).json({ error: "Delete failed" });

      if (wasFullySettled) {
        // 🔹 Reverse participant count & revenue for refund simulation
        db.query(
          `
          UPDATE course_revenue_summary
          SET 
            paid_no_of_participants = GREATEST(paid_no_of_participants - 1, 0),
            revenue_received_total = GREATEST(revenue_received_total - ?, 0),
            all_fees_collected_status = FALSE
          WHERE courseBatch_id = ?
        `,
          [record.amount_paid, record.courseBatch_id],
          (err3) => {
            if (err3) {
              return res
                .status(500)
                .json({ error: "Failed to update revenue after refund" });
            }
            return res.json({
              message:
                "Fully settled payment deleted and revenue summary updated (refund simulated).",
            });
          }
        );
      } else {
        // 🔹 Not fully settled → recalc from remaining payments
        syncRevenueSummary(record.courseBatch_id, (err3) => {
          if (err3)
            return res
              .status(500)
              .json({ error: "Revenue update failed after delete" });

          res.json({ message: "Deleted and revenue updated." });
        });
      }
    });
  });
});

router.post("/payhere/initiate-payment", (req, res) => {
  const { student_id, courseBatch_id, amount } = req.body; // amount = net amount you want to receive
  const user_id = req.user.id;

  if (!student_id || !courseBatch_id || !amount) {
    return res
      .status(400)
      .json({ error: "student_id, courseBatch_id and amount are required" });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than zero" });
  }

  db.query(
    `SELECT * FROM student_payments WHERE student_id = ? AND courseBatch_id = ?`,
    [student_id, courseBatch_id],
    (err, payments) => {
      if (err) {
        console.error("DB error in initiate-payment:", err);
        return res.status(500).json({ error: "DB error" });
      }

      // If student has no record yet → first instalment
      if (payments.length === 0) {
        // ✅ Check course capacity only for first payments
        checkCourseCapacity(courseBatch_id, (capErr) => {
          if (capErr) return res.status(400).json({ error: capErr.message });

          createFirstPaymentRecord();
        });
      } else {
        // ✅ Follow-up instalment — skip capacity check
        proceedWithTransaction(payments[0]);
      }
      // Helper: create first payment record
      function createFirstPaymentRecord() {
        fetchFullAmountPayable(courseBatch_id, (fetchErr, fullAmount) => {
          if (fetchErr) {
            console.error("Error fetching full amount payable:", fetchErr);
            return res.status(500).json({ error: fetchErr.message });
          }

          const newPayment = {
            student_id,
            courseBatch_id,
            user_id,
            full_amount_payable: fullAmount,
            amount_paid: 0,
            payment_completed: false,
          };

          db.query(
            `INSERT INTO student_payments 
                (student_id, courseBatch_id, user_id, full_amount_payable, amount_paid, payment_completed) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              newPayment.student_id,
              newPayment.courseBatch_id,
              newPayment.user_id,
              newPayment.full_amount_payable,
              newPayment.amount_paid,
              newPayment.payment_completed,
            ],
            (insertErr, result) => {
              if (insertErr) {
                if (insertErr.code === "ER_DUP_ENTRY") {
                  console.warn(
                    "Duplicate student payment detected, retrying fetch..."
                  );
                  db.query(
                    `SELECT * FROM student_payments WHERE student_id = ? AND courseBatch_id = ?`,
                    [student_id, courseBatch_id],
                    (reErr, rePayments) => {
                      if (reErr || rePayments.length === 0) {
                        console.error(
                          "Failed to fetch student payment after duplicate entry:",
                          reErr
                        );
                        return res.status(500).json({
                          error:
                            "Failed to fetch payment record after duplicate entry",
                        });
                      }
                      proceedWithTransaction(rePayments[0]);
                    }
                  );
                } else {
                  console.error(
                    "Failed to create student payment record:",
                    insertErr
                  );
                  return res
                    .status(500)
                    .json({ error: "Failed to create student payment record" });
                }
                return;
              }

              newPayment.id = result.insertId;
              proceedWithTransaction(newPayment);
            }
          );
        });
      }
      // Helper: proceed with PayHere transaction
      function proceedWithTransaction(paymentRecord) {
        const remainingAmount =
          parseFloat(paymentRecord.full_amount_payable) -
          parseFloat(paymentRecord.amount_paid);

        // Strictly disallow overpayment of net amount
        if (amount > remainingAmount) {
          return res
            .status(400)
            .json({ error: "Amount exceeds remaining balance" });
        }

        const grossAmount = calculateGrossAmount(amount, PAYHERE_FEE_PERCENT);

        const merchantId = process.env.MERCHANT_ID;
        const merchantSecret = process.env.MERCHANT_SECRET;
        const orderId = `ORDER_${Date.now()}_${Math.floor(
          Math.random() * 1000
        )}`;
        const currency = "LKR";

        // Store only the net amount (amount) in the transaction, NOT grossAmount
        db.query(
          `INSERT INTO student_payment_transactions
            (student_payment_id, order_id, amount_paid, status)
            VALUES (?, ?, ?, 'pending')`,
          [paymentRecord.id, orderId, amount],
          (insertErr) => {
            if (insertErr)
              return res
                .status(500)
                .json({ error: "Failed to create payment transaction" });

            // TODO: Replace placeholder data with actual student details
            const studentFirstName = "StudentFirstName";
            const studentLastName = "StudentLastName";
            const studentEmail = "student@example.com";
            const phone = "0770000000";
            const address = "Colombo";
            const city = "Colombo";
            const country = "Sri Lanka";

            const hash = generatePayHereHash(
              merchantId,
              orderId,
              grossAmount.toFixed(2), // Pass gross amount to PayHere
              currency,
              merchantSecret
            );

            const paymentData = {
              merchant_id: merchantId,
              return_url: config.payhere.successUrl,
              cancel_url: config.payhere.cancelUrl,
              notify_url: `${process.env.NGROK_URL}/api/student_payments/payhere/notify`,
              order_id: orderId,
              items: "Course Payment",
              amount: grossAmount.toFixed(2), // Charge customer gross amount
              currency,
              first_name: studentFirstName,
              last_name: studentLastName,
              email: studentEmail,
              phone,
              address,
              city,
              country,
              custom_1: student_id,
              hash,
            };

            return res.json(paymentData);
          }
        );
      }
    }
  );
});

module.exports = router;