const express = require("express");
const moment = require("moment");
const Joi = require("joi");
const db = require("../../db");
const logger = require("../../logger");
const auth = require("../../auth");
const { standardLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

// Express RateLimiter Middleware
// Using standardLimiter for IPv6-compatible rate limiting


// Apply authentication first, then rate limiting to all routes in this router
router.use(auth.authMiddleware);
router.use(standardLimiter);

// Roles with special privileges (can update/delete any record)
const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager"];

// RBAC: Allowed fields by role
const FIELD_PERMISSIONS = {
  SuperAdmin: ["*"],
  finance_manager: ["CTM_approved", "CTM_details"],
  user: ["special_justifications", "no_of_participants", "duration"],
};

// Normalize roles helper: handles different role formats
function normalizeRoles(rawRole) {
  if (!rawRole) return [];

  if (Array.isArray(rawRole)) {
    if (
      rawRole.length === 1 &&
      typeof rawRole[0] === "string" &&
      rawRole[0].startsWith("[") &&
      rawRole[0].endsWith("]")
    ) {
      try {
        return JSON.parse(rawRole[0]);
      } catch {
        return rawRole;
      }
    }
    return rawRole;
  }

  if (typeof rawRole === "string") {
    if (rawRole.startsWith("[") && rawRole.endsWith("]")) {
      try {
        return JSON.parse(rawRole);
      } catch {
        return [rawRole];
      }
    }
    return [rawRole];
  }

  return [];
}

function getAllowedFieldsForRole(roles) {
  if (!roles) return [];
  if (!Array.isArray(roles)) roles = [roles];

  // If any role has full access, return all fields immediately
  if (roles.some((role) => FIELD_PERMISSIONS[role]?.includes("*"))) {
    return [
      "CTM_approved",
      "CTM_details",
      "special_justifications",
      "no_of_participants",
      "duration",
    ];
  }

  // Combine permissions of all roles (union)
  const allowedFieldsSet = new Set();
  roles.forEach((role) => {
    const perms = FIELD_PERMISSIONS[role];
    if (perms) {
      perms.forEach((f) => allowedFieldsSet.add(f));
    }
  });

  return Array.from(allowedFieldsSet);
}

// Joi validation schemas
const paymentSchema = Joi.object({
  course_id: Joi.number().required(),
  batch_id: Joi.number().required(),
  course_name: Joi.string().required(),
  no_of_participants: Joi.number().optional(),
  duration: Joi.string().optional(),
  customer_type: Joi.string().optional(),
  stream: Joi.string().optional(),
  CTM_approved: Joi.string().optional(),
  CTM_details: Joi.string().optional(),
  special_justifications: Joi.string().optional(),
  date: Joi.date().iso().optional(),
});

const patchSchema = Joi.object({
  CTM_approved: Joi.string().optional(),
  CTM_details: Joi.string().optional(),
  special_justifications: Joi.string().optional(),
  no_of_participants: Joi.number().optional(),
  duration: Joi.string().optional(),
}).min(1); // At least one field must be present

// Ownership or privileged role check
function checkOwnershipOrRole(user, record) {
  if (!user) return false;
  if (user.id === record.user_id) return true;

  const roles = normalizeRoles(user.role);
  return roles.some((r) => PRIVILEGED_ROLES.includes(r));
}

function sanitizePaymentOutput(payment, roles, currentUserId) {
  if (!Array.isArray(roles)) roles = [roles];

  const isPrivileged =
    roles.includes("SuperAdmin") || roles.includes("finance_manager");
  const isOwner = payment.user_id === currentUserId;

  if (isPrivileged || isOwner) {
    // Full access for privileged users and record owner
    return payment;
  }

  // Regular users (not owners) get limited fields
  const {
    id,
    course_name,
    duration,
    customer_type,
    stream,
    date,
    no_of_participants,
    special_justifications,
  } = payment;

  return {
    id,
    course_name,
    duration,
    customer_type,
    stream,
    date,
    no_of_participants,
    special_justifications,
  };
}

// --- Routes ---

// POST /api/payments
router.post("/", (req, res) => {
  const { error } = paymentSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });

  const user_id = req.user.id;
  const body = { ...req.body };
  body.date = body.date || moment().format("YYYY-MM-DD");

  const fields = [
    "user_id",
    "course_id",
    "batch_id",
    "course_name",
    "no_of_participants",
    "duration",
    "customer_type",
    "stream",
    "CTM_approved",
    "CTM_details",
    "special_justifications",
    "date",
  ];
  const placeholders = fields.map(() => "?").join(", ");
  const values = fields.map((f) =>
    f === "user_id" ? user_id : body[f] || null
  );

  const sql = `INSERT INTO payments_main_details (${fields.join(
    ", "
  )}) VALUES (${placeholders})`;

  db.query(sql, values, (err, result) => {
    if (err) {
      logger.error("Error creating payment record:", err);
      return res.status(500).json({ error: "Database error" });
    }

    logger.info(`New payment record inserted by user ${user_id}`);
    res.status(201).json({ success: true, id: result.insertId });
  });
});

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM payments_main_details ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        logger.error("Error fetching payments:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const roles = normalizeRoles(req.user.role);
      const isPrivileged =
        roles.includes("SuperAdmin") || roles.includes("finance_manager");

      // Filter: only own records if not privileged
      const filteredResults = isPrivileged
        ? results
        : results.filter((p) => p.user_id === req.user.id);

      // Sanitize output
      const sanitizedResults = filteredResults.map((p) =>
        sanitizePaymentOutput(p, roles, req.user.id)
      );

      res.json(sanitizedResults);
    }
  );
});

