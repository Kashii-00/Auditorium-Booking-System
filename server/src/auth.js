const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// Configuration settings for JWTs
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

// Generate unique session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate tokens with specific expirations and session ID
const generateTokens = (userData, sessionId = null) => {
  // Generate session ID if not provided
  if (!sessionId) {
    sessionId = generateSessionId();
  }

  // Include session ID in token payload
  const tokenPayload = { ...userData, sessionId };
  
  // Access token - short lived (15 minutes)
  const accessToken = jwt.sign(tokenPayload, ACCESS_TOKEN_SECRET, {
    expiresIn: '15m'
  });
  
  // Refresh token - longer lived (30 days)
  const refreshToken = jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, {
    expiresIn: '30d'
  });
  
  return { accessToken, refreshToken, sessionId };
};

// Authentication middleware with session validation
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = decoded;
    
    // If session ID exists in token, validate it immediately
    if (decoded.sessionId) {
      const db = require('./db');
      
      // Use promise-based query
      const sessionExists = await new Promise((resolve, reject) => {
        db.query(
          'SELECT session_id FROM user_refresh_tokens WHERE user_id = ? AND session_id = ?',
          [decoded.id, decoded.sessionId],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0);
          }
        );
      });
      
      if (!sessionExists) {
        return res.status(401).json({ error: 'Session expired: User logged in elsewhere' });
      }
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

// Session validation middleware
const validateSession = (db) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.sessionId) {
        // Check if session is still valid in database
        const result = await new Promise((resolve, reject) => {
          db.query(
            'SELECT session_id FROM user_refresh_tokens WHERE user_id = ? AND session_id = ?',
            [req.user.id, req.user.sessionId],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });
        
        if (result.length === 0) {
          return res.status(401).json({ error: 'Session expired: User logged in elsewhere' });
        }
      }
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Session validation failed' });
    }
  };
};

// Combined authentication and session validation middleware
const authWithSessionValidation = (db) => {
  return [authMiddleware, validateSession(db)];
};

// Export both as an object and for backward compatibility
const auth = {
  generateTokens,
  generateSessionId,
  authMiddleware,
  validateSession,
  authWithSessionValidation,
  verifyRefreshToken,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET
};

module.exports = auth;