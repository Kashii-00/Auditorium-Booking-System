const express = require("express");
const moment = require("moment");
const Joi = require("joi");
const db = require("../../db");
const logger = require("../../logger");
const auth = require("../../auth");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const router = express.Router();

// Express RateLimiter Middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max requests per user per window
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req), // rate limit per user ID or IP
  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests. Please slow down." });
  },
});

// Apply authentication first, then rate limiting to all routes in this router
router.use(auth.authMiddleware);
router.use(limiter);

// Roles with special privileges (can update/delete any record)
const PRIVILEGED_ROLES = [
  "SuperAdmin",
  "finance_manager",
  "CTM",
  "DCTM01",
  "DCTM02",
  "sectional_head",
];

// Roles that can delete any record (besides owner)
const DELETE_ALLOWED_ROLES = ["SuperAdmin", "finance_manager"];

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

// RBAC: Allowed fields by role
const FIELD_PERMISSIONS = {
  SuperAdmin: ["*"],
  finance_manager: [
    "accountant_approval_obtained",
    "accountant_details",
    "course_id",
    "course_name",
    "customer_type",
    "stream",
    "date",
    "special_justifications",
    "no_of_participants",
    "duration",
  ],
  user: ["course_id", "course_name", "special_justifications", "no_of_participants", "duration"],
  CTM: [
    "CTM_approved",
    "CTM_details",
    "course_id",
    "course_name",
    "customer_type",
    "stream",
    "date",
    "special_justifications",
    "no_of_participants",
    "duration",
  ],
  DCTM01: [
    "DCTM01_approval_obtained",
    "DCTM01_details",
    "course_id",
    "course_name",
    "customer_type",
    "stream",
    "date",
    "special_justifications",
    "no_of_participants",
    "duration",
  ],
  DCTM02: [
    "DCTM02_approval_obtained",
    "DCTM02_details",
    "course_id",
    "course_name",
    "customer_type",
    "stream",
    "date",
    "special_justifications",
    "no_of_participants",
    "duration",
  ],
  sectional_head: [
    "sectional_approval_obtained",
    "section_type",
    "sectional_details",
    "course_id",
    "course_name",
    "customer_type",
    "stream",
    "date",
    "special_justifications",
    "no_of_participants",
    "duration",
  ],
};

function getAllowedFieldsForRole(roles, isOwner = false) {
  if (!roles) roles = [];
  if (!Array.isArray(roles)) roles = [roles];

  // If any role has full access
  if (roles.some((role) => FIELD_PERMISSIONS[role]?.includes("*"))) {
    return [
      "course_id",
      "course_name",
      "customer_type",
      "stream",
      "date",
      "no_of_participants",
      "duration",
      "special_justifications",
      "accountant_approval_obtained",
      "accountant_details",
      "sectional_approval_obtained",
      "section_type",
      "sectional_details",
      "DCTM01_approval_obtained",
      "DCTM01_details",
      "DCTM02_approval_obtained",
      "DCTM02_details",
      "CTM_approved",
      "CTM_details",
    ];
  }

  const allowedFieldsSet = new Set();

  roles.forEach((role) => {
    const perms = FIELD_PERMISSIONS[role];
    if (perms) {
      perms.forEach((f) => allowedFieldsSet.add(f));
    }
  });

  // ✅ Allow basic fields if the user is the owner
  if (isOwner) {
    allowedFieldsSet.add("course_id");
    allowedFieldsSet.add("course_name");
    allowedFieldsSet.add("customer_type");
    allowedFieldsSet.add("stream");
    allowedFieldsSet.add("date");
    allowedFieldsSet.add("special_justifications");
    allowedFieldsSet.add("no_of_participants");
    allowedFieldsSet.add("duration");
  }

  return Array.from(allowedFieldsSet);
}

// Joi validation schemas
const paymentSchema = Joi.object({
  course_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().allow("", null),
    Joi.valid(null)
  ).optional(),
  // batch_id: Joi.number().required(),
  course_name: Joi.string().required(),
  no_of_participants: Joi.number().optional(),
  duration: Joi.string().optional(),
  customer_type: Joi.string().optional(),
  stream: Joi.string().optional(),
  CTM_approved: Joi.string().optional().allow(null, ""),
  CTM_details: Joi.string().optional().allow(null, ""),
  special_justifications: Joi.string().optional().allow(null, ""),
  accountant_approval_obtained: Joi.string().optional().allow(null, ""),
  accountant_details: Joi.string().optional().allow(null, ""),
  sectional_approval_obtained: Joi.string().optional().allow(null, ""),
  section_type: Joi.string().optional().allow(null, ""),
  sectional_details: Joi.string().optional().allow(null, ""),
  DCTM01_approval_obtained: Joi.string().optional().allow(null, ""),
  DCTM01_details: Joi.string().optional().allow(null, ""),
  DCTM02_approval_obtained: Joi.string().optional().allow(null, ""),
  DCTM02_details: Joi.string().optional().allow(null, ""),
  date: Joi.date().iso().optional(),
});

