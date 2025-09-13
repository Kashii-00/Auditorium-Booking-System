const express = require("express");
const router = express.Router();
const db = require("../db");
const logger = require("../logger");
const auth = require("../auth");
const moment = require("moment");

// CREATE Aid Request + Aid Items
router.post("/", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/aidrequests`);
  console.log("Aid request POST body:", req.body);

  const { aidRequest, aidItems } = req.body;
  const user_name = req.user.name;

  const requestSql = `
  INSERT INTO aid_requests 
  (requesting_officer_name, designation, requesting_officer_email, course_name, duration, audience_type, no_of_participants, course_coordinator, date_from, date_to, time_from, time_to, preferred_days_of_week, paid_course_or_not, payment_status, signed_date, request_status, classrooms_allocated, exam_or_not, cancelled_by_requester) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

  const requestValues = [
    aidRequest.requesting_officer_name,
    aidRequest.designation,
    aidRequest.requesting_officer_email,
    aidRequest.course_name,
    aidRequest.duration,
    aidRequest.audience_type,
    aidRequest.no_of_participants || 0,
    aidRequest.course_coordinator,
    aidRequest.date_from,
    aidRequest.date_to,
    aidRequest.time_from,
    aidRequest.time_to,
    aidRequest.preferred_days_of_week,
    aidRequest.paid_course_or_not || "No",
    aidRequest.payment_status || "Not Set",
    aidRequest.signed_date,
    aidRequest.request_status || "pending",
    aidRequest.classrooms_allocated || null,
    aidRequest.exam_or_not || "No",
    aidRequest.cancelled_by_requester || "No",
  ];

  db.query(requestSql, requestValues, (err, result) => {
    if (err) {
      logger.error("Error creating aid request:", err);
      return res
        .status(500)
        .json({ error: "Database error while inserting aid request" });
    }

    const requestId = result.insertId;
    if (!aidItems || aidItems.length === 0) {
      return res.json({
        success: true,
        message: "Aid request created (no items provided)",
        request_id: requestId,
      });
    }

    const itemSql = `
    INSERT INTO aid_items (
      request_id, item_no, description, quantity, remark,
      md_approval_required_or_not, md_approval_obtained, md_approval_details,
      CTM_approval_obtained, CTM_Details
    ) VALUES ?
  `;

    const itemValues = aidItems.map((item) => [
      requestId,
      item.item_no,
      item.description,
      item.quantity,
      item.remark,
      item.md_approval_required_or_not || "No",
      item.md_approval_obtained || "No",
      item.md_approval_details || null,
      item.CTM_approval_obtained || null,
      item.CTM_Details || null,
    ]);

    db.query(itemSql, [itemValues], (err) => {
      if (err) {
        logger.error("Error inserting aid items:", err);
        return res
          .status(500)
          .json({ error: "Database error while inserting aid items" });
      }

      const logintime = moment().format("YYYY-MM-DD HH:mm:ss");
      logger.info(`Aid request created at ${logintime} by ${user_name}`);
      logger.info(`Request ID: ${requestId}, Items count: ${aidItems.length}`);
      return res.json({
        success: true,
        message: "Aid request and items created successfully",
        request_id: requestId,
      });
    });
  });
});

