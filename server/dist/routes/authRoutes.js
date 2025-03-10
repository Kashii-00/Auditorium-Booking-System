const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
router.post('/login', (req, res) => {
  const {
    email,
    password
  } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error'
      });
    }
    if (results.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    const user = results[0];
    if (user.password === password) {
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      };
      return res.json({
        success: true,
        user: userData
      });
    } else {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
  });
});
module.exports = router;