const patchSchema = Joi.object({
  course_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().allow("", null),
    Joi.valid(null)
  ).optional(),
  course_name: Joi.string().optional(),
  customer_type: Joi.string().optional(),
  stream: Joi.string().optional(),
  date: Joi.date().iso().optional(),

  special_justifications: Joi.string().optional().allow(null, ""),
  no_of_participants: Joi.number().optional(),
  duration: Joi.string().optional(),

  accountant_approval_obtained: Joi.string().optional().allow(null, ""),
  accountant_details: Joi.string().optional().allow(null, ""),
  sectional_approval_obtained: Joi.string().optional().allow(null, ""),
  section_type: Joi.string().optional().allow(null, ""),
  sectional_details: Joi.string().optional().allow(null, ""),
  DCTM01_approval_obtained: Joi.string().optional().allow(null, ""),
  DCTM01_details: Joi.string().optional().allow(null, ""),
  DCTM02_approval_obtained: Joi.string().optional().allow(null, ""),
  DCTM02_details: Joi.string().optional().allow(null, ""),
  CTM_approved: Joi.string().optional().allow(null, ""),
  CTM_details: Joi.string().optional().allow(null, ""),
}).min(1); // At least one field must be present

// Ownership or privileged role check
function checkOwnershipOrRole(user, record) {
  if (!user) return false;
  if (user.id === record.user_id) return true;

  const roles = normalizeRoles(user.role);
  return roles.some((r) => PRIVILEGED_ROLES.includes(r));
}

function canDeleteRecord(user, record) {
  if (!user) return false;
  if (user.id === record.user_id) return true;

  const roles = normalizeRoles(user.role);
  return roles.some((r) => DELETE_ALLOWED_ROLES.includes(r));
}

function sanitizePaymentOutput(payment, roles, currentUserId) {
  const normalizedRoles = normalizeRoles(roles);

  const PRIVILEGED_ROLES = [
    "SuperAdmin",
    "finance_manager",
    "CTM",
    "DCTM01",
    "DCTM02",
    "sectional_head",
  ];

  const isPrivileged = normalizedRoles.some((r) =>
    PRIVILEGED_ROLES.includes(r)
  );
  const isOwner = payment.user_id === currentUserId;

  if (isPrivileged || isOwner) {
    return payment; // full access
  }

  // Return only limited fields for other users
  return {
    id: payment.id,
    course_id: payment.course_id,
    course_name: payment.course_name,
    duration: payment.duration,
    customer_type: payment.customer_type,
    stream: payment.stream,
    date: payment.date,
    no_of_participants: payment.no_of_participants,
    special_justifications: payment.special_justifications,
  };
}

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
    "course_name",
    "no_of_participants",
    "duration",
    "customer_type",
    "stream",
    "CTM_approved",
    "CTM_details",
    "special_justifications",
    "accountant_approval_obtained",
    "accountant_details",
    "sectional_approval_obtained",
    "section_type",
    "sectional_details",
    "DCTM01_approval_obtained",
    "DCTM01_details",
    "DCTM02_approval_obtained",
    "DCTM02_details",
    "date",
    "updated_by_id",
  ];

  const pendingFields = [
    "CTM_approved",
    "accountant_approval_obtained",
    "sectional_approval_obtained",
    "DCTM01_approval_obtained",
    "DCTM02_approval_obtained",
  ];

  const nullableFields = [
    "CTM_details",
    "special_justifications",
    "accountant_details",
    "section_type",
    "sectional_details",
    "DCTM01_details",
    "DCTM02_details",
  ];

  const placeholders = fields.map(() => "?").join(", ");
  const values = fields.map((f) => {
    if (f === "user_id" || f === "updated_by_id") return user_id;

    if (pendingFields.includes(f)) {
      return body[f] && body[f].trim() !== "" ? body[f] : "Pending";
    }

    if (nullableFields.includes(f)) {
      return body[f] && body[f].trim() !== "" ? body[f] : null;
    }

    // Handle course_id specifically for manual entry
    if (f === "course_id") {
      if (body[f] === "" || body[f] === null || body[f] === undefined) {
        return null; // Allow null for manual entry
      }
      return body[f];
    }

    return body[f] || null;
  });

  const sql = `INSERT INTO payments_main_details (${fields.join(
    ", "
  )}) VALUES (${placeholders})`;

  db.query(sql, values, (err, result) => {
    if (err) {
      logger.error("Error creating payment record:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const insertedId = result.insertId;

    // ✅ INSERT into cost_summary_flags with defaults
    const flagSql = `
      INSERT INTO cost_summary_flags (payments_main_details_id)
      VALUES (?)
    `;

    db.query(flagSql, [insertedId], (flagErr) => {
      if (flagErr) {
        logger.error("Error creating cost summary flags record:", flagErr);
        return res
          .status(500)
          .json({ error: "Failed to create cost summary flags record." });
      }

      logger.info(`New payment record inserted by user ${user_id}`);
      res.status(201).json({ success: true, id: insertedId });
    });
  });
});

