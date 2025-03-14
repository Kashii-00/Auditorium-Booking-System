const express = require('express');
const router = express.Router();
const moment = require('moment');
const db = require('../db');
const authMiddleware = require('../auth');
router.get('/', (req, res) => {
  const sql = 'SELECT id, name, email, phone, role, status FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error'
      });
    }
    return res.json(results);
  });
});
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT id, name, email, phone, role, status FROM users WHERE id=?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    if (results.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    return res.json(results[0]);
  });
});
router.post('/', (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role
  } = req.body;
  const sql = `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [name, email, phone, password, role], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log('User:', name, 'Created Successfully at:', logintime);
    return res.json({
      success: true,
      message: 'User created successfully'
    });
  });
});
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const {
    name,
    email,
    phone,
    password,
    role,
    status
  } = req.body;

  // Build partial update
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
    fields.push('password=?');
    values.push(password);
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
    return res.status(400).json({
      error: 'No fields to update'
    });
  }
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id=?`;
  values.push(userId);
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    console.log(`User ${userId} updated successfully`);
    return res.json({
      success: true,
      message: 'User updated successfully'
    });
  });
});
router.delete('/:id', authMiddleware, (req, res) => {
  const userIdToDelete = req.params.id;
  const loggedInUserId = req.user.id; // from token

  console.log('User to delete:', userIdToDelete);
  console.log('Current user id from token:', loggedInUserId);
  if (String(userIdToDelete) === String(loggedInUserId)) {
    return res.status(403).json({
      error: 'You cannot delete your own account.'
    });
  }
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [userIdToDelete], (err, result) => {
    if (err) {
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
    console.log('User', userIdToDelete, 'deleted at:', logintime);
    return res.json({
      success: true,
      message: 'User deleted'
    });
  });
});
module.exports = router;