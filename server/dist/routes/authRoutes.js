const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const bcrypt = require('bcrypt'); // Added bcrypt import
const secret = "KASHIKA2006LK";
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

    // Function to log in user after password validation
    const loginUser = () => {
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User ${user.name} logged in at: ${logintime}`);
      const payload = {
        id: user.id,
        name: user.name
      };
      const token = jwt.sign(payload, secret, {
        expiresIn: '1h'
      });
      return res.json({
        success: true,
        user,
        token
      });
    };

    // Check if the stored password is hashed (bcrypt hashes typically start with "$2")
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      // Use bcrypt.compare if the password is hashed
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({
            error: 'Authentication error'
          });
        }
        if (!isMatch) {
          return res.status(401).json({
            error: 'Invalid email or password'
          });
        }
        loginUser();
      });
    } else {
      // Otherwise, compare the password directly (plain text)
      if (password !== user.password) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }
      loginUser();
    }
  });
});

// Clear logs every 24h (86400000ms)
setInterval(() => {
  console.clear(); // clear PowerShell or terminal
  logger.info('🔄 Logs cleared - 24h cycle restart');
}, 24 * 60 * 60 * 1000);
module.exports = router;