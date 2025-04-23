const express = require('express');
const router = express.Router();
const moment = require('moment');
const logger = require('../logger');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../auth');
const bcrypt = require('bcrypt');

router.get('/', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/users`);
  const sql = 'SELECT id, name, email, phone, role, status FROM users';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    return res.json(results);
  });
});

router.get('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/users/${req.params.id}`);
  const userId = req.params.id;
  const sql = 'SELECT id, name, email, phone, role, status FROM users WHERE id=?';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json(results[0]);
  });
});

router.post('/', auth.authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/users`);
  console.log('User creation POST body:', req.body);

  const user_name = req.user.name;
  const { name, email, phone, password, role } = req.body;
  const roleArray = Array.isArray(role) ? role : [role];
  const roleJson = JSON.stringify(roleArray);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [name, email, phone, hashedPassword, roleJson], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User Created Successfully at: ${logintime} by: ${user_name}`);
      return res.json({ success: true, message: 'User created successfully' });
    });
  } catch (err) { 
    console.error('Hashing error:', err);
    return res.status(500).json({ error: 'Password hashing failed' });
  }
});

router.put('/:id', auth.authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] PUT /api/users/${req.params.id}`);
  console.log('User update PUT body:', req.body);

  const userId = req.params.id;
  const user_name = req.user.name;
  const { name, email, phone, password, role, status } = req.body;

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
      return res.status(500).json({ error: 'Password hashing failed' });
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
    return res.status(400).json({ error: 'No fields to update' });
  }

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  values.push(userId);

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`User ${userId} Updated Successfully at: ${logintime} by: ${user_name}`);
    return res.json({ success: true, message: 'User updated successfully' });
  });
});

router.delete('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/users/${req.params.id}`);
  const userIdToDelete = req.params.id;
  const loggedInUserId = req.user.id;
  const user_name = req.user.name;

  if (String(userIdToDelete) === String(loggedInUserId)) {
    return res.status(403).json({ error: 'You cannot delete your own account.' });
  }

  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [userIdToDelete], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`User ${userIdToDelete} Deleted Successfully at: ${logintime} by : ${user_name}`);
    return res.json({ success: true, message: 'User deleted' });
  });
});

module.exports = router;
