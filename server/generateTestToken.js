const jwt = require('jsonwebtoken');
require('dotenv').config();

// Grab secrets
const ACCESS_TOKEN_SECRET  = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  console.error('❌ Missing JWT_ACCESS_SECRET or JWT_REFRESH_SECRET in your .env');
  process.exit(1);
}

// Test payload
const testUser = { id: 75, name: 'AccessTokenAdmin', email: 'SuperAdmin@gmail.com', role: ['SuperAdmin'] };

// Generate
const accessToken  = jwt.sign(testUser, ACCESS_TOKEN_SECRET,  { expiresIn: '1h' });
const refreshToken = jwt.sign(testUser, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

console.log('\n=== TEST TOKENS ===\n');
console.log(`Access Token:\n${accessToken}\n`);
console.log(`Refresh Token:\n${refreshToken}\n`);
