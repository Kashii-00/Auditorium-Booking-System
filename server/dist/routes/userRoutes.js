"use strict";

const express = require('express');
const router = express.Router();
const moment = require('moment');
const logger = require('../logger');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../auth');
const bcrypt = require('bcrypt');

// GET all users
router.get('/', auth.authMiddleware, (req, res) => {
  const sql = 'SELECT id, name, email, phone, role, status FROM users';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    return res.json(results);
  });
});

// GET user by ID
router.get('/:id', auth.authMiddleware, (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT id, name, email, phone, role, status FROM users WHERE id=?';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    if (results.length === 0) return res.status(404).json({
      error: 'User not found'
    });
    return res.json(results[0]);
  });
});

// POST create user
router.post('/', auth.authMiddleware, async (req, res) => {
  const user_name = req.user.name;
  const {
    name,
    email,
    phone,
    password,
    role
  } = req.body;
  // Always store role as JSON array
  const roleArray = Array.isArray(role) ? role : [role];
  const roleJson = JSON.stringify(roleArray);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [name, email, phone, hashedPassword, roleJson], (err, result) => {
      if (err) return res.status(500).json({
        error: 'Database error'
      });
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User Created Successfully at: ${logintime} by: ${user_name}`);
      return res.json({
        success: true,
        message: 'User created successfully'
      });
    });
  } catch (err) {
    console.error('Hashing error:', err);
    return res.status(500).json({
      error: 'Password hashing failed'
    });
  }
});

// Update the PUT route
router.put('/:id', auth.authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const user_name = req.user.name;
  const {
    name,
    email,
    phone,
    password,
    role,
    status
  } = req.body;
  const updates = [];
  const values = [];
  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (phone) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    } catch (err) {
      return res.status(500).json({
        error: 'Password hashing failed'
      });
    }
  }
  if (role) {
    updates.push('role = ?');
    const roleArray = Array.isArray(role) ? role : [role];
    values.push(JSON.stringify(roleArray));
  }
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (updates.length === 0) {
    return res.status(400).json({
      error: 'No fields to update'
    });
  }
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  values.push(userId);
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`User ${userId} Updated Successfully at: ${logintime} by: ${user_name}`);
    return res.json({
      success: true,
      message: 'User updated successfully'
    });
  });
});

// DELETE user
router.delete('/:id', auth.authMiddleware, (req, res) => {
  const userIdToDelete = req.params.id;
  const loggedInUserId = req.user.id;
  const user_name = req.user.name;
  if (String(userIdToDelete) === String(loggedInUserId)) {
    return res.status(403).json({
      error: 'You cannot delete your own account.'
    });
  }
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [userIdToDelete], (err, result) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    if (result.affectedRows === 0) return res.status(404).json({
      error: 'User not found'
    });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`User ${userIdToDelete} Deleted Successfully at: ${logintime} by : ${user_name}`);
    return res.json({
      success: true,
      message: 'User deleted'
    });
  });
});

// Clear logs every 24h
setInterval(() => {
  console.clear();
  logger.info('🔄 Logs cleared - 24h cycle restart');
}, 24 * 60 * 60 * 1000);
module.exports = router;