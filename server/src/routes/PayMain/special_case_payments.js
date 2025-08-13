const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const logger = require("../../logger");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const { resetApprovalFields } = require("../PayMain/util/resetDefaults"); // adjust the path as needed

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  handler: (req, res) => {
    res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  },
});

router.use(auth.authMiddleware);
router.use(limiter);

const PRIVILEGED_ROLES = [
  "SuperAdmin",
  "finance_manager",
  "CTM",
  "DCTM01",
  "DCTM02",
  "sectional_head",
];

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

function isFinanceManager(user) {
  const roles = normalizeRoles(user.role);
  return roles.includes("finance_manager");
}

const schema = Joi.object({
  payments_main_details_id: Joi.number().integer().required(),
  sc_title: Joi.string().required(),
  description: Joi.string().allow(null, ""),
  percent_payment_or_not: Joi.boolean().required(),
  percentage: Joi.number().precision(2).min(0).max(100).allow(null),
  total_payable: Joi.number().precision(2).min(0).allow(null),
});

const patchSchema = Joi.object({
  amount_paid: Joi.number().positive().required(),
});

function calculateRoundedCT_Callback(payments_main_details_id, callback) {
  db.query(
    `SELECT user_id, no_of_participants FROM payments_main_details WHERE id = ?`,
    [payments_main_details_id],
    (err, rows) => {
      if (err) return callback("DB error fetching payment details", null);
      if (rows.length === 0)
        return callback("Invalid payments_main_details_id", null);

      const participants = parseInt(rows[0].no_of_participants);
      if (!participants || participants <= 0)
        return callback("Participants must be greater than 0", null);

      const costQuery = `
        SELECT
          (SELECT IFNULL(total_cost, 0) FROM course_development_work WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS dev_cost,
          (SELECT IFNULL(total_cost, 0) FROM course_delivery_costs WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS delivery_cost,
          (SELECT IFNULL(total_cost, 0) FROM course_overheads_main WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS overhead_cost
      `;

      db.query(
        costQuery,
        [
          payments_main_details_id,
          payments_main_details_id,
          payments_main_details_id,
        ],
        (costErr, costRows) => {
          if (costErr) return callback("DB error fetching cost data", null);

          const dev = parseFloat(costRows[0].dev_cost) || 0;
          const del = parseFloat(costRows[0].delivery_cost) || 0;
          const ovh = parseFloat(costRows[0].overhead_cost) || 0;

          const total_cost_expense = dev + del + ovh;
          if (total_cost_expense <= 0)
            return callback("Total cost must be greater than 0", null);

          db.query(
            `SELECT item_description, rate
             FROM rates
             WHERE category = 'Course Cost Final Report'
             AND item_description IN (
               'Profit Margin Percentage',
               'NBT',
               'Provision For Inflation Percentage',
               'VAT'
             )`,
            (rateErr, rateRows) => {
              if (rateErr) return callback("Error fetching rates", null);

              const rateMap = {};
              for (const r of rateRows)
                rateMap[r.item_description] = parseFloat(r.rate);

              const required = [
                "Profit Margin Percentage",
                "NBT",
                "Provision For Inflation Percentage",
                "VAT",
              ];

              const missing = required.filter(
                (key) => !(key in rateMap) || isNaN(rateMap[key])
              );
              if (missing.length > 0)
                return callback(
                  `Missing or invalid rate(s): ${missing.join(", ")}`,
                  null
                );

              const inflation =
                (rateMap["Provision For Inflation Percentage"] / 100) *
                total_cost_expense;
              const nbt =
                ((total_cost_expense + inflation) * rateMap["NBT"]) / 100;
              const profit =
                ((total_cost_expense + inflation + nbt) *
                  rateMap["Profit Margin Percentage"]) /
                100;
              const subtotal = total_cost_expense + inflation + nbt + profit;
              const vat = (subtotal * rateMap["VAT"]) / 100;
              const total_course_cost = subtotal + vat;

              const course_fee_per_head = total_course_cost / participants;
              const roundedCFPH = Math.ceil(course_fee_per_head / 50) * 50;
              const roundedCT = roundedCFPH * participants;

              if (isNaN(roundedCT) || roundedCT <= 0 || !isFinite(roundedCT))
                return callback("Invalid Rounded_CT result", null);

              return callback(null, roundedCT);
            }
          );
        }
      );
    }
  );
}

