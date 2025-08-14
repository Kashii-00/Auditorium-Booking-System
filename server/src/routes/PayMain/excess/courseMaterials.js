const express = require("express");
const db = require("../../../db");
const auth = require("../../../auth");
const logger = require("../../../logger");
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
const CATEGORY = "Course Delivery (Materials)";

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

const schema = Joi.object({
  course_delivery_cost_id: Joi.number().integer().required(),
  item_description: Joi.string().required(),
  required_quantity: Joi.number().integer().min(1).optional(),
  rate: Joi.number().precision(2).min(0).optional(),
  cost: Joi.number().precision(2).min(0).optional(),
});

// POST /api/course-materials
router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = req.user;
  const { course_delivery_cost_id, item_description, required_quantity } =
    value;
  let { rate, cost } = value;

  // Step 1: Check FK exists and verify ownership
  db.query(
    `SELECT pmd.user_id
     FROM course_delivery_costs cdc
     JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
     WHERE cdc.id = ?`,
    [course_delivery_cost_id],
    (err, rows) => {
      if (err) {
        logger.error("Ownership lookup error:", err);
        return res.status(500).json({ error: "DB error" });
      }
      if (rows.length === 0) {
        return res
          .status(400)
          .json({ error: "Invalid course_delivery_cost_id." });
      }

      const ownerUserId = rows[0].user_id;
      if (user.id !== ownerUserId) {
        return res.status(403).json({
          error:
            "Forbidden: Only the owner of this course delivery cost can add materials.",
        });
      }

      // Step 2: Try to get rate entry
      db.query(
        `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
        [item_description, CATEGORY],
        (err2, rateRows) => {
          if (err2) {
            logger.error("Rates lookup error:", err2);
            return res.status(500).json({ error: "DB error" });
          }

          const rateEntry = rateRows[0] || null;
          const privileged = isPrivileged(user);

          if (rateEntry) {
            if (
              typeof cost === "number" &&
              typeof rate !== "number" &&
              typeof required_quantity !== "number"
            ) {
              // Accept cost-only
            } else if (rateEntry.rate_type === "Full Payment") {
              if (typeof cost !== "number") {
                return res.status(400).json({
                  error: "Cost must be provided for Full Payment items.",
                });
              }
              rate = parseFloat(
                privileged && typeof rate === "number" ? rate : rateEntry.rate
              );
            } else if (
              privileged &&
              typeof rate === "number" &&
              typeof required_quantity === "number"
            ) {
              cost = rate * required_quantity;
            } else if (rateEntry.rate_type === "Quantity") {
              if (typeof required_quantity !== "number") {
                return res
                  .status(400)
                  .json({ error: "Quantity is required for this item." });
              }
              rate = parseFloat(
                privileged && typeof rate === "number" ? rate : rateEntry.rate
              );
              cost = rate * required_quantity;
            }
          } else {
            if (typeof cost === "number") {
              // Accept cost-only
            } else if (privileged) {
              if (
                typeof rate === "number" &&
                typeof required_quantity === "number"
              ) {
                cost = rate * required_quantity;
              } else {
                return res.status(400).json({
                  error:
                    "Privileged users must provide either cost or rate + quantity.",
                });
              }
            } else {
              return res.status(403).json({
                error:
                  "Item not found in rates. Non-privileged users can only provide cost.",
              });
            }
          }

          if (typeof cost !== "number") {
            return res.status(400).json({ error: "Cost is required." });
          }

          db.query(
            `INSERT INTO course_materials_costing 
              (course_delivery_cost_id, item_description, required_quantity, rate, cost)
              VALUES (?, ?, ?, ?, ?)`,
            [
              course_delivery_cost_id,
              item_description,
              required_quantity || 0,
              rate || 0,
              cost,
            ],
            (err3) => {
              if (err3) {
                logger.error("Insert error:", err3);
                return res
                  .status(500)
                  .json({ error: "Failed to insert material" });
              }
              logger.info(`Material created by user ${user.id}`);
              res.status(201).json({ message: "Material created." });
            }
          );
        }
      );
    }
  );
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const patchSchema = Joi.object({
    rate: Joi.number().precision(2).min(0).optional(),
    required_quantity: Joi.number().integer().min(1).optional(),
    cost: Joi.number().precision(2).min(0).optional(),
  }).or("rate", "required_quantity", "cost");

  const { error, value } = patchSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  db.query(
    `SELECT cmc.*, cdc.payments_main_details_id, pmd.user_id
     FROM course_materials_costing cmc
     JOIN course_delivery_costs cdc ON cmc.course_delivery_cost_id = cdc.id
     JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
     WHERE cmc.id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        logger.error("DB error:", err);
        return res.status(500).json({ error: "DB error" });
      }
      if (rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const existing = rows[0];
      if (user.id !== existing.user_id) {
        return res.status(403).json({
          error: "Forbidden: Only the owner can update this material.",
        });
      }

      const privileged = isPrivileged(user);
      const { item_description } = existing;

      const { rate = null, required_quantity = null, cost = null } = value;

      db.query(
        `SELECT * FROM rates WHERE item_description = ? AND category = ?`,
        [item_description, CATEGORY],
        (err2, rateRows) => {
          if (err2) {
            logger.error("Rates lookup error:", err2);
            return res.status(500).json({ error: "DB error" });
          }

          let finalRate = existing.rate;
          let finalQty = existing.required_quantity;
          let finalCost = existing.cost;

          if (rateRows.length > 0) {
            const rateEntry = rateRows[0];

            if (rateEntry.rate_type === "Full Payment") {
              if (typeof cost !== "number") {
                return res.status(400).json({
                  error: "Cost must be provided for Full Payment items.",
                });
              }
              finalCost = cost;
              finalRate = privileged && rate ? rate : rateEntry.rate;
              finalQty = 0;
            } else if (rateEntry.rate_type === "Quantity") {
              if (required_quantity == null) {
                return res.status(400).json({
                  error: "Quantity is required for this item.",
                });
              }

              finalQty = required_quantity;
              if (privileged && rate) {
                finalRate = rate;
              } else {
                finalRate = rateEntry.rate;
              }
              finalCost = finalRate * finalQty;
            } else {
              return res.status(400).json({
                error: "Unsupported rate type in database.",
              });
            }
          } else {
            // No rate entry in rates table → Both privileged and non-privileged allowed
            if (rate == null || required_quantity == null) {
              return res.status(400).json({
                error:
                  "Rate and quantity are required for items not in rates table.",
              });
            }
            finalRate = rate;
            finalQty = required_quantity;
            finalCost = finalRate * finalQty; // Always calculate cost
          }

          db.query(
            `UPDATE course_materials_costing
             SET rate = ?, required_quantity = ?, cost = ?
             WHERE id = ?`,
            [finalRate, finalQty, finalCost, id],
            (err3) => {
              if (err3) {
                logger.error("Update error:", err3);
                return res
                  .status(500)
                  .json({ error: "Failed to update material" });
              }
              logger.info(`Material ${id} updated by user ${user.id}`);
              res.json({ message: "Material updated successfully." });
            }
          );
        }
      );
    }
  );
});

