"use strict";

const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const bcrypt = require('bcrypt');
const auth = require('../auth');
const {
  generateTokens,
  verifyRefreshToken
} = auth;

// Configure rate limiting
const refreshTokens = {};
const refreshAttempts = {}; // Define this at module scope to ensure it's available in all closures
const MAX_REFRESH_RATE = 1000; // 1 second minimum between token refreshes per user
const MAX_REFRESH_ATTEMPTS = 10; // Maximum attempts per minute per user
const REFRESH_TIMEOUT = 300000; // 5 minutes timeout (used in cleanup interval)

// Handle preflight OPTIONS requests
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
  const {
    email,
    password
  } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
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
    const loginUser = () => {
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User ${user.name} logged in at: ${logintime}`);

      // Create payload - only include necessary user data
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      // Generate both access and refresh tokens
      const {
        accessToken,
        refreshToken
      } = generateTokens(payload);

      // Set refresh token in HTTP-only secure cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Only return the access token to the client (stored in memory)
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken
      });
    };

    // Password comparison with bcrypt
    if (user.password.startsWith('$2')) {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({
          error: 'Authentication error'
        });
        if (!isMatch) return res.status(401).json({
          error: 'Invalid email or password'
        });
        loginUser();
      });
    } else {
      if (password !== user.password) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }
      loginUser();
    }
  });
});

// Refresh token route
router.post('/refresh', (req, res) => {
  try {
    // Get IP for rate limiting
    const ip = req.ip || req.connection.remoteAddress;

    // Initialize rate limiting for this IP if not exists
    if (!refreshAttempts[ip]) {
      refreshAttempts[ip] = {
        count: 0,
        timestamp: Date.now()
      };
    }

    // Check rate limiting
    if (refreshAttempts[ip].count >= MAX_REFRESH_ATTEMPTS) {
      const timeSinceReset = Date.now() - refreshAttempts[ip].timestamp;
      if (timeSinceReset < 60000) {
        // 1 minute
        return res.status(429).json({
          error: 'Too many refresh attempts. Try again later.'
        });
      }
      // Reset after 1 minute
      refreshAttempts[ip].count = 0;
      refreshAttempts[ip].timestamp = Date.now();
    }

    // Increment attempt counter
    refreshAttempts[ip].count++;
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token provided'
      });
    }

    // Verify the refresh token
    const userData = verifyRefreshToken(refreshToken);
    if (!userData) {
      // Clear the invalid cookie
      res.clearCookie('refreshToken');
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token (keep refresh token if still valid)
    const accessToken = jwt.sign({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    }, auth.ACCESS_TOKEN_SECRET, {
      expiresIn: '15m'
    });

    // Return the new access token
    return res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    return res.status(500).json({
      error: 'Authentication error'
    });
  }
});

// Clean up old entries from refreshTokens periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(refreshTokens).forEach(userId => {
    if (now > refreshTokens[userId].resetTime + 300000) {
      // 5 minutes after reset time
      delete refreshTokens[userId];
    }
  });
}, 600000); // Run every 10 minutes

// Logout route - clear the refresh token cookie
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({
    success: true
  });
});

// Clear logs every 24h
setInterval(() => {
  console.clear();
  logger.info('🔄 Logs cleared - 24h cycle restart');
}, 24 * 60 * 60 * 1000);

// Clear rate limiting data periodically (every hour)
// Explicitly reference the module-level refreshAttempts variable
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
}, 3600000); // 1 hour

module.exports = router;