// GET all aid requests with their items
router.get("/", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/aidrequests`);

  const sql = `
  SELECT ar.*, ai.item_no, ai.description, ai.quantity, ai.remark, ai.md_approval_required_or_not, ai.md_approval_obtained, ai.md_approval_details, ai.CTM_approval_obtained, ai.CTM_Details
  FROM aid_requests ar
  LEFT JOIN aid_items ai ON ar.id = ai.request_id
`;

  db.query(sql, (err, results) => {
    if (err) {
      logger.error("Error fetching aid requests:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const grouped = {};
    results.forEach((row) => {
      const reqId = row.id;
      if (!grouped[reqId]) {
        grouped[reqId] = {
          ...row,
          aid_items: [],
        };
        delete grouped[reqId].item_no;
        delete grouped[reqId].description;
        delete grouped[reqId].quantity;
        delete grouped[reqId].remark;
        delete grouped[reqId].md_approval_required_or_not;
        delete grouped[reqId].md_approval_obtained;
        delete grouped[reqId].md_approval_details;
        delete grouped[reqId].CTM_approval_obtained;
        delete grouped[reqId].CTM_Details;
      }

      if (row.item_no) {
        grouped[reqId].aid_items.push({
          item_no: row.item_no,
          description: row.description,
          quantity: row.quantity,
          remark: row.remark,
          md_approval_required_or_not: row.md_approval_required_or_not,
          md_approval_obtained: row.md_approval_obtained,
          md_approval_details: row.md_approval_details,
          CTM_approval_obtained: row.CTM_approval_obtained,
          CTM_Details: row.CTM_Details,
        });
      }
    });

    return res.json({
      success: true,
      message: "Aid requests fetched successfully",
      data: Object.values(grouped),
    });
  });
});

// GET specific aid request by ID with items
router.get("/:requestId", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/aidrequests/${req.params.requestId}`);

  const requestId = req.params.requestId;
  const sql = `
  SELECT ar.*, ai.item_no, ai.description, ai.quantity, ai.remark, ai.md_approval_required_or_not, ai.md_approval_obtained, ai.md_approval_details, ai.CTM_approval_obtained, ai.CTM_Details
  FROM aid_requests ar
  LEFT JOIN aid_items ai ON ar.id = ai.request_id
  WHERE ar.id = ?
`;

  db.query(sql, [requestId], (err, results) => {
    if (err) {
      logger.error("Error fetching aid request:", err);
      return res
        .status(500)
        .json({ error: "Database error while fetching aid request" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Aid request not found" });
    }

    const grouped = {
      ...results[0],
      aid_items: [],
    };

    results.forEach((row) => {
      if (row.item_no) {
        grouped.aid_items.push({
          item_no: row.item_no,
          description: row.description,
          quantity: row.quantity,
          remark: row.remark,
          md_approval_required_or_not: row.md_approval_required_or_not,
          md_approval_obtained: row.md_approval_obtained,
          md_approval_details: row.md_approval_details,
          CTM_approval_obtained: row.CTM_approval_obtained,
          CTM_Details: row.CTM_Details,
        });
      }
    });

    delete grouped.item_no;
    delete grouped.description;
    delete grouped.quantity;
    delete grouped.remark;
    delete grouped.md_approval_required_or_not;
    delete grouped.md_approval_obtained;
    delete grouped.md_approval_details;
    delete grouped.CTM_approval_obtained;
    delete grouped.CTM_Details;

    return res.json({
      success: true,
      message: "Aid request fetched successfully",
      data: grouped,
    });
  });
});

