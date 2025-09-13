const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const logger = require("../../logger");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const { resetApprovalFields } = require("../PayMain/util/resetDefaults");

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
const HR_CATEGORY = "Course Delivery Human Resources";
const MATERIALS_CATEGORY = "Course Delivery (Materials)";

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
  Md_approval_obtained: Joi.string().allow(null, "").optional(),
  Md_details: Joi.string().allow(null, "").optional(),

  cost_items: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().required(),
        no_of_officers: Joi.number().integer().min(1).optional(),
        hours: Joi.number().integer().min(1).optional(),
        rate: Joi.number().precision(2).min(0).optional(),
        amount: Joi.number().precision(2).min(0).optional(),
      })
    )
    .default([]),

  materials: Joi.array()
    .items(
      Joi.object({
        item_description: Joi.string().required(),
        required_quantity: Joi.number().integer().min(1).optional(),
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
    Md_approval_obtained,
    Md_details,
    cost_items,
    materials,
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

      const ownerUserId = rows[0].user_id;
      const isOwner = ownerUserId === req.user.id;
      const isPrivilegedUser = isPrivileged(req.user);

      if (!isOwner && !isPrivilegedUser) {
        return res.status(403).json({
          error: "Only the owner or a privileged user can create this record.",
        });
      }

      // ✅ Store the original owner user_id in course_overheads_main
      const finalUserId = ownerUserId;

      db.getConnection((connErr, connection) => {
        if (connErr) return res.status(500).json({ error: "Connection error" });

        connection.beginTransaction((transErr) => {
          if (transErr) {
            connection.release();
            return res.status(500).json({ error: "Transaction start failed" });
          }

          // 🔁 Step: Delete existing record (cascades to child tables)
          connection.query(
            `DELETE FROM course_delivery_costs WHERE payments_main_details_id = ?`,
            [payments_main_details_id],
            (deleteErr) => {
              if (deleteErr) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({
                    error: "Failed to delete existing course delivery record.",
                  });
                });
              }

              // Insert parent record
              connection.query(
                `INSERT INTO course_delivery_costs (payments_main_details_id, Md_approval_obtained, Md_details, total_cost, user_id)
                VALUES (?, ?, ?, 0, ?)`,
                [
                  payments_main_details_id,
                  Md_approval_obtained,
                  Md_details,
                  finalUserId,
                ],
                (insertErr, result) => {
                  if (insertErr) {
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({
                        error: "Failed to insert course_delivery_costs.",
                      });
                    });
                  }

                  const courseDeliveryCostId = result.insertId;
                  insertCostItem(0);

                  function insertCostItem(index) {
                    if (index >= cost_items.length) return insertMaterial(0);

                    const item = cost_items[index];
                    const privileged = isPrivileged(user);

                    connection.query(
                      `SELECT rate, rate_type FROM rates WHERE item_description = ? AND category = ?`,
                      [item.role, HR_CATEGORY],
                      (rateErr, rateRows) => {
                        if (rateErr) {
                          return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({
                              error: "Rate lookup failed for cost items.",
                            });
                          });
                        }

                        if (rateRows.length === 0) {
                          return connection.rollback(() => {
                            connection.release();
                            res.status(400).json({
                              error: `Rate not found for role: ${item.role}`,
                            });
                          });
                        }

                        const { rate: dbRate, rate_type } = rateRows[0];
                        let finalRate = item.rate;
                        let finalAmount = item.amount;

                        if (rate_type === "Hourly") {
                          if (
                            typeof item.no_of_officers !== "number" ||
                            typeof item.hours !== "number"
                          ) {
                            return connection.rollback(() => {
                              connection.release();
                              res.status(400).json({
                                error:
                                  "no_of_officers and hours are required for Hourly rate.",
                              });
                            });
                          }
                          finalRate =
                            privileged && typeof finalRate === "number"
                              ? finalRate
                              : dbRate;
                          finalAmount =
                            item.no_of_officers * item.hours * finalRate;
                        } else if (rate_type === "Full Payment") {
                          if (typeof finalAmount !== "number") {
                            return connection.rollback(() => {
                              connection.release();
                              res.status(400).json({
                                error:
                                  "Amount required for Full Payment rate type.",
                              });
                            });
                          }
                          finalRate =
                            privileged && typeof finalRate === "number"
                              ? finalRate
                              : dbRate;
                        } else {
                          return connection.rollback(() => {
                            connection.release();
                            res.status(400).json({
                              error: "Unsupported rate type for cost items.",
                            });
                          });
                        }

                        connection.query(
                          `INSERT INTO course_delivery_cost_items
                           (course_delivery_cost_id, role, no_of_officers, hours, rate, amount)
                           VALUES (?, ?, ?, ?, ?, ?)`,
                          [
                            courseDeliveryCostId,
                            item.role,
                            item.no_of_officers || 0,
                            item.hours || 0,
                            finalRate || 0,
                            finalAmount,
                          ],
                          (insertItemErr) => {
                            if (insertItemErr) {
                              return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({
                                  error: "Failed to insert cost item.",
                                });
                              });
                            }
                            insertCostItem(index + 1);
                          }
                        );
                      }
                    );
                  }

                  function insertMaterial(index) {
                    if (index >= materials.length) return calculateTotalCost();

                    const material = materials[index];
                    const privileged = isPrivileged(user);

                    connection.query(
                      `SELECT rate, rate_type FROM rates WHERE item_description = ? AND category = ?`,
                      [material.item_description, MATERIALS_CATEGORY],
                      (rateErr, rateRows) => {
                        if (rateErr) {
                          return connection.rollback(() => {
                            connection.release();
                            res
                              .status(500)
                              .json({ error: "Material rate lookup failed." });
                          });
                        }

                        const rateEntry = rateRows[0] || null;
                        let finalRate = material.rate;
                        let finalCost = material.cost;

                        if (rateEntry) {
                          if (
                            typeof finalCost === "number" &&
                            typeof finalRate !== "number" &&
                            typeof material.required_quantity !== "number"
                          ) {
                            // cost-only case, okay
                          } else if (rateEntry.rate_type === "Full Payment") {
                            if (typeof finalCost !== "number") {
                              return connection.rollback(() => {
                                connection.release();
                                res.status(400).json({
                                  error:
                                    "Cost is required for Full Payment materials.",
                                });
                              });
                            }
                            finalRate =
                              privileged && typeof finalRate === "number"
                                ? finalRate
                                : rateEntry.rate;
                          } else if (rateEntry.rate_type === "Quantity") {
                            if (
                              typeof material.required_quantity !== "number"
                            ) {
                              return connection.rollback(() => {
                                connection.release();
                                res.status(400).json({
                                  error:
                                    "Quantity is required for Quantity rate type.",
                                });
                              });
                            }
                            finalRate =
                              privileged && typeof finalRate === "number"
                                ? finalRate
                                : rateEntry.rate;
                            finalCost = finalRate * material.required_quantity;
                          }
                        } else {
                          if (typeof finalCost === "number") {
                            // OK for privileged or unknown rate
                          } else if (
                            privileged &&
                            typeof finalRate === "number" &&
                            typeof material.required_quantity === "number"
                          ) {
                            finalCost = finalRate * material.required_quantity;
                          } else {
                            return connection.rollback(() => {
                              connection.release();
                              res.status(400).json({
                                error:
                                  "Material not in rates. Non-privileged users must provide a cost.",
                              });
                            });
                          }
                        }

                        if (typeof finalCost !== "number") {
                          return connection.rollback(() => {
                            connection.release();
                            res
                              .status(400)
                              .json({ error: "Cost must be provided." });
                          });
                        }

                        connection.query(
                          `INSERT INTO course_materials_costing
                           (course_delivery_cost_id, item_description, required_quantity, rate, cost)
                           VALUES (?, ?, ?, ?, ?)`,
                          [
                            courseDeliveryCostId,
                            material.item_description,
                            material.required_quantity || 0,
                            finalRate || 0,
                            finalCost,
                          ],
                          (insertMaterialErr) => {
                            if (insertMaterialErr) {
                              return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({
                                  error: "Failed to insert material.",
                                });
                              });
                            }
                            insertMaterial(index + 1);
                          }
                        );
                      }
                    );
                  }

                  function calculateTotalCost() {
                    const costQuery = `
                      SELECT
                        IFNULL((SELECT SUM(amount) FROM course_delivery_cost_items WHERE course_delivery_cost_id = ?), 0) +
                        IFNULL((SELECT SUM(cost) FROM course_materials_costing WHERE course_delivery_cost_id = ?), 0)
                        AS total_cost
                    `;

                    connection.query(
                      costQuery,
                      [courseDeliveryCostId, courseDeliveryCostId],
                      (costErr, costRows) => {
                        if (costErr) {
                          return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({
                              error: "Failed to calculate total cost.",
                            });
                          });
                        }

                        const totalCost = costRows[0].total_cost;

                        connection.query(
                          `UPDATE course_delivery_costs SET total_cost = ? WHERE id = ?`,
                          [totalCost, courseDeliveryCostId],
                          (updateErr) => {
                            if (updateErr) {
                              return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({
                                  error: "Failed to update total cost.",
                                });
                              });
                            }

                            // connection.commit((commitErr) => {
                            //   if (commitErr) {
                            //     return connection.rollback(() => {
                            //       connection.release();
                            //       res
                            //         .status(500)
                            //         .json({ error: "Commit failed." });
                            //     });
                            //   }

                            //   connection.release();
                            //   logger.info(
                            //     `Course delivery full record created by user ${user.id}`
                            //   );
                            //   res.status(201).json({
                            //     message:
                            //       "Course delivery record created successfully.",
                            //   });
                            // });
                            connection.commit((commitErr) => {
                              if (commitErr) {
                                return connection.rollback(() => {
                                  connection.release();
                                  res
                                    .status(500)
                                    .json({ error: "Commit failed." });
                                });
                              }

                              connection.release(); // ✅ Release first

                              // 🔁 Then reset approval fields using a separate connection
                              resetApprovalFields(
                                payments_main_details_id,
                                req.user.id,
                                (resetErr, result) => {
                                  if (resetErr) {
                                    logger.warn(
                                      "Approval fields reset failed:",
                                      resetErr.message
                                    );
                                  } else {
                                    logger.info(
                                      "Approval fields reset successfully."
                                    );
                                  }
                                }
                              );

                              logger.info(
                                `Course delivery full record created by user ${user.id}`
                              );
                              res.status(201).json({
                                message:
                                  "Course delivery record created successfully.",
                              });
                            });
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
      });
    }
  );
});

