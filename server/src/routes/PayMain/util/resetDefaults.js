const db = require("../../../db");

function resetApprovalFields(paymentId, userId, callback) {
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

  // First, fetch the record to ensure it exists and belongs to the user
  db.query(
    "SELECT * FROM payments_main_details WHERE id = ?",
    [paymentId],
    (err, results) => {
      if (err) return callback(err);
      if (results.length === 0) return callback(new Error("Record not found"));

      // Prepare update query
      const updates = [];
      const values = [];

      // Set all pendingFields to 'Pending'
      pendingFields.forEach((field) => {
        updates.push(`${field} = ?`);
        values.push("Pending");
      });

      // Set all nullableFields to NULL
      nullableFields.forEach((field) => {
        updates.push(`${field} = ?`);
        values.push(null);
      });

      // Set updated_by_id
      updates.push("updated_by_id = ?");
      values.push(userId);

      // WHERE clause
      values.push(paymentId);

      const sql = `UPDATE payments_main_details SET ${updates.join(
        ", "
      )} WHERE id = ?`;

      db.query(sql, values, (err, result) => {
        if (err) return callback(err);
        callback(null, { success: true, updatedRows: result.affectedRows });
      });
    }
  );
}

// ✅ Export the function so other files can use it
module.exports = {
  resetApprovalFields,
};