// GET specific aid request by ID ONLY IF request_status is "Approved"
router.get("/approved/:requestId", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/aidrequests/approved/${req.params.requestId}`);

  const requestId = req.params.requestId;
  const sql = `
    SELECT ar.*, ai.item_no, ai.description, ai.quantity, ai.remark, ai.md_approval_required_or_not, ai.md_approval_obtained, ai.md_approval_details, ai.CTM_approval_obtained, ai.CTM_Details
    FROM aid_requests ar
    LEFT JOIN aid_items ai ON ar.id = ai.request_id
    WHERE ar.id = ? AND ar.request_status = 'Approved'
  `;

  db.query(sql, [requestId], (err, results) => {
    if (err) {
      logger.error("Error fetching approved aid request:", err);
      return res
        .status(500)
        .json({ error: "Database error while fetching approved aid request" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Approved aid request not found" });
    }

    const grouped = {
      ...results[0],
      aid_items: [],
    };

    results.forEach((row) => {
      if (row.item_no) {
        grouped.aid_items.push({
          item_no: row.item_no,
          description: row.description,
          quantity: row.quantity,
          remark: row.remark,
          md_approval_required_or_not: row.md_approval_required_or_not,
          md_approval_obtained: row.md_approval_obtained,
          md_approval_details: row.md_approval_details,
          CTM_approval_obtained: row.CTM_approval_obtained,
          CTM_Details: row.CTM_Details,
        });
      }
    });

    delete grouped.item_no;
    delete grouped.description;
    delete grouped.quantity;
    delete grouped.remark;
    delete grouped.md_approval_required_or_not;
    delete grouped.md_approval_obtained;
    delete grouped.md_approval_details;
    delete grouped.CTM_approval_obtained;
    delete grouped.CTM_Details;

    return res.json({
      success: true,
      message: "Approved aid request fetched successfully",
      data: grouped,
    });
  });
});

// UPDATE aid request (request_status, payment_status)
router.put("/:id", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] PUT /api/aidrequests/${req.params.id}`);
  console.log("Update aid request body:", req.body);

  const { request_status, payment_status } = req.body;
  const user_name = req.user.name;

  const updates = [];
  const values = [];

  if (request_status) {
    updates.push("request_status = ?");
    values.push(request_status);
  }

  if (payment_status) {
    updates.push("payment_status = ?");
    values.push(payment_status);
  }

  if (updates.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update" });
  }

  values.push(req.params.id);
  const sql = `UPDATE aid_requests SET ${updates.join(", ")} WHERE id = ?`;

  db.query(sql, values, (err) => {
    if (err) {
      logger.error("Error updating aid request:", err);
      return res.status(500).json({ error: "Database error during update" });
    }

    const logintime = moment().format("YYYY-MM-DD HH:mm:ss");
    logger.info(
      `Aid request ID ${req.params.id} updated at: ${logintime} by: ${user_name}`
    );
    logger.info(`Updated fields: ${updates.join(", ")}`);
    return res.json({
      success: true,
      message: "Aid request updated successfully",
    });
  });
});

// UPDATE aid request (request_status, payment_status, cancelled_by_requester)
router.put("/cancel-or-update/:id", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(
    `[${now}] PUT /api/aidrequests/cancel-or-update/${req.params.id}`
  );
  console.log("Update aid request (cancel/update) body:", req.body);

  const { request_status, cancelled_by_requester } = req.body;
  const user_name = req.user.name;

  // Step 1: Check current status
  const checkSql = `SELECT request_status FROM aid_requests WHERE id = ?`;
  db.query(checkSql, [req.params.id], (checkErr, results) => {
    if (checkErr) {
      logger.error("Error checking current request status:", checkErr);
      return res.status(500).json({ error: "Database error during check" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Aid request not found" });
    }

    const currentStatus = results[0].request_status;
    if (currentStatus === "Approved") {
      return res
        .status(403)
        .json({ error: "Approved requests cannot be cancelled." });
    }

    // Step 2: Build update
    const updates = [];
    const values = [];

    if (request_status) {
      updates.push("request_status = ?");
      values.push(request_status);
    }

    if (cancelled_by_requester) {
      updates.push("cancelled_by_requester = ?");
      values.push(cancelled_by_requester);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    values.push(req.params.id);
    const sql = `UPDATE aid_requests SET ${updates.join(", ")} WHERE id = ?`;

    db.query(sql, values, (err) => {
      if (err) {
        logger.error("Error updating aid request:", err);
        return res.status(500).json({ error: "Database error during update" });
      }

      const logintime = moment().format("YYYY-MM-DD HH:mm:ss");
      logger.info(
        `Aid request ID ${req.params.id} (cancel/update) modified at: ${logintime} by: ${user_name}`
      );
      logger.info(`Updated fields: ${updates.join(", ")}`);
      return res.json({
        success: true,
        message: "Aid request updated successfully",
      });
    });
  });
});

// DELETE aid request
router.delete("/:id", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/aidrequests/${req.params.id}`);

  const user_name = req.user.name;
  const sql = "DELETE FROM aid_requests WHERE id = ?";

  db.query(sql, [req.params.id], (err) => {
    if (err) {
      logger.error("Error deleting aid request:", err);
      return res
        .status(500)
        .json({ error: "Database error while deleting aid request" });
    }

    const logintime = moment().format("YYYY-MM-DD HH:mm:ss");
    logger.info(`Aid request deleted at: ${logintime} by: ${user_name}`);
    logger.info(`Deleted aid request ID: ${req.params.id}`);
    return res.json({
      success: true,
      message: "Aid request deleted successfully",
    });
  });
});

module.exports = router;