// GET /api/course-materials
router.get("/", (req, res) => {
  const user = req.user;
  const privileged = isPrivileged(user);

  let query = `
    SELECT cm.*
    FROM course_materials_costing cm
    JOIN course_delivery_costs cdc ON cm.course_delivery_cost_id = cdc.id
    JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
  `;
  const params = [];

  if (!privileged) {
    query += ` WHERE pmd.user_id = ?`;
    params.push(user.id);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      logger.error("GET /course-materials error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// DELETE /api/course-materials/:id
router.delete("/:id", (req, res) => {
  const materialId = req.params.id;

  db.query(
    `SELECT course_delivery_cost_id FROM course_materials_costing WHERE id = ?`,
    [materialId],
    (err, materialRows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      const material = materialRows[0];
      if (!material)
        return res.status(404).json({ error: "Material not found." });

      db.query(
        `SELECT pmd.user_id
         FROM course_delivery_costs cdc
         JOIN payments_main_details pmd ON cdc.payments_main_details_id = pmd.id
         WHERE cdc.id = ?`,
        [material.course_delivery_cost_id],
        (err2, detailsRows) => {
          if (err2) return res.status(500).json({ error: "DB error" });
          const details = detailsRows[0];
          if (!details) {
            return res
              .status(400)
              .json({ error: "Invalid course_delivery_cost_id." });
          }

          const isOwner = req.user.id === details.user_id;
          const isPrivilegedUser = isPrivileged(req.user);

          if (!isOwner && !isPrivilegedUser) {
            return res
              .status(403)
              .json({ error: "Forbidden: Not authorized to delete." });
          }

          db.query(
            `DELETE FROM course_materials_costing WHERE id = ?`,
            [materialId],
            (err3) => {
              if (err3) {
                logger.error("Delete error:", err3);
                return res
                  .status(500)
                  .json({ error: "Failed to delete material." });
              }

              logger.info(
                `Material ${materialId} deleted by user ${req.user.id}`
              );
              res.json({ message: "Material deleted." });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