// Approval chain logic based on role hierarchy
function isApprovedForRole(record, role) {
  switch (role) {
    case "CTM":
      return (
        record.DCTM01_approval_obtained === "Approved" &&
        record.DCTM02_approval_obtained === "Approved" &&
        record.sectional_approval_obtained === "Approved" &&
        record.accountant_approval_obtained === "Approved"
      );
    case "DCTM01":
    case "DCTM02":
      return (
        record.sectional_approval_obtained === "Approved" &&
        record.accountant_approval_obtained === "Approved"
      );
    case "sectional_head":
      return record.accountant_approval_obtained === "Approved";
    case "finance_manager":
    case "SuperAdmin":
      return true;
    default:
      return false;
  }
}

// GET /api/payments
router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM payments_main_details ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        logger.error("Error fetching payments:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const roles = normalizeRoles(req.user.role);
      const userId = req.user.id;

      // Use a Map to avoid duplicate entries by record ID
      const visibleMap = new Map();

      const addRecord = (record) => {
        visibleMap.set(record.id, record);
      };

      // Add records based on all user roles
      roles.forEach((role) => {
        results.forEach((r) => {
          if (isApprovedForRole(r, role)) {
            addRecord(r);
          }
        });
      });

      // All users can see their own records regardless of approval state
      results.forEach((r) => {
        if (r.user_id === userId) {
          addRecord(r);
        }
      });

      // Final deduplicated array
      const filteredResults = Array.from(visibleMap.values());

      // Sanitize output based on user roles
      const sanitizedResults = filteredResults.map((r) =>
        sanitizePaymentOutput(r, roles, userId)
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

  const { id } = req.params;

  db.query(
    "SELECT * FROM payments_main_details WHERE id = ?",
    [id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Record not found" });

      const record = results[0];
      const isOwner = record.user_id === req.user.id;
      const roles = normalizeRoles(req.user.role); // assumes lowercased role names
      const allowed = getAllowedFieldsForRole(roles, isOwner);

      // 1. Define dependencies for each role
      const roleApprovalDependencies = {
        CTM: [
          "DCTM01_approval_obtained",
          "DCTM02_approval_obtained",
          "sectional_approval_obtained",
          "accountant_approval_obtained",
        ],
        DCTM01: ["sectional_approval_obtained", "accountant_approval_obtained"],
        DCTM02: ["sectional_approval_obtained", "accountant_approval_obtained"],
        sectional_head: ["accountant_approval_obtained"],
      };

      // 2. Define which fields are unique to each role
      const roleRestrictedFields = {
        CTM: ["CTM_approved", "CTM_details"],
        DCTM01: ["DCTM01_approval_obtained", "DCTM01_details"],
        DCTM02: ["DCTM02_approval_obtained", "DCTM02_details"],
        sectional_head: [
          "sectional_approval_obtained",
          "sectional_details",
          "section_type",
        ],
        finance_manager: ["accountant_approval_obtained", "accountant_details"],
      };

      // 3. Before continuing, check for dependency violations
      for (const role of roles) {
        const restrictedFields = roleRestrictedFields[role] || [];
        const dependencyFields = roleApprovalDependencies[role] || [];

        const isTryingToEditRestrictedField = restrictedFields.some(
          (field) => field in req.body
        );

        if (isTryingToEditRestrictedField) {
          const unmet = dependencyFields.filter(
            (field) => record[field] !== "Approved"
          );

          if (unmet.length > 0) {
            return res.status(403).json({
              error: `To edit ${role.toUpperCase()}-specific fields, the following approvals must first be obtained: ${unmet.join(
                ", "
              )}`,
            });
          }
        }
      }

      // 4. Trigger & update logic continues
      const pendingFields = [
        "CTM_approved",
        "accountant_approval_obtained",
        "sectional_approval_obtained",
        "DCTM01_approval_obtained",
        "DCTM02_approval_obtained",
      ];

      const nullableFields = [
        "CTM_details",
        "accountant_details",
        "section_type",
        "sectional_details",
        "DCTM01_details",
        "DCTM02_details",
      ];

      const triggerFields = [
        "course_name",
        "no_of_participants",
        "duration",
        "customer_type",
        "stream",
        "date",
      ];

      const updates = [];
      const values = [];

      let noOfParticipantsChanged = false;
      let triggerFieldChanged = false;

      for (const key in req.body) {
        if (allowed.includes(key)) {
          let value = req.body[key];

          // Auto-format date if provided
          if (key === "date" && value) {
            value = moment(value).format("YYYY-MM-DD");
          }

          // Handle course_id specifically for manual entry
          if (key === "course_id") {
            if (value === "" || value === null || value === undefined) {
              value = null; // Allow null for manual entry
            }
          }

          // Check if no_of_participants changed
          if (
            key === "no_of_participants" &&
            value !== record.no_of_participants
          ) {
            noOfParticipantsChanged = true;
          }

          // Check if any trigger field changed
          if (triggerFields.includes(key) && value !== record[key]) {
            triggerFieldChanged = true;
          }

          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      // If any trigger field changed, reset pendingFields and nullableFields to defaults
      if (triggerFieldChanged) {
        pendingFields.forEach((field) => {
          updates.push(`${field} = ?`);
          values.push("Pending");
        });

        nullableFields.forEach((field) => {
          updates.push(`${field} = ?`);
          values.push(null);
        });
      }

      if (updates.length === 0)
        return res.status(400).json({ error: "No allowed fields to update" });

      if (!isOwner && allowed.length === 0) {
        return res
          .status(403)
          .json({ error: "You do not have permission to update this record." });
      }

      // Track who updated
      updates.push("updated_by_id = ?");
      values.push(req.user.id);

      values.push(id);
      const sql = `UPDATE payments_main_details SET ${updates.join(
        ", "
      )} WHERE id = ?`;

      db.query(sql, values, (err) => {
        if (err) {
          logger.error("Error updating payment record:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          success: true,
          no_of_participants_changed: noOfParticipantsChanged,
        });
      });
    }
  );
});

// DELETE /api/payments/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT user_id FROM payments_main_details WHERE id = ?",
    [id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Not found" });

      const record = results[0];
      if (!canDeleteRecord(req.user, record)) {
        logger.warn(
          `Unauthorized delete attempt on record ${id} by user ${
            req.user.name || req.user.id
          }`
        );
        return res.status(403).json({ error: "Forbidden" });
      }

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

      const payment = results[0];
      const roles = normalizeRoles(req.user.role);
      const userId = req.user.id;

      // Check if user is SuperAdmin or finance_manager: full access
      if (roles.includes("SuperAdmin") || roles.includes("finance_manager")) {
        return res.json(payment);
      }

      // Owners always have access to their own records
      if (payment.user_id === userId) {
        return res.json(payment);
      }

      // Role-based approval visibility logic
      if (roles.includes("CTM")) {
        if (
          payment.DCTM01_approval_obtained === "Approved" &&
          payment.DCTM02_approval_obtained === "Approved"
        ) {
          return res.json(payment);
        }
      }

      if (roles.includes("DCTM01") || roles.includes("DCTM02")) {
        if (payment.sectional_approval_obtained === "Approved") {
          return res.json(payment);
        }
      }

      if (roles.includes("sectional_head")) {
        if (payment.accountant_approval_obtained === "Approved") {
          return res.json(payment);
        }
      }

      if (roles.includes("accountant")) {
        // Accountants see all records
        return res.json(payment);
      }

      // If none of the above conditions met, deny access
      return res.status(403).json({ error: "Forbidden" });
    }
  );
});

module.exports = router;