// PATCH /api/payments/:id
router.patch("/:id", (req, res) => {
  const { error } = patchSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });

  const roles = normalizeRoles(req.user.role);
  const allowed = getAllowedFieldsForRole(roles);
  const updates = [];
  const values = [];

  for (const key in req.body) {
    if (allowed.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (updates.length === 0)
    return res.status(400).json({ error: "No allowed fields to update" });

  const { id } = req.params;

  db.query(
    "SELECT user_id FROM payments_main_details WHERE id = ?",
    [id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Record not found" });

      const record = results[0];
      if (!checkOwnershipOrRole({ ...req.user, role: roles }, record))
        return res.status(403).json({ error: "Forbidden" });

      values.push(id);
      const sql = `UPDATE payments_main_details SET ${updates.join(
        ", "
      )} WHERE id = ?`;

      db.query(sql, values, (err) => {
        if (err) {
          logger.error("Error updating payment record:", err);
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true });
      });
    }
  );
});

// DELETE /api/payments/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const roles = normalizeRoles(req.user.role);

  db.query(
    "SELECT user_id FROM payments_main_details WHERE id = ?",
    [id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Not found" });

      if (!checkOwnershipOrRole({ ...req.user, role: roles }, results[0]))
        return res.status(403).json({ error: "Forbidden" });

      db.query(
        "DELETE FROM payments_main_details WHERE id = ?",
        [id],
        (err) => {
          if (err) {
            logger.error("Error deleting payment record:", err);
            return res.status(500).json({ error: "Database error" });
          }

          logger.info(
            `Payment record ${id} deleted by user ${
              req.user.name || req.user.id
            }`
          );
          res.json({ success: true });
        }
      );
    }
  );
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT * FROM payments_main_details WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0)
        return res.status(404).json({ error: "Not found" });

      const roles = normalizeRoles(req.user.role);
      const isPrivileged =
        roles.includes("SuperAdmin") || roles.includes("finance_manager");
      const payment = results[0];

      if (!isPrivileged && payment.user_id !== req.user.id)
        return res.status(403).json({ error: "Forbidden" });

      res.json(sanitizePaymentOutput(payment, roles, req.user.id));
    }
  );
});

module.exports = router;
