const moment = require("moment");
const express = require("express");
const { query, validationResult } = require("express-validator");
const router = express.Router();
const db = require("../db");
const logger = require("../logger");
const auth = require("../auth");

// Delete rate by item description (query-based)
router.delete(
  "/by-item",
  auth.authMiddleware,
  [
    query("itemDescription")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Item description is required"),
    query("category")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Category is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemDescription, category } = req.query;
    const user_name = req.user.name;

    const sql = `DELETE FROM rates WHERE item_description = ? AND category = ?`;

    db.query(sql, [itemDescription, category], (err, result) => {
      if (err) {
        logger.error("Error deleting rate:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Rate not found" });
      }

      logger.info(
        `Rate deleted at ${moment().format(
          "YYYY-MM-DD HH:mm:ss"
        )} by ${user_name}`
      );
      return res.json({ success: true, message: "Rate deleted" });
    });
  }
);

// Get all rates
router.get("/", auth.authMiddleware, (req, res) => {
  db.query("SELECT * FROM rates", (err, results) => {
    if (err) {
      logger.error("Error fetching rates:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json(results);
  });
});

// Get rate by item description (query-based)
router.get(
  "/by-item",
  auth.authMiddleware,
  [
    query("itemDescription")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Item description is required"),
    query("category")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Category is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemDescription, category } = req.query;

    const sql = `SELECT * FROM rates WHERE item_description = ? AND category = ?`;
    db.query(sql, [itemDescription, category], (err, results) => {
      if (err) {
        logger.error("Error fetching rate:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Rate not found" });
      }

      return res.json(results[0]);
    });
  }
);

// Filter multiple item descriptions
router.post("/filter", auth.authMiddleware, (req, res) => {
  const itemDescriptions = req.body.items;

  if (!Array.isArray(itemDescriptions) || itemDescriptions.length === 0) {
    return res.status(400).json({ error: "'items' must be a non-empty array" });
  }

  const trimmedItems = itemDescriptions
    .map((desc) => desc.trim())
    .filter(Boolean);

  if (trimmedItems.length === 0) {
    return res
      .status(400)
      .json({ error: "All item descriptions are empty or invalid" });
  }

  const placeholders = trimmedItems.map(() => "?").join(", ");
  const sql = `
    SELECT item_description, rate, category
    FROM rates
    WHERE item_description IN (${placeholders})
  `;

  db.query(sql, trimmedItems, (err, results) => {
    if (err) {
      logger.error("Error fetching rates:", err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json({ success: true, data: results });
  });
});

// Insert rates
router.post("/", auth.authMiddleware, (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) {
    logger.warn("User ID missing in POST /rates request.");
    return res.status(401).json({ error: "Unauthorized: Missing user ID" });
  }

  const items = req.body.items;

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ error: "Request body must include a non-empty 'items' array" });
  }

  const values = [];
  for (const item of items) {
    const { item_description, category, rate, rate_type, cost_type } = item;

    if (!item_description || rate === undefined || !category) {
      return res.status(400).json({
        error: "Each item must have 'item_description', 'category', and 'rate'",
      });
    }

    values.push([
      item_description,
      category,
      rate,
      rate_type || "Quantity",
      cost_type || "C",
      user_id,
    ]);
  }

  const sql = `
    INSERT INTO rates 
    (item_description, category, rate, rate_type, cost_type, user_created_id)
    VALUES ?
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      logger.error("Error inserting rates:", err);
      return res.status(500).json({ error: "Database error" });
    }

    logger.info(
      `Rates inserted at ${moment().format(
        "YYYY-MM-DD HH:mm:ss"
      )} by user ID ${user_id}`
    );

    return res.json({
      success: true,
      message: `${result.affectedRows} rate(s) added`,
    });
  });
});

// Update rates
router.patch("/", auth.authMiddleware, (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) {
    logger.warn("User ID missing in PATCH /rates request.");
    return res.status(401).json({ error: "Unauthorized: Missing user ID" });
  }

  const updates = req.body.items;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "items must be a non-empty array" });
  }

  for (const item of updates) {
    if (!item.item_description || !item.category) {
      return res.status(400).json({
        error: "Each item must include 'item_description' and 'category'",
      });
    }

    if (
      item.rate === undefined &&
      item.rate_type === undefined &&
      item.cost_type === undefined
    ) {
      return res.status(400).json({
        error:
          "At least one of 'rate', 'rate_type', or 'cost_type' must be provided",
      });
    }
  }

  const promises = updates.map((item) => {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      if (item.rate !== undefined) {
        fields.push("rate = ?");
        values.push(item.rate);
      }
      if (item.rate_type !== undefined) {
        fields.push("rate_type = ?");
        values.push(item.rate_type);
      }
      if (item.cost_type !== undefined) {
        fields.push("cost_type = ?");
        values.push(item.cost_type);
      }

      fields.push("user_updated_id = ?");
      values.push(user_id);

      values.push(item.item_description);
      values.push(item.category);

      const sql = `
        UPDATE rates
        SET ${fields.join(", ")}
        WHERE item_description = ? AND category = ?
      `;

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve({ item: item.item_description, affected: result.affectedRows });
      });
    });
  });

  Promise.all(promises)
    .then((results) => {
      const updated = results.filter((r) => r.affected > 0).map((r) => r.item);
      const notFound = results
        .filter((r) => r.affected === 0)
        .map((r) => r.item);

      logger.info(
        `Rates updated at ${moment().format(
          "YYYY-MM-DD HH:mm:ss"
        )} by user ID ${user_id}`
      );

      return res.json({
        success: true,
        message: "Rates update complete",
        updated,
        notFound,
      });
    })
    .catch((err) => {
      logger.error("Error updating rates:", err);
      return res.status(500).json({ error: "Database error" });
    });
});

module.exports = router;
