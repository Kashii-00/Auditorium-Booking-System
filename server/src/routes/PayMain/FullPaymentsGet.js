const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const router = express.Router();

// ✅ Middleware
router.use(auth.authMiddleware);
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
    handler: (req, res) => {
      res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
    },
  })
);

// ✅ Role Utils
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

// ✅ GET full cost details
router.get("/:paymentMainDetailsId", (req, res) => {
  const { paymentMainDetailsId } = req.params;
  const user = req.user;
  const privileged = isPrivileged(user);

  const result = {
    payments_main_details: null,
    course_cost_summary: null,
    course_development_work: null,
    course_delivery_costs: null,
    course_overheads_main: null,
  };

  // ✅ Ownership or privileged access check
  db.query(
    `SELECT * FROM payments_main_details WHERE id = ?`,
    [paymentMainDetailsId],
    (err, rows) => {
      if (err)
        return res.status(500).json({ error: "DB error (Main Details)" });
      if (rows.length === 0)
        return res
          .status(404)
          .json({ error: "Invalid payments_main_details_id" });

      const paymentMain = rows[0];

      if (!privileged && paymentMain.user_id !== user.id) {
        return res
          .status(403)
          .json({ error: "Forbidden: Not authorized to access this data." });
      }

      result.payments_main_details = paymentMain;

      // ✅ Step 2: Cost Summary
      db.query(
        `SELECT * FROM course_cost_summary
         WHERE payment_main_details_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [paymentMainDetailsId],
        (err2, summaryRows) => {
          if (err2)
            return res.status(500).json({ error: "DB error (Cost Summary)" });

          result.course_cost_summary = summaryRows[0] || null;
          fetchDevelopmentWork();
        }
      );
    }
  );

  // ✅ Development Work
  function fetchDevelopmentWork() {
    db.query(
      `SELECT * FROM course_development_work
       WHERE payments_main_details_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [paymentMainDetailsId],
      (err1, cdwRows) => {
        if (err1) return res.status(500).json({ error: "DB error (CDW)" });

        const cdw = cdwRows[0];
        result.course_development_work = {
          main: cdw,
          panel_meeting_participants: [],
          development_work_expenses: [],
        };

        if (cdw) {
          db.query(
            `SELECT * FROM panel_meeting_participants WHERE course_development_work_id = ?`,
            [cdw.id],
            (err2a, pmpRows) => {
              if (err2a)
                return res.status(500).json({ error: "DB error (PMP)" });

              result.course_development_work.panel_meeting_participants =
                pmpRows;

              db.query(
                `SELECT * FROM course_development_work_expenses WHERE course_development_work_id = ?`,
                [cdw.id],
                (err2b, expRows) => {
                  if (err2b)
                    return res
                      .status(500)
                      .json({ error: "DB error (CDW Expenses)" });

                  result.course_development_work.development_work_expenses =
                    expRows;

                  fetchDeliveryCost();
                }
              );
            }
          );
        } else {
          fetchDeliveryCost();
        }
      }
    );
  }

  // ✅ Delivery Cost
  function fetchDeliveryCost() {
    db.query(
      `SELECT * FROM course_delivery_costs
       WHERE payments_main_details_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [paymentMainDetailsId],
      (err3, delRows) => {
        if (err3)
          return res.status(500).json({ error: "DB error (Delivery Costs)" });

        const delivery = delRows[0];
        result.course_delivery_costs = {
          main: delivery,
          cost_items: [],
          materials: [],
        };

        if (delivery) {
          db.query(
            `SELECT * FROM course_delivery_cost_items WHERE course_delivery_cost_id = ?`,
            [delivery.id],
            (err4a, itemsRows) => {
              if (err4a)
                return res
                  .status(500)
                  .json({ error: "DB error (Delivery Items)" });

              result.course_delivery_costs.cost_items = itemsRows;

              db.query(
                `SELECT * FROM course_materials_costing WHERE course_delivery_cost_id = ?`,
                [delivery.id],
                (err4b, matRows) => {
                  if (err4b)
                    return res
                      .status(500)
                      .json({ error: "DB error (Materials)" });

                  result.course_delivery_costs.materials = matRows;
                  fetchOverheads();
                }
              );
            }
          );
        } else {
          fetchOverheads();
        }
      }
    );
  }

  // ✅ Overheads
  function fetchOverheads() {
    db.query(
      `SELECT * FROM course_overheads_main
     WHERE payments_main_details_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
      [paymentMainDetailsId],
      (err5, ovhRows) => {
        if (err5)
          return res.status(500).json({ error: "DB error (Overheads Main)" });

        const overhead = ovhRows[0];
        result.course_overheads_main = {
          main: overhead,
          teaching_aids: [],
          training_environments: [],
          overheads: [],
        };

        if (overhead) {
          db.query(
            `SELECT * FROM training_teaching_aids WHERE course_overheads_main_id = ?`,
            [overhead.id],
            (err6a, aidsRows) => {
              if (err6a)
                return res
                  .status(500)
                  .json({ error: "DB error (Teaching Aids)" });

              result.course_overheads_main.teaching_aids = aidsRows;

              db.query(
                `SELECT * FROM training_environments WHERE course_overheads_main_id = ?`,
                [overhead.id],
                (err6b, envRows) => {
                  if (err6b)
                    return res
                      .status(500)
                      .json({ error: "DB error (Environments)" });

                  result.course_overheads_main.training_environments = envRows;

                  db.query(
                    `SELECT * FROM overheads WHERE course_overheads_main_id = ?`,
                    [overhead.id],
                    (err6c, ovhItems) => {
                      if (err6c)
                        return res
                          .status(500)
                          .json({ error: "DB error (Overheads)" });

                      result.course_overheads_main.overheads = ovhItems;

                      // ✅ Now fetch special case payments
                      db.query(
                        `SELECT * FROM special_case_payments WHERE payments_main_details_id = ?`,
                        [paymentMainDetailsId],
                        (err6d, specialRows) => {
                          if (err6d) {
                            return res.status(500).json({
                              error: "DB error (Special Case Payments)",
                            });
                          }

                          result.special_case_payments = specialRows;

                          // ✅ Final response after all queries
                          res.json(result);
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        } else {
          // No overhead found, but still fetch special case payments
          db.query(
            `SELECT * FROM special_case_payments WHERE payments_main_details_id = ?`,
            [paymentMainDetailsId],
            (err6d, specialRows) => {
              if (err6d) {
                return res
                  .status(500)
                  .json({ error: "DB error (Special Case Payments)" });
              }

              result.special_case_payments = specialRows;

              // Send response even if overhead missing
              res.json(result);
            }
          );
        }
      }
    );
  }
});

module.exports = router;
