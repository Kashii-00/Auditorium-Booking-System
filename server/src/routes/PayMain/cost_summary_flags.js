// ✅ BACKEND ROUTE FILE: routes/cost_summary_flags.js
const express = require("express");
const db = require("../../db");
const auth = require("../../auth");
const Joi = require("joi");

const router = express.Router();
router.use(auth.authMiddleware);

const createFlagSchema = Joi.object({
  payments_main_details_id: Joi.number().required(),
  summary_needs_refresh: Joi.boolean().optional().default(false),
  summary_up_to_date: Joi.boolean().optional().default(false),
  special_cp_up_to_date: Joi.boolean().optional().default(false),
});

const updateFlagSchema = Joi.object({
  summary_needs_refresh: Joi.boolean().optional(),
  summary_up_to_date: Joi.boolean().optional(),
  special_cp_up_to_date: Joi.boolean().optional(),
}).min(1);

// CREATE (POST)
router.post("/", (req, res) => {
  const { error, value } = createFlagSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // Destructure from Joi-validated input
  const {
    payments_main_details_id,
    summary_needs_refresh,
    summary_up_to_date,
    special_cp_up_to_date,
  } = value;

  db.query(
    "SELECT * FROM cost_summary_flags WHERE payments_main_details_id = ?",
    [payments_main_details_id],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: "Query error." });
      }

      if (existing.length > 0) {
        return res.status(409).json({ error: "Record already exists." });
      }

      db.query(
        `INSERT INTO cost_summary_flags 
         (payments_main_details_id, summary_needs_refresh, summary_up_to_date, special_cp_up_to_date)
         VALUES (?, ?, ?, ?)`,
        [
          payments_main_details_id,
          summary_needs_refresh,
          summary_up_to_date,
          special_cp_up_to_date,
        ],
        (err2) => {
          if (err2) {
            return res.status(500).json({ error: "Failed to insert." });
          }
          res.status(201).json({ message: "Cost summary flag created." });
        }
      );
    }
  );
});

// UPDATE (PATCH)
router.patch("/:id", (req, res) => {
  const { error, value } = updateFlagSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const {
    summary_needs_refresh = false,
    summary_up_to_date = false,
    special_cp_up_to_date = false,
  } = value;

  db.query(
    `UPDATE cost_summary_flags
     SET summary_needs_refresh = ?, summary_up_to_date = ?, special_cp_up_to_date = ?
     WHERE payments_main_details_id = ?`,
    [
      summary_needs_refresh,
      summary_up_to_date,
      special_cp_up_to_date,
      req.params.id,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to update flag." });
      }
      res.json({ message: "Flag updated." });
    }
  );
});

// READ (GET by ID)
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM cost_summary_flags WHERE payments_main_details_id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Failed to fetch flag." });
      if (rows.length === 0)
        return res.status(404).json({ error: "Not found." });
      res.json(rows[0]);
    }
  );
});

// DELETE (optional)
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM cost_summary_flags WHERE payments_main_details_id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to delete flag." });
      res.json({ message: "Flag deleted." });
    }
  );
});

module.exports = router;
