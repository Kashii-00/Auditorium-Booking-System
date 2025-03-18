const express = require('express');
const router = express.Router();
const moment = require('moment');
const logger = require('../logger');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../auth');
const bcrypt = require('bcrypt');


// GET all users
router.get('/', (req, res) => {
  const sql = 'SELECT id, name, email, phone, role, status FROM users';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    return res.json(results);
  });
});

// GET user by ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT id, name, email, phone, role, status FROM users WHERE id=?';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json(results[0]);
  });
});

// POST create user
router.post('/', authMiddleware, async (req, res) => {
  const user_name = req.user.name;
  const { name, email, phone, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [name, email, phone, hashedPassword, role], (err, result) => {
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



// PUT update user
router.put('/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const user_name = req.user.name;
  const { name, email, phone, password, role, status } = req.body;

  const fields = [];
  const values = [];

  if (name) {
    fields.push('name=?');
    values.push(name);
  }
  if (email) {
    fields.push('email=?');
    values.push(email);
  }
  if (phone) {
    fields.push('phone=?');
    values.push(phone);
  }
  if (password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push('password=?');
      values.push(hashedPassword);
    } catch (err) {
      console.error('Password hashing failed:', err);
      return res.status(500).json({ error: 'Password hashing failed' });
    }
  }
  if (role) {
    fields.push('role=?');
    values.push(role);
  }
  if (status) {
    fields.push('status=?');
    values.push(status);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id=?`;
  values.push(userId);

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`User ${userId} Updated Successfully at: ${logintime} by : ${user_name}`);
    return res.json({ success: true, message: 'User updated successfully' });
  });
});

// DELETE user
router.delete('/:id', authMiddleware, (req, res) => {
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

// Clear logs every 24h
setInterval(() => {
  console.clear();
  logger.info('🔄 Logs cleared - 24h cycle restart');
}, 24 * 60 * 60 * 1000);

module.exports = router;
