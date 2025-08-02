const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const bcrypt = require('bcrypt');
const auth = require('../auth');
const { generateTokens, verifyRefreshToken } = auth;

const refreshTokens = {};
const refreshAttempts = {};
const MAX_REFRESH_RATE = 1000;
const MAX_REFRESH_ATTEMPTS = 10;
const REFRESH_TIMEOUT = 300000;

router.options('/login', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

router.options('/refresh', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

router.options('/logout', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});



router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = results[0];
    const loginUser = () => {
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User ${user.name} logged in at: ${logintime}`);
      const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
      const { accessToken, refreshToken } = generateTokens(payload);
      db.query(
        `REPLACE INTO user_refresh_tokens (user_id, refresh_token) VALUES (?, ?)`,
        [user.id, refreshToken],
        (err) => {
          if (err) {
            logger.error('Failed to store refresh token:', err);
            return res.status(500).json({ error: 'Server error' });
          }
          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 10 * 24 * 60 * 60 * 1000
          });
          return res.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            accessToken
          });
        }
      );
    };
    if (user.password.startsWith('$2')) {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ error: 'Authentication error' });
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });
        loginUser();
      });
    } else {
      if (password !== user.password) return res.status(401).json({ error: 'Invalid email or password' });
      loginUser();
    }
  });
});

router.post('/refresh', (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    if (!refreshAttempts[ip]) {
      refreshAttempts[ip] = { count: 0, timestamp: Date.now() };
    }
    if (refreshAttempts[ip].count >= MAX_REFRESH_ATTEMPTS) {
      const timeSinceReset = Date.now() - refreshAttempts[ip].timestamp;
      if (timeSinceReset < 60000) {
        return res.status(429).json({ error: 'Too many refresh attempts. Try again later.' });
      }
      refreshAttempts[ip].count = 0;
      refreshAttempts[ip].timestamp = Date.now();
    }
    refreshAttempts[ip].count++;
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });
    const userData = verifyRefreshToken(refreshToken);
    if (!userData) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    db.query(
      `SELECT refresh_token FROM user_refresh_tokens WHERE user_id = ?`,
      [userData.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!results.length || results[0].refresh_token !== refreshToken) {
          res.clearCookie('refreshToken');
          return res.status(401).json({ error: 'Session expired: logged in elsewhere.' });
        }
        const accessToken = jwt.sign({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        }, auth.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        return res.json({ success: true, accessToken });
      }
    );
  } catch (error) {
    logger.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
});

router.post('/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    let userId = null;
    try {
      const userData = verifyRefreshToken(refreshToken);
      userId = userData?.id;
    } catch {}
    if (userId) {
      db.query(
        `DELETE FROM user_refresh_tokens WHERE user_id = ?`,
        [userId],
        () => {}
      );
    }
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ success: true });
});

setInterval(() => {
  const now = Date.now();
  Object.keys(refreshTokens).forEach(userId => {
    if (now > refreshTokens[userId].resetTime + 300000) {
      delete refreshTokens[userId];
    }
  });
}, 600000);

setInterval(() => {
  try {
    const now = Date.now();
    for (const ip in refreshAttempts) {
      const timeElapsed = now - refreshAttempts[ip].timestamp;
      if (timeElapsed > REFRESH_TIMEOUT) {
        delete refreshAttempts[ip];
      }
    }
    logger.info('Rate limiting data cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up rate limiting data:', error);
  }
}, 3600000);

module.exports = router;
