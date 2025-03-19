const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
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
    if (user.password === password) {
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User ${user.name} logged in at : ${logintime}`);
      const payload = {
        id: user.id,
        name: user.name
      };
      const token = jwt.sign(payload, secret, {
        expiresIn: '1h'
      });
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
        user,
        token
      });
    } else {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
  });
});

// Clear logs every 24h (86400000ms)
setInterval(() => {
  console.clear(); // clear PowerShell or terminal
  logger.info('🔄 Logs cleared - 24h cycle restart');
}, 24 * 60 * 60 * 1000);
module.exports = router;