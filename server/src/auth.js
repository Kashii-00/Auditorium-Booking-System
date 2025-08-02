const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration settings for JWTs
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "KASHIKA2006LK_ACCESS";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "KASHIKA2006LK_REFRESH";

// Generate tokens with specific expirations
const generateTokens = (userData) => {
  // Access token - short lived (15 minutes)
  const accessToken = jwt.sign(userData, ACCESS_TOKEN_SECRET, {
    expiresIn: '15m'
  });
  
  // Refresh token - longer lived (30 days)
  const refreshToken = jwt.sign(userData, REFRESH_TOKEN_SECRET, {
    expiresIn: '30d'
  });
  
  return { accessToken, refreshToken };
};

// Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = decoded;
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

// Export both as an object and for backward compatibility
const auth = {
  generateTokens,
  authMiddleware,
  verifyRefreshToken,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET
};

module.exports = auth;