// GET: fetch all course delivery costs with their cost_items and materials
router.get("/full", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  const baseQuery = `
      SELECT cdc.*, pmd.user_id
      FROM course_delivery_costs cdc
      JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
      ${privileged ? "" : "WHERE pmd.user_id = ?"}
    `;

  const params = privileged ? [] : [user.id];

  db.query(baseQuery, params, (err, costRows) => {
    if (err) {
      logger.error("GET /full error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (costRows.length === 0) return res.json([]);

    const ids = costRows.map((row) => row.id);

    // Fetch cost_items
    const costItemsQuery = `
        SELECT * FROM course_delivery_cost_items
        WHERE course_delivery_cost_id IN (?)
      `;
    db.query(costItemsQuery, [ids], (err2, costItems) => {
      if (err2) {
        logger.error("GET cost items error:", err2);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Fetch materials
      const materialsQuery = `
          SELECT * FROM course_materials_costing
          WHERE course_delivery_cost_id IN (?)
        `;
      db.query(materialsQuery, [ids], (err3, materials) => {
        if (err3) {
          logger.error("GET materials error:", err3);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Combine
        const results = costRows.map((costRow) => {
          return {
            ...costRow,
            cost_items: costItems.filter(
              (item) => item.course_delivery_cost_id === costRow.id
            ),
            materials: materials.filter(
              (mat) => mat.course_delivery_cost_id === costRow.id
            ),
          };
        });

        res.json(results);
      });
    });
  });
});

// // DELETE: remove a full course delivery cost record and cascade delete children
// router.delete("/full/:id", (req, res) => {
//   const id = req.params.id;

//   const ownershipQuery = `
//       SELECT pmd.user_id
//       FROM course_delivery_costs cdc
//       JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
//       WHERE cdc.id = ?
//     `;

//   db.query(ownershipQuery, [id], (err, rows) => {
//     if (err) return res.status(500).json({ error: "DB error" });
//     if (rows.length === 0)
//       return res.status(404).json({ error: "Record not found" });

//     const isOwner = req.user.id === rows[0].user_id;
//     const isPrivilegedUser = isPrivileged(req.user);

//     if (!isOwner && !isPrivilegedUser) {
//       return res.status(403).json({ error: "Not authorized to delete" });
//     }

//     db.query(`DELETE FROM course_delivery_costs WHERE id = ?`, [id], (err2) => {
//       if (err2) {
//         logger.error("Delete error:", err2);
//         return res.status(500).json({ error: "Delete failed" });
//       }

//       logger.info(`Course delivery cost ${id} deleted by user ${req.user.id}`);
//       res.json({ message: "Record and associated entries deleted" });
//     });
//   });
// });

router.delete("/full/:id", (req, res) => {
  const id = req.params.id;

  const ownershipQuery = `
      SELECT pmd.user_id, pmd.id AS payments_main_details_id
      FROM course_delivery_costs cdc
      JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
      WHERE cdc.id = ?
    `;

  db.query(ownershipQuery, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (rows.length === 0)
      return res.status(404).json({ error: "Record not found" });

    const { user_id: ownerId, payments_main_details_id } = rows[0];
    const isOwner = req.user.id === ownerId;
    const isPrivilegedUser = isPrivileged(req.user);

    if (!isOwner && !isPrivilegedUser) {
      return res.status(403).json({ error: "Not authorized to delete" });
    }

    db.query(`DELETE FROM course_delivery_costs WHERE id = ?`, [id], (err2) => {
      if (err2) {
        logger.error("Delete error:", err2);
        return res.status(500).json({ error: "Delete failed" });
      }

      // ✅ Run resetApprovalFields after successful delete
      resetApprovalFields(
        payments_main_details_id,
        req.user.id,
        (resetErr, result) => {
          if (resetErr) {
            logger.warn(
              `Reset approval fields failed for PMD ID ${payments_main_details_id}:`,
              resetErr.message
            );
          } else {
            logger.info(
              `Approval fields reset after deletion for PMD ID ${payments_main_details_id}`
            );
          }
        }
      );

      logger.info(`Course delivery cost ${id} deleted by user ${req.user.id}`);
      res.json({ message: "Record and associated entries deleted" });
    });
  });
});

module.exports = router;