router.post("/bulk", (req, res) => {
  const user = req.user;
  const { payments_main_details_id, entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res
      .status(400)
      .json({ error: "Entries must be a non-empty array." });
  }

  // Validate entries first
  const validatedEntries = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = { ...entries[i], payments_main_details_id };
    const { error, value } = schema.validate(entry);
    if (error) {
      return res.status(400).json({
        error: `Validation error in entry ${i + 1}: ${
          error.details[0].message
        }`,
      });
    }
    validatedEntries.push(value);
  }

  // Ownership check
  db.query(
    `SELECT user_id FROM payments_main_details WHERE id = ?`,
    [payments_main_details_id],
    (err, rows) => {
      if (err) {
        logger.error("DB error during owner check:", err);
        return res.status(500).json({ error: "DB error." });
      }

      if (rows.length === 0) {
        return res
          .status(400)
          .json({ error: "Invalid payments_main_details_id." });
      }

      const ownerUserId = rows[0].user_id;
      const isOwner = ownerUserId === user.id;
      const isPrivilegedUser = isPrivileged(user);

      if (!isOwner && !isPrivilegedUser) {
        return res.status(403).json({
          error: "Only the owner or a privileged user can create this record.",
        });
      }

      // Compute Rounded_CT before insertion
      calculateRoundedCT_Callback(
        payments_main_details_id,
        (calcErr, roundedCT) => {
          if (calcErr) {
            logger.error("Rounded_CT calculation failed:", calcErr);
            return res
              .status(400)
              .json({ error: `Calculation error: ${calcErr}` });
          }

          db.getConnection((connErr, connection) => {
            if (connErr) {
              logger.error("Connection error:", connErr);
              return res
                .status(500)
                .json({ error: "Database connection error." });
            }

            connection.beginTransaction((transErr) => {
              if (transErr) {
                connection.release();
                logger.error("Transaction error:", transErr);
                return res
                  .status(500)
                  .json({ error: "Transaction start error." });
              }

              const created = [];
              let totalSpecialCaseSum = 0;

              const processNext = (index) => {
                if (index >= validatedEntries.length) {
                  // After all inserts, update course_delivery_costs total_cost
                  connection.query(
                    `
                  SELECT id, total_cost 
                  FROM course_delivery_costs 
                  WHERE payments_main_details_id = ? 
                  ORDER BY created_at DESC 
                  LIMIT 1
                  `,
                    [payments_main_details_id],
                    (selectErr, selectRows) => {
                      if (selectErr) {
                        logger.error(
                          "Error fetching latest course_delivery_costs:",
                          selectErr
                        );
                        return connection.rollback(() => {
                          connection.release();
                          res
                            .status(500)
                            .json({ error: "DB error updating total cost." });
                        });
                      }

                      if (selectRows.length === 0) {
                        return connection.commit((commitErr) => {
                          connection.release();
                          if (commitErr) {
                            logger.error("Commit error:", commitErr);
                            return res
                              .status(500)
                              .json({ error: "Commit failed." });
                          }
                          return res.status(201).json({
                            message: `${created.length} special case payments created. No course_delivery_costs record to update.`,
                            created,
                          });
                        });
                      }

                      const latestRecord = selectRows[0];
                      const newTotalCost =
                        (parseFloat(latestRecord.total_cost) || 0) +
                        totalSpecialCaseSum;

                      connection.query(
                        `UPDATE course_delivery_costs SET total_cost = ? WHERE id = ?`,
                        [newTotalCost, latestRecord.id],
                        (updateErr) => {
                          if (updateErr) {
                            logger.error(
                              "Error updating course_delivery_costs total_cost:",
                              updateErr
                            );
                            return connection.rollback(() => {
                              connection.release();
                              res.status(500).json({
                                error: "DB error updating total cost.",
                              });
                            });
                          }

                          // connection.commit((commitErr) => {
                          //   connection.release();
                          //   if (commitErr) {
                          //     logger.error("Commit error:", commitErr);
                          //     return res
                          //       .status(500)
                          //       .json({ error: "Commit failed." });
                          //   }

                          //   return res.status(201).json({
                          //     message: `${created.length} special case payments created. course_delivery_costs total_cost updated.`,
                          //     created,
                          //     updated_total_cost: newTotalCost,
                          //   });
                          // });
                          connection.commit((commitErr) => {
                            connection.release();
                            if (commitErr) {
                              logger.error("Commit error:", commitErr);
                              return res
                                .status(500)
                                .json({ error: "Commit failed." });
                            }

                            // ✅ Call resetApprovalFields only after successful commit
                            resetApprovalFields(
                              payments_main_details_id,
                              user.id,
                              (resetErr, resetResult) => {
                                if (resetErr) {
                                  logger.error(
                                    "Approval fields reset failed:",
                                    resetErr
                                  );
                                  // Insert was successful, so we respond with a warning
                                  return res.status(201).json({
                                    message: `${created.length} special case payments created. course_delivery_costs total_cost updated. BUT approval fields reset failed.`,
                                    created,
                                    updated_total_cost: newTotalCost,
                                    approval_reset: false,
                                  });
                                }

                                // ✅ Success case
                                return res.status(201).json({
                                  message: `${created.length} special case payments created. course_delivery_costs total_cost updated. Approval fields reset.`,
                                  created,
                                  updated_total_cost: newTotalCost,
                                  approval_reset: true,
                                });
                              }
                            );
                          });
                        }
                      );
                    }
                  );
                  return;
                }

                const entry = validatedEntries[index];
                const {
                  sc_title,
                  description,
                  percent_payment_or_not,
                  percentage,
                  total_payable,
                } = entry;

                let computedPayable = 0;

                if (percent_payment_or_not) {
                  if (percentage == null) {
                    return connection.rollback(() => {
                      connection.release();
                      res.status(400).json({
                        error: `Entry ${
                          index + 1
                        }: Percentage is required for percent-based entries.`,
                      });
                    });
                  }
                  computedPayable = (percentage / 100) * roundedCT;
                } else {
                  if (total_payable == null) {
                    return connection.rollback(() => {
                      connection.release();
                      res.status(400).json({
                        error: `Entry ${
                          index + 1
                        }: Total payable must be provided for fixed payments.`,
                      });
                    });
                  }
                  computedPayable = total_payable;
                }

                totalSpecialCaseSum += computedPayable;

                // Delete any existing record with same composite key
                connection.query(
                  `DELETE FROM special_case_payments WHERE payments_main_details_id = ? AND sc_title = ?`,
                  [payments_main_details_id, sc_title],
                  (delErr) => {
                    if (delErr) {
                      logger.error("Delete duplicate error:", delErr);
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({
                          error: `Entry ${
                            index + 1
                          }: Failed to delete existing duplicate.`,
                        });
                      });
                    }

                    connection.query(
                      `INSERT INTO special_case_payments (
                        payments_main_details_id,
                        sc_title,
                        description,
                        percent_payment_or_not,
                        percentage,
                        amount_paid,
                        total_payable,
                        updated_by_id
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        payments_main_details_id,
                        sc_title,
                        description ?? null,
                        percent_payment_or_not,
                        percentage ?? null,
                        0,
                        computedPayable,
                        req.user.id, // ✅ still updating properly
                      ],
                      (insertErr, result) => {
                        if (insertErr) {
                          logger.error("Insert error:", insertErr);
                          return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({
                              error: `Entry ${index + 1}: Insert failed.`,
                            });
                          });
                        }

                        created.push({
                          id: result.insertId,
                          total_payable: computedPayable,
                        });

                        processNext(index + 1);
                      }
                    );
                  }
                );
              };

              processNext(0);
            });
          });
        }
      );
    }
  );
});

router.patch("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { error, value } = patchSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const amountPaidIncrement = parseFloat(value.amount_paid);
  if (isNaN(amountPaidIncrement) || amountPaidIncrement <= 0) {
    return res.status(400).json({ error: "Invalid amount_paid value." });
  }

  const user = req.user;
  const privileged = isPrivileged(user);

  db.query(
    `SELECT scp.*, pmd.user_id
     FROM special_case_payments scp
     JOIN payments_main_details pmd ON scp.payments_main_details_id = pmd.id
     WHERE scp.id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        logger.error("DB error fetching special_case_payment:", err);
        return res.status(500).json({ error: "DB error." });
      }
      if (rows.length === 0) {
        return res.status(404).json({ error: "Record not found." });
      }

      const record = rows[0];
      const isOwner = record.user_id === user.id;
      if (!privileged && !isOwner) {
        return res.status(403).json({ error: "Forbidden: Not authorized." });
      }

      const currentTotalPayable = parseFloat(record.total_payable) || 0;
      const currentPaid = parseFloat(record.amount_paid) || 0;

      if (currentTotalPayable <= 0) {
        return res.status(400).json({
          error: "Cannot update payment. Total payable is not set or invalid.",
        });
      }

      if (currentPaid >= currentTotalPayable) {
        return res.status(400).json({
          error: "Payment already complete. No further payment allowed.",
        });
      }

      const proposedPaid = +(currentPaid + amountPaidIncrement).toFixed(2);

      if (proposedPaid > currentTotalPayable) {
        return res.status(400).json({
          error: `Amount exceeds total payable. You can only add up to ${(
            currentTotalPayable - currentPaid
          ).toFixed(2)}.`,
        });
      }

      db.query(
        `UPDATE special_case_payments 
         SET amount_paid = ?, updated_by_id = ? 
         WHERE id = ?`,
        [proposedPaid, user.id, id],
        (updateErr) => {
          if (updateErr) {
            logger.error("Failed to update special_case_payment:", updateErr);
            return res.status(500).json({ error: "Update failed." });
          }

          logger.info(
            `Amount paid updated for special_case_payment ${id} by user ${user.id}`
          );

          res.json({
            message: "Amount paid updated successfully.",
            amount_paid: proposedPaid,
            total_payable: currentTotalPayable,
          });
        }
      );
    }
  );
});

router.get("/by-payment/:id", (req, res) => {
  const paymentId = parseInt(req.params.id, 10);
  const user = req.user;
  const privileged = isPrivileged(user);

  if (isNaN(paymentId)) {
    return res.status(400).json({ error: "Invalid payment ID." });
  }

  // Ownership check
  db.query(
    `SELECT user_id FROM payments_main_details WHERE id = ?`,
    [paymentId],
    (err, rows) => {
      if (err) {
        logger.error("DB error fetching payment owner:", err);
        return res.status(500).json({ error: "DB error" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: "Payment record not found." });
      }

      const ownerId = rows[0].user_id;
      if (!privileged && user.id !== ownerId) {
        return res
          .status(403)
          .json({ error: "Forbidden: Not allowed to access this data." });
      }

      db.query(
        `SELECT * FROM special_case_payments WHERE payments_main_details_id = ?`,
        [paymentId],
        (err2, result) => {
          if (err2) {
            logger.error("DB error fetching special case payments:", err2);
            return res.status(500).json({ error: "DB error" });
          }
          res.json(result);
        }
      );
    }
  );
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = req.user;
  const privileged = isPrivileged(user);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID." });
  }

  db.query(
    `SELECT scp.*, pmd.user_id
     FROM special_case_payments scp
     JOIN payments_main_details pmd ON scp.payments_main_details_id = pmd.id
     WHERE scp.id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        logger.error("DB error fetching special case payment by ID:", err);
        return res.status(500).json({ error: "DB error" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: "Record not found." });
      }

      const record = rows[0];
      if (!privileged && user.id !== record.user_id) {
        return res
          .status(403)
          .json({ error: "Forbidden: You are not authorized." });
      }

      res.json(record);
    }
  );
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = req.user;
  const privileged = isPrivileged(user);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID." });
  }

  db.query(
    `SELECT scp.payments_main_details_id, pmd.user_id
     FROM special_case_payments scp
     JOIN payments_main_details pmd ON scp.payments_main_details_id = pmd.id
     WHERE scp.id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        logger.error("DB error on delete lookup:", err);
        return res.status(500).json({ error: "DB error" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: "Record not found." });
      }

      const ownerId = rows[0].user_id;
      if (!privileged && user.id !== ownerId) {
        return res
          .status(403)
          .json({ error: "Forbidden: Not allowed to delete this record." });
      }

      db.query(
        `DELETE FROM special_case_payments WHERE id = ?`,
        [id],
        (deleteErr) => {
          if (deleteErr) {
            logger.error("DB error deleting special case payment:", deleteErr);
            return res.status(500).json({ error: "Delete failed." });
          }

          logger.info(`Special case payment ${id} deleted by user ${user.id}`);
          res.json({ message: "Record deleted successfully." });
        }
      );
    }
  );
});

router.delete("/by-payment/:paymentMainDetailsId", (req, res) => {
  const paymentId = parseInt(req.params.paymentMainDetailsId, 10);
  const user = req.user;
  const privileged = isPrivileged(user);

  if (isNaN(paymentId)) {
    return res.status(400).json({ error: "Invalid payment ID." });
  }

  db.query(
    `SELECT user_id FROM payments_main_details WHERE id = ?`,
    [paymentId],
    (err, rows) => {
      if (err) {
        logger.error("DB error in lookup:", err);
        return res.status(500).json({ error: "DB error" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: "Payment record not found." });
      }

      const ownerId = rows[0].user_id;
      if (!privileged && user.id !== ownerId) {
        return res
          .status(403)
          .json({ error: "Forbidden: Not allowed to delete this data." });
      }

      // Step 1: Calculate sum of special case payments to remove
      db.query(
        `SELECT SUM(total_payable) AS total_special_sum FROM special_case_payments WHERE payments_main_details_id = ?`,
        [paymentId],
        (sumErr, sumRows) => {
          if (sumErr) {
            logger.error("Error summing special case payments:", sumErr);
            return res.status(500).json({ error: "DB error" });
          }

          const totalSpecialSum = parseFloat(sumRows[0].total_special_sum) || 0;

          if (totalSpecialSum === 0) {
            // No special case payments to delete, just delete anyway for consistency
            // Proceed to delete without cost adjustment
            return deleteSpecialCasePayments();
          }

          // Step 2: Find latest course_delivery_costs record
          db.query(
            `SELECT id, total_cost FROM course_delivery_costs WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1`,
            [paymentId],
            (costErr, costRows) => {
              if (costErr) {
                logger.error("Error fetching course_delivery_costs:", costErr);
                return res.status(500).json({ error: "DB error" });
              }

              if (costRows.length === 0) {
                // No cost record to adjust, proceed to delete
                return deleteSpecialCasePayments();
              }

              const latestCostRecord = costRows[0];
              const currentTotalCost =
                parseFloat(latestCostRecord.total_cost) || 0;

              // Step 3: Subtract totalSpecialSum safely (avoid negative)
              let newTotalCost = currentTotalCost - totalSpecialSum;
              if (newTotalCost < 0) newTotalCost = 0;

              // Step 4: Update total_cost in course_delivery_costs
              db.query(
                `UPDATE course_delivery_costs SET total_cost = ? WHERE id = ?`,
                [newTotalCost, latestCostRecord.id],
                (updateErr) => {
                  if (updateErr) {
                    logger.error(
                      "Error updating course_delivery_costs total_cost:",
                      updateErr
                    );
                    return res.status(500).json({ error: "DB error" });
                  }

                  // Step 5: Delete special_case_payments after updating cost
                  return deleteSpecialCasePayments(newTotalCost);
                }
              );
            }
          );

          // // Helper function to delete special case payments and respond
          // function deleteSpecialCasePayments(updatedTotalCost) {
          //   db.query(
          //     `DELETE FROM special_case_payments WHERE payments_main_details_id = ?`,
          //     [paymentId],
          //     (deleteErr) => {
          //       if (deleteErr) {
          //         logger.error("Delete error:", deleteErr);
          //         return res.status(500).json({ error: "Delete failed." });
          //       }

          //       logger.info(
          //         `Special case payments deleted for payment ${paymentId} by user ${user.id}`
          //       );

          //       const message = "All special case payments deleted.";
          //       if (typeof updatedTotalCost === "number") {
          //         return res.json({
          //           message,
          //           updated_total_cost: updatedTotalCost,
          //         });
          //       }
          //       return res.json({ message });
          //     }
          //   );
          // }

          // Helper function to delete special case payments and respond
          function deleteSpecialCasePayments(updatedTotalCost) {
            db.query(
              `DELETE FROM special_case_payments WHERE payments_main_details_id = ?`,
              [paymentId],
              (deleteErr) => {
                if (deleteErr) {
                  logger.error("Delete error:", deleteErr);
                  return res.status(500).json({ error: "Delete failed." });
                }

                logger.info(
                  `Special case payments deleted for payment ${paymentId} by user ${user.id}`
                );

                // Now call resetApprovalFields after successful deletion
                resetApprovalFields(
                  paymentId,
                  user.id,
                  (resetErr, resetRes) => {
                    if (resetErr) {
                      logger.error("Approval fields reset failed:", resetErr);
                      // Still respond success for deletion, but inform about reset failure
                      const message =
                        "All special case payments deleted. Failed to reset approval fields.";
                      if (typeof updatedTotalCost === "number") {
                        return res.json({
                          message,
                          updated_total_cost: updatedTotalCost,
                        });
                      }
                      return res.json({ message });
                    }

                    const message =
                      "All special case payments deleted and approval fields reset.";
                    if (typeof updatedTotalCost === "number") {
                      return res.json({
                        message,
                        updated_total_cost: updatedTotalCost,
                      });
                    }
                    return res.json({ message });
                  }
                );
              }
            );
          }
        }
      );
    }
  );
});

module.exports = router;
