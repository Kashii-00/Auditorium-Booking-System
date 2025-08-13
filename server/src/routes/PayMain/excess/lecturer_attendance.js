// routes/lecturer_attendance.js
const express = require("express");
const db = require("../../../db");
const auth = require("../../../auth");
const Joi = require("joi");

const router = express.Router();
router.use(auth.authMiddleware);

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];

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
  payments_main_details_id: Joi.number().integer().required(),
  role: Joi.string().required(),
  lecturer_id: Joi.number().integer().required(),
  worked_hours: Joi.number().integer().min(0).required(),
});

const patchSchema = Joi.object({
  increment_by: Joi.number().integer().min(1).required(),
});

router.post("/", (req, res) => {
  const { error, value } = postSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { payments_main_details_id, role, lecturer_id, worked_hours } = value;
  const user_id = req.user.id;
  const roleCleaned = role.trim();

  // Step 1: Check for rate type in rates table
  db.query(
    "SELECT rate_type FROM rates WHERE item_description = ? AND category = 'Course Delivery Human Resources' LIMIT 1",
    [roleCleaned],
    (err, rateRows) => {
      if (err)
        return res.status(500).json({ error: "DB error during rate check" });

      const isFullPayment =
        rateRows.length > 0 && rateRows[0].rate_type === "Full Payment";

      // Step 2: Continue with existing logic
      db.query(
        "SELECT course_id, batch_id FROM payments_main_details WHERE id = ?",
        [payments_main_details_id],
        (err, pmdRows) => {
          if (err) return res.status(500).json({ error: "DB error" });
          if (pmdRows.length === 0)
            return res
              .status(404)
              .json({ error: "Invalid payments_main_details_id" });

          const { course_id, batch_id } = pmdRows[0];

          db.query(
            "SELECT id FROM course_delivery_costs WHERE payments_main_details_id = ?",
            [payments_main_details_id],
            (err, cdcRows) => {
              if (err) return res.status(500).json({ error: "DB error" });
              if (cdcRows.length === 0)
                return res
                  .status(404)
                  .json({ error: "Course delivery costs not found" });

              const course_delivery_cost_id = cdcRows[0].id;

              db.query(
                "SELECT hours, no_of_officers, rate FROM course_delivery_cost_items WHERE course_delivery_cost_id = ? AND role = ?",
                [course_delivery_cost_id, roleCleaned],
                (err, itemRows) => {
                  if (err) return res.status(500).json({ error: "DB error" });
                  if (itemRows.length === 0)
                    return res
                      .status(404)
                      .json({ error: "No matching delivery cost item found" });

                  const expected_work_hours = parseInt(itemRows[0].hours);
                  const max_officers = parseInt(itemRows[0].no_of_officers);
                  const rate = parseFloat(itemRows[0].rate);

                  // Check max officer limit (still enforced)
                  db.query(
                    "SELECT COUNT(*) AS count FROM lecturer_attendance WHERE payments_main_details_id = ? AND role = ?",
                    [payments_main_details_id, roleCleaned],
                    (err, countRows) => {
                      if (err)
                        return res.status(500).json({ error: "DB error" });

                      const existingCount = countRows[0].count;
                      if (existingCount >= max_officers) {
                        return res.status(400).json({
                          error: `Limit reached: Only ${max_officers} ${roleCleaned} allowed for this course.`,
                        });
                      }

                      // Override worked/expected hours for Full Payment
                      const finalWorkedHours = isFullPayment
                        ? 0
                        : parseInt(worked_hours);
                      const finalExpectedWorkHours = isFullPayment
                        ? 0
                        : expected_work_hours;

                      // Reject if non-Full Payment role has excess hours
                      if (
                        !isFullPayment &&
                        finalWorkedHours > finalExpectedWorkHours
                      ) {
                        return res.status(400).json({
                          error:
                            "Worked hours cannot exceed expected work hours.",
                        });
                      }

                      db.query(
                        `INSERT INTO lecturer_attendance (
                          payments_main_details_id, lecturer_id, role, course_id, batch_id,
                          user_id, rate, worked_hours, expected_work_hours
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                          payments_main_details_id,
                          lecturer_id,
                          roleCleaned,
                          course_id,
                          batch_id,
                          user_id,
                          rate,
                          finalWorkedHours,
                          finalExpectedWorkHours,
                        ],
                        (err) => {
                          if (err) {
                            if (err.code === "ER_DUP_ENTRY") {
                              return res.status(400).json({
                                error:
                                  "A lecturer with the same role, course, and batch already exists.",
                              });
                            }
                            return res
                              .status(500)
                              .json({ error: "Insert failed" });
                          }

                          res.status(201).json({
                            message:
                              "Lecturer attendance recorded successfully.",
                            note: isFullPayment
                              ? "This role uses a 'Full Payment' rate. Hours were auto-set to 0."
                              : undefined,
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
    }
  );
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { error, value } = patchSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const increment_by = value.increment_by;
  const user = req.user;
  const isPriv = isPrivileged(user);

  // Step 1: Get the attendance record
  db.query(
    "SELECT user_id, worked_hours, expected_work_hours, role FROM lecturer_attendance WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Record not found" });

      const record = rows[0];
      const roleCleaned = record.role.trim();

      // Step 2: Permission check
      if (!isPriv && record.user_id !== user.id) {
        return res.status(403).json({
          error: "Forbidden. You can only update your own record.",
        });
      }

      // Step 3: Check if Full Payment rate type
      db.query(
        "SELECT rate_type FROM rates WHERE item_description = ? AND category = 'Course Delivery Human Resources' LIMIT 1",
        [roleCleaned],
        (err, rateRows) => {
          if (err)
            return res
              .status(500)
              .json({ error: "DB error during rate check" });

          if (rateRows.length > 0 && rateRows[0].rate_type === "Full Payment") {
            return res.status(400).json({
              error: `Cannot update worked hours for role "${roleCleaned}" as it uses a 'Full Payment' rate.`,
            });
          }

          // Step 4: Check new hours and update
          const newWorkedHours = record.worked_hours + increment_by;
          if (newWorkedHours > record.expected_work_hours) {
            return res.status(400).json({
              error: `Increment exceeds expected work hours. Max allowed: ${record.expected_work_hours}`,
            });
          }

          db.query(
            "UPDATE lecturer_attendance SET worked_hours = ? WHERE id = ?",
            [newWorkedHours, id],
            (err) => {
              if (err) return res.status(500).json({ error: "Update failed" });

              res.json({
                message: "Worked hours updated successfully.",
                new_worked_hours: newWorkedHours,
              });
            }
          );
        }
      );
    }
  );
});

router.get("/", (req, res) => {
  const user = req.user;
  const isPriv = isPrivileged(user);

  const query = isPriv
    ? "SELECT * FROM lecturer_attendance"
    : "SELECT * FROM lecturer_attendance WHERE user_id = ?";
  const params = isPriv ? [] : [user.id];

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(rows);
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const isPriv = isPrivileged(user);

  db.query(
    "SELECT user_id FROM lecturer_attendance WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "Record not found" });

      const record = rows[0];
      if (record.user_id !== user.id && !isPriv) {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this record" });
      }

      db.query("DELETE FROM lecturer_attendance WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Delete failed" });
        res.json({ message: "Deleted successfully" });
      });
    }
  );
});

module.exports = router;
