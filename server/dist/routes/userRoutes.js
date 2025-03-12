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
router.post('/', (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role
  } = req.body;
  const sql = `INSERT INTO users (name, email, phone, password, role) 
               VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [name, email, phone, password, role], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log("User:", name, "Created Successfully at:", logintime);
    return res.json({
      success: true,
      message: 'User created successfully'
    });
  });
});

// PUT update user status
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const {
    status
  } = req.body;
  const sql = 'UPDATE users SET status = ? WHERE id = ?';
  db.query(sql, [status, userId], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error'
      });
    }
    console.log(`User ${userId} status updated to: ${status}`);
    return res.json({
      success: true,
      message: 'User status updated'
    });
  });
});
router.delete('/users/:id', authMiddleware, async (req, res) => {
  const userIdToDelete = req.params.id;
  const loggedInUserId = req.user.id;
  console.log('User to delete:', userIdToDelete);
  console.log('Current user id from token:', currentUserId);
  if (String(userIdToDelete) === String(loggedInUserId)) {
    return res.status(403).json({
      error: "You cannot delete your own account."
    });
  }
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [userIdToDelete], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error'
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