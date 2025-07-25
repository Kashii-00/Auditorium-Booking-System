// routes/course_cost_summary.js
const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const logger = require("../../logger");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiter
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

const postSchema = Joi.object({
  payment_main_details_id: Joi.number().integer().required(),
});

router.post("/", (req, res) => {
  const postSchema = Joi.object({
    payment_main_details_id: Joi.number().integer().required(),
    check_by: Joi.string().max(255).optional(),
  });

  const { error, value } = postSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { payment_main_details_id, check_by } = value;
  const user = req.user;

  // Step 1: Ownership check
  db.query(
    `SELECT user_id FROM payments_main_details WHERE id = ?`,
    [payment_main_details_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res
          .status(400)
          .json({ error: "Invalid payment_main_details_id" });

      const ownerId = rows[0].user_id;
      const userIsOwner = ownerId === user.id;
      const userIsPrivileged = isPrivileged(user);

      if (!userIsOwner && !userIsPrivileged) {
        return res.status(403).json({
          error:
            "Forbidden: Only the owner or a privileged user can create summary.",
        });
      }

      // Step 2: Fetch cost totals and participants
      const getCostsQuery = `
        SELECT
          (SELECT IFNULL(total_cost, 0) FROM course_development_work WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS dev_cost,
          (SELECT IFNULL(total_cost, 0) FROM course_delivery_costs WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS delivery_cost,
          (SELECT IFNULL(total_cost, 0) FROM course_overheads_main WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS overhead_cost,
          (SELECT no_of_participants FROM payments_main_details WHERE id = ?) AS participants
      `;

      db.query(
        getCostsQuery,
        [
          payment_main_details_id,
          payment_main_details_id,
          payment_main_details_id,
          payment_main_details_id,
        ],
        (err, results) => {
          if (err)
            return res
              .status(500)
              .json({ error: "DB Error in fetching costs" });

          const row = results[0];

          const devCost = parseFloat(row.dev_cost) || 0;
          const deliveryCost = parseFloat(row.delivery_cost) || 0;
          const overheadCost = parseFloat(row.overhead_cost) || 0;
          const no_of_participants = parseInt(row.participants);

          if ([devCost, deliveryCost, overheadCost].some((x) => isNaN(x))) {
            return res.status(400).json({
              error:
                "One or more of the cost components (development, delivery, overhead) are missing or invalid.",
            });
          }

          const total_cost_expense = devCost + deliveryCost + overheadCost;

          if (total_cost_expense <= 0) {
            return res.status(400).json({
              error:
                "At least one of the development, delivery, or overhead costs must be greater than zero.",
            });
          }

          if (
            no_of_participants === null ||
            isNaN(no_of_participants) ||
            no_of_participants <= 0
          ) {
            return res.status(400).json({
              error:
                "Number of participants must be provided and greater than zero to calculate cost per head.",
            });
          }

          // Step 3: Fetch rates
          db.query(
            `
              SELECT item_description, rate
              FROM rates
              WHERE category = 'Course Cost Final Report'
              AND item_description IN ('Profit Margin Percentage', 'NBT', 'Provision For Inflation Percentage')
            `,
            (err, rates) => {
              if (err)
                return res.status(500).json({ error: "Error fetching rates" });

              const rateMap = {};
              for (const rate of rates)
                rateMap[rate.item_description] = parseFloat(rate.rate);

              const requiredRates = [
                "Profit Margin Percentage",
                "Provision For Inflation Percentage",
                "NBT",
              ];

              const missingRates = requiredRates.filter(
                (key) =>
                  !(key in rateMap) ||
                  rateMap[key] === null ||
                  isNaN(rateMap[key])
              );

              if (missingRates.length > 0) {
                return res.status(400).json({
                  error: `Missing or invalid rate(s): ${missingRates.join(
                    ", "
                  )}`,
                });
              }

              const profitPercent = rateMap["Profit Margin Percentage"];
              const inflationPercent =
                rateMap["Provision For Inflation Percentage"];
              const nbtAmount = rateMap["NBT"];

              // Step 4: Calculations
              const inflationAmount =
                (inflationPercent / 100) * total_cost_expense;
              const profitAmount =
                (profitPercent / 100) *
                (total_cost_expense + inflationAmount + nbtAmount);

              const total_course_cost =
                total_cost_expense + inflationAmount + nbtAmount + profitAmount;

              const course_fee_per_head =
                total_course_cost / no_of_participants;

              const roundedCourseFeePerHead =
                Math.ceil(course_fee_per_head / 50) * 50;
              const roundedCourseTotal =
                roundedCourseFeePerHead * no_of_participants;

              const finalValues = [
                total_cost_expense,
                inflationAmount,
                profitAmount,
                total_course_cost,
                course_fee_per_head,
                roundedCourseFeePerHead,
                roundedCourseTotal,
              ];

              if (finalValues.some((val) => isNaN(val))) {
                console.error("Derived NaN values:", {
                  total_cost_expense,
                  inflationAmount,
                  profitAmount,
                  total_course_cost,
                  course_fee_per_head,
                  roundedCourseFeePerHead,
                  roundedCourseTotal,
                });

                return res.status(400).json({
                  error:
                    "Calculation error: One or more derived values are invalid (NaN).",
                });
              }

              // Step 5: Insert final record
              const insertQuery = `
                INSERT INTO course_cost_summary (
                  payment_main_details_id,
                  profit_margin_percentage,
                  profit_margin,
                  provision_inflation_percentage,
                  total_cost_expense,
                  NBT,
                  total_course_cost,
                  no_of_participants,
                  course_fee_per_head,
                  Rounded_CFPH,
                  Rounded_CT,
                  prepared_by,
                  prepared_by_id,
                  check_by,
                  updated_by_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;

              db.query(
                insertQuery,
                [
                  payment_main_details_id,
                  profitPercent,
                  profitAmount,
                  inflationPercent,
                  total_cost_expense,
                  nbtAmount,
                  total_course_cost,
                  no_of_participants,
                  course_fee_per_head,
                  roundedCourseFeePerHead,
                  roundedCourseTotal,
                  user.name || null,
                  user.id,
                  check_by || null,
                  user.id,
                ],
                (err, result) => {
                  if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ error: "Insert failed" });
                  }

                  // return res.status(201).json({
                  //   message: "Inserted successfully",
                  //   id: result.insertId,
                  // });

                  // Step 6: Insert into course_revenue_summary
                  const crsInsertQuery = `
                  INSERT INTO course_revenue_summary (
                    payments_main_details_id,
                    course_id,
                    batch_id,
                    no_of_participants,
                    paid_no_of_participants,
                    total_course_revenue,
                    revenue_received_total,
                    all_fees_collected_status
                  ) SELECT ?, course_id, batch_id, no_of_participants, 0, ?, 0.00, FALSE
                    FROM payments_main_details
                    WHERE id = ?
                `;

                  db.query(
                    crsInsertQuery,
                    [
                      payment_main_details_id,
                      roundedCourseTotal,
                      payment_main_details_id,
                    ],
                    (crsErr) => {
                      if (crsErr) {
                        console.error(
                          "Insert into course_revenue_summary failed:",
                          crsErr
                        );
                        return res.status(500).json({
                          error:
                            "Summary created but revenue record insert failed",
                          course_summary_id: result.insertId,
                        });
                      }

                      return res.status(201).json({
                        message: "Inserted successfully",
                        id: result.insertId,
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// GET endpoint
router.get("/:payment_main_details_id", (req, res) => {
  const { payment_main_details_id } = req.params;
  const user = req.user;
  const privileged = isPrivileged(user);

  const query = `
    SELECT pmd.user_id, ccs.*
    FROM course_cost_summary ccs
    JOIN payments_main_details pmd ON ccs.payment_main_details_id = pmd.id
    WHERE ccs.payment_main_details_id = ?
    ORDER BY ccs.created_at DESC
    LIMIT 1
  `;

  db.query(query, [payment_main_details_id], (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Not found" });

    const row = results[0];
    if (!privileged && row.user_id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(row);
  });
});

// PATCH endpoint
router.patch("/:id/refresh", (req, res) => {
  const { id } = req.params;
  const { payment_main_details_id, check_by } = req.body;
  const user = req.user;
  const privileged = isPrivileged(user);

  if (!payment_main_details_id || typeof payment_main_details_id !== "number") {
    return res.status(400).json({
      error: "payment_main_details_id is required and must be a number.",
    });
  }

  const getSummaryQuery = `
    SELECT ccs.payment_main_details_id, pmd.user_id, ccs.prepared_by, ccs.prepared_by_id
    FROM course_cost_summary ccs
    JOIN payments_main_details pmd ON ccs.payment_main_details_id = pmd.id
    WHERE ccs.id = ?
  `;

  db.query(getSummaryQuery, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (rows.length === 0)
      return res.status(404).json({ error: "Summary not found" });

    const { user_id: ownerId } = rows[0];
    const isOwner = user.id === ownerId;

    if (!isOwner && !privileged) {
      return res.status(403).json({
        error: "Forbidden: Only owner or privileged users can refresh.",
      });
    }

    const getCostsQuery = `
      SELECT
        (SELECT IFNULL(total_cost, 0) FROM course_development_work WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS dev_cost,
        (SELECT IFNULL(total_cost, 0) FROM course_delivery_costs WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS delivery_cost,
        (SELECT IFNULL(total_cost, 0) FROM course_overheads_main WHERE payments_main_details_id = ? ORDER BY created_at DESC LIMIT 1) AS overhead_cost,
        (SELECT no_of_participants FROM payments_main_details WHERE id = ?) AS participants
    `;

    db.query(
      getCostsQuery,
      [
        payment_main_details_id,
        payment_main_details_id,
        payment_main_details_id,
        payment_main_details_id,
      ],
      (err, results) => {
        if (err)
          return res.status(500).json({ error: "Cost data fetch failed" });

        const row = results[0];
        const devCost = parseFloat(row.dev_cost);
        const deliveryCost = parseFloat(row.delivery_cost);
        const overheadCost = parseFloat(row.overhead_cost);
        const total_cost_expense = devCost + deliveryCost + overheadCost;
        const no_of_participants = row.participants;

        if (total_cost_expense <= 0) {
          return res.status(400).json({
            error: "Total cost must be greater than zero.",
          });
        }

        if (!no_of_participants || no_of_participants <= 0) {
          return res.status(400).json({
            error: "Valid number of participants is required.",
          });
        }

        db.query(
          `
            SELECT item_description, rate
            FROM rates
            WHERE category = 'Course Cost Final Report'
            AND item_description IN ('Profit Margin Percentage', 'NBT', 'Provision For Inflation Percentage')
          `,
          (err, rates) => {
            if (err)
              return res.status(500).json({ error: "Rate fetch failed" });

            const rateMap = {};
            for (const rate of rates) {
              rateMap[rate.item_description] = parseFloat(rate.rate);
            }

            const requiredRates = [
              "Profit Margin Percentage",
              "Provision For Inflation Percentage",
              "NBT",
            ];
            const missingRates = requiredRates.filter((key) =>
              isNaN(rateMap[key])
            );
            if (missingRates.length > 0) {
              return res.status(400).json({
                error: `Missing or invalid rate(s): ${missingRates.join(", ")}`,
              });
            }

            const profitPercent = rateMap["Profit Margin Percentage"];
            const inflationPercent =
              rateMap["Provision For Inflation Percentage"];
            const nbtAmount = rateMap["NBT"];

            const inflationAmount =
              (inflationPercent / 100) * total_cost_expense;
            const profitAmount =
              (profitPercent / 100) *
              (total_cost_expense + inflationAmount + nbtAmount);
            const total_course_cost =
              total_cost_expense + inflationAmount + nbtAmount + profitAmount;
            const course_fee_per_head = total_course_cost / no_of_participants;

            // ✅ Rounded values
            const roundedCourseFeePerHead =
              Math.ceil(course_fee_per_head / 50) * 50;
            const roundedCourseTotal =
              roundedCourseFeePerHead * no_of_participants;

            const updateQuery = `
              UPDATE course_cost_summary SET
                profit_margin_percentage = ?,
                profit_margin = ?,
                provision_inflation_percentage = ?,
                total_cost_expense = ?,
                NBT = ?,
                total_course_cost = ?,
                no_of_participants = ?,
                course_fee_per_head = ?,
                Rounded_CFPH = ?,
                Rounded_CT = ?,
                check_by = ?,
                updated_by_id = ?
              WHERE id = ?
            `;

            db.query(
              updateQuery,
              [
                profitPercent,
                profitAmount,
                inflationPercent,
                total_cost_expense,
                nbtAmount,
                total_course_cost,
                no_of_participants,
                course_fee_per_head,
                roundedCourseFeePerHead,
                roundedCourseTotal,
                check_by || null,
                user.id,
                id,
              ],
              (err) => {
                if (err) {
                  console.error("Update error:", err);
                  return res.status(500).json({ error: "Update failed" });
                }
                // res.json({ message: "Summary refreshed successfully." });

                // Step 6: Update course_revenue_summary
                const updateCRSQuery = `
                  UPDATE course_revenue_summary crs
                  JOIN payments_main_details pmd ON crs.payments_main_details_id = pmd.id
                  SET
                    crs.course_id = pmd.course_id,
                    crs.batch_id = pmd.batch_id,
                    crs.no_of_participants = pmd.no_of_participants,
                    crs.total_course_revenue = ?
                  WHERE crs.payments_main_details_id = ?
                `;

                db.query(
                  updateCRSQuery,
                  [roundedCourseTotal, payment_main_details_id],
                  (crsErr) => {
                    if (crsErr) {
                      console.error(
                        "Update course_revenue_summary failed:",
                        crsErr
                      );
                      return res.status(500).json({
                        error: "Summary refreshed but revenue update failed",
                      });
                    }

                    res.json({
                      message: "Summary refreshed and revenue updated.",
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
});

//// DELETE endpoint
// router.delete("/:id", (req, res) => {
//   const { id } = req.params;

//   db.query(
//     `
//     SELECT pmd.user_id FROM course_cost_summary ccs
//     JOIN payments_main_details pmd ON ccs.payment_main_details_id = pmd.id
//     WHERE ccs.id = ?
//   `,
//     [id],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: "DB error" });
//       if (rows.length === 0)
//         return res.status(404).json({ error: "Not found" });

//       const isOwner = req.user.id === rows[0].user_id;
//       const privileged = isPrivileged(req.user);

//       if (!isOwner && !privileged) {
//         return res
//           .status(403)
//           .json({ error: "Forbidden: Not allowed to delete." });
//       }

//       db.query(`DELETE FROM course_cost_summary WHERE id = ?`, [id], (err2) => {
//         if (err2) return res.status(500).json({ error: "Delete failed" });
//         res.json({ message: "Deleted" });
//       });
//     }
//   );
// });

// DELETE endpoint
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    `
    SELECT ccs.payment_main_details_id, pmd.user_id 
    FROM course_cost_summary ccs
    JOIN payments_main_details pmd ON ccs.payment_main_details_id = pmd.id
    WHERE ccs.id = ?
  `,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Not found" });

      const { payment_main_details_id } = rows[0];
      const isOwner = req.user.id === rows[0].user_id;
      const privileged = isPrivileged(req.user);

      if (!isOwner && !privileged) {
        return res
          .status(403)
          .json({ error: "Forbidden: Not allowed to delete." });
      }

      // Step 1: Delete from course_cost_summary
      db.query(`DELETE FROM course_cost_summary WHERE id = ?`, [id], (err2) => {
        if (err2) return res.status(500).json({ error: "Delete failed" });

        // Step 2: Delete from course_revenue_summary
        db.query(
          `DELETE FROM course_revenue_summary WHERE payments_main_details_id = ?`,
          [payment_main_details_id],
          (err3) => {
            if (err3) {
              console.error("Revenue summary deletion failed:", err3);
              return res.status(500).json({
                error:
                  "Cost summary deleted, but revenue summary deletion failed.",
              });
            }

            res.json({ message: "Deleted both cost and revenue summary." });
          }
        );
      });
    }
  );
});

module.exports = router;
