"use strict";

const moment = require("moment");
const express = require("express");
const router = express.Router();
const logger = require("../logger");
const auth = require("../auth");
const db = require("../db");

// Create aid handover entry
router.post("/", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/aidhandover`);
  console.log("Aid Handover POST body:", req.body);
  const user_name = req.user.name;
  const {
    request_id,
    items_taken_over,
    items_returned,
    receiver_name,
    receiver_designation,
    receiver_date,
    handover_confirmer_name,
    handover_confirmer_designation,
    handover_confirmer_date
  } = req.body;
  const sql = `
    INSERT INTO aid_handover (
      request_id,
      items_taken_over,
      items_returned,
      receiver_name,
      receiver_designation,
      receiver_date,
      handover_confirmer_name,
      handover_confirmer_designation,
      handover_confirmer_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [request_id, items_taken_over, items_returned, receiver_name, receiver_designation, receiver_date, handover_confirmer_name, handover_confirmer_designation, handover_confirmer_date], (err, result) => {
    if (err) {
      logger.error("Error inserting aid handover:", err);
      return res.status(500).json({
        error: "Database error"
      });
    }
    const logTime = moment().format("YYYY-MM-DD HH:mm:ss");
    logger.info(`Aid handover created successfully at: ${logTime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: "Aid handover created successfully",
      handoverId: result.insertId
    });
  });
});
router.patch("/", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] PATCH /api/aidhandover`);
  console.log("Aid Handover PATCH body:", req.body);
  const user_name = req.user.name;
  const {
    request_id,
    items_taken_over,
    items_returned,
    receiver_name,
    receiver_designation,
    receiver_date,
    handover_confirmer_name,
    handover_confirmer_designation,
    handover_confirmer_date
  } = req.body;
  if (!request_id) {
    return res.status(400).json({
      error: "request_id is required"
    });
  }

  // Step 1: Check if a record exists with this request_id
  const checkSql = "SELECT * FROM aid_handover WHERE request_id = ?";
  db.query(checkSql, [request_id], (checkErr, checkResults) => {
    if (checkErr) {
      logger.error("Error checking aid handover existence:", checkErr);
      return res.status(500).json({
        error: "Database error"
      });
    }
    if (checkResults.length === 0) {
      // No record found -> INSERT new record with provided fields
      const insertSql = `
        INSERT INTO aid_handover (
          request_id,
          items_taken_over,
          items_returned,
          receiver_name,
          receiver_designation,
          receiver_date,
          handover_confirmer_name,
          handover_confirmer_designation,
          handover_confirmer_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertSql, [request_id, items_taken_over || null, items_returned || null, receiver_name || null, receiver_designation || null, receiver_date || null, handover_confirmer_name || null, handover_confirmer_designation || null, handover_confirmer_date || null], (insertErr, insertResult) => {
        if (insertErr) {
          logger.error("Error inserting aid handover:", insertErr);
          return res.status(500).json({
            error: "Database error"
          });
        }
        logger.info(`Aid handover created successfully at ${moment().format("YYYY-MM-DD HH:mm:ss")} by user: ${user_name}`);
        return res.json({
          success: true,
          message: "Aid handover created successfully",
          handoverId: insertResult.insertId
        });
      });
    } else {
      // Record found -> UPDATE only provided fields (partial update)
      // Build SET clause dynamically based on provided fields
      const fieldsToUpdate = [];
      const values = [];
      if (items_taken_over !== undefined) {
        fieldsToUpdate.push("items_taken_over = ?");
        values.push(items_taken_over);
      }
      if (items_returned !== undefined) {
        fieldsToUpdate.push("items_returned = ?");
        values.push(items_returned);
      }
      if (receiver_name !== undefined) {
        fieldsToUpdate.push("receiver_name = ?");
        values.push(receiver_name);
      }
      if (receiver_designation !== undefined) {
        fieldsToUpdate.push("receiver_designation = ?");
        values.push(receiver_designation);
      }
      if (receiver_date !== undefined) {
        fieldsToUpdate.push("receiver_date = ?");
        values.push(receiver_date);
      }
      if (handover_confirmer_name !== undefined) {
        fieldsToUpdate.push("handover_confirmer_name = ?");
        values.push(handover_confirmer_name);
      }
      if (handover_confirmer_designation !== undefined) {
        fieldsToUpdate.push("handover_confirmer_designation = ?");
        values.push(handover_confirmer_designation);
      }
      if (handover_confirmer_date !== undefined) {
        fieldsToUpdate.push("handover_confirmer_date = ?");
        values.push(handover_confirmer_date);
      }
      if (fieldsToUpdate.length === 0) {
        return res.status(400).json({
          error: "No fields provided to update"
        });
      }
      const updateSql = `
        UPDATE aid_handover
        SET ${fieldsToUpdate.join(", ")}
        WHERE request_id = ?
      `;
      values.push(request_id);
      db.query(updateSql, values, (updateErr, updateResult) => {
        if (updateErr) {
          logger.error("Error updating aid handover:", updateErr);
          return res.status(500).json({
            error: "Database error"
          });
        }
        logger.info(`Aid handover updated successfully at ${moment().format("YYYY-MM-DD HH:mm:ss")} by user: ${user_name}`);
        return res.json({
          success: true,
          message: "Aid handover updated successfully",
          affectedRows: updateResult.affectedRows
        });
      });
    }
  });
});

// Get all aid handovers
router.get("/", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/aidhandover`);
  const sql = `
    SELECT ah.*, ar.requesting_officer_name, ar.course_name
    FROM aid_handover ah
    JOIN aid_requests ar ON ah.request_id = ar.id
  `;
  db.query(sql, (err, results) => {
    if (err) {
      logger.error("Error fetching aid handovers:", err);
      return res.status(500).json({
        error: "Database error"
      });
    }
    return res.json(results);
  });
});

// Get aid handover by request_id
router.get("/request/:requestId", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  const requestId = req.params.requestId;
  console.log(`[${now}] GET /api/aidhandover/request/${requestId}`);
  const sql = `
      SELECT ah.*, ar.requesting_officer_name, ar.course_name
      FROM aid_handover ah
      JOIN aid_requests ar ON ah.request_id = ar.id
      WHERE ah.request_id = ?
    `;
  db.query(sql, [requestId], (err, results) => {
    if (err) {
      logger.error(`Error fetching aid handover for request ID ${requestId}:`, err);
      return res.status(500).json({
        error: "Database error"
      });
    }
    if (results.length === 0) {
      return res.status(404).json({
        error: "No aid handover found for the given request ID"
      });
    }
    return res.json(results[0]);
  });
});

// Update aid handover entry by request_id
router.put("/request/:requestId", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] PUT /api/aidhandover/request/${req.params.requestId}`);
  console.log("Update aid handover body:", req.body);
  const requestId = req.params.requestId;
  const user_name = req.user.name;
  const {
    items_taken_over,
    items_returned,
    receiver_name,
    receiver_designation,
    receiver_date,
    handover_confirmer_name,
    handover_confirmer_designation,
    handover_confirmer_date
  } = req.body;
  const sql = `
      UPDATE aid_handover SET
        items_taken_over = ?,
        items_returned = ?,
        receiver_name = ?,
        receiver_designation = ?,
        receiver_date = ?,
        handover_confirmer_name = ?,
        handover_confirmer_designation = ?,
        handover_confirmer_date = ?
      WHERE request_id = ?
    `;
  db.query(sql, [items_taken_over, items_returned, receiver_name, receiver_designation, receiver_date, handover_confirmer_name, handover_confirmer_designation, handover_confirmer_date, requestId], (err, result) => {
    if (err) {
      logger.error("Error updating aid handover:", err);
      return res.status(500).json({
        error: "Database error"
      });
    }
    const logTime = moment().format("YYYY-MM-DD HH:mm:ss");
    logger.info(`Aid handover updated at: ${logTime} by: ${user_name}`);
    return res.json({
      success: true,
      message: "Aid handover updated successfully"
    });
  });
});

// Delete aid handover entry by request_id
router.delete("/request/:requestId", auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/aidhandover/request/${req.params.requestId}`);
  const requestId = req.params.requestId;
  const user_name = req.user.name;
  const sql = "DELETE FROM aid_handover WHERE request_id = ?";
  db.query(sql, [requestId], (err, result) => {
    if (err) {
      logger.error("Error deleting aid handover:", err);
      return res.status(500).json({
        error: "Database error"
      });
    }
    const logTime = moment().format("YYYY-MM-DD HH:mm:ss");
    logger.info(`Aid handover deleted at: ${logTime} by: ${user_name}`);
    return res.json({
      success: true,
      message: "Aid handover deleted successfully"
    });
  });
});
module.exports = router;