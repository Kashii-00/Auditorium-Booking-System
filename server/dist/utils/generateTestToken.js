"use strict";

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Get secrets from .env
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

// Create a test user payload
const testUser = {
  id: 75,
  // Use an existing user ID from your database
  name: 'AccessTokenAdmin',
  email: 'SuperAdmin@gmail.com',
  role: ['SuperAdmin'] // Add appropriate roles for testing
};

// Generate tokens
const accessToken = jwt.sign(testUser, ACCESS_TOKEN_SECRET, {
  expiresIn: '1h'
});
const refreshToken = jwt.sign(testUser, REFRESH_TOKEN_SECRET, {
  expiresIn: '7d'
});
console.log('\n=== TEST TOKENS ===\n');
console.log(`Access Token (expires in 1 hour):\n${accessToken}\n`);
console.log(`Refresh Token (expires in 7 days):\n${refreshToken}\n`);
console.log('For testing with curl:');
console.log(`curl -H "Authorization: Bearer ${accessToken}" http://localhost:5003/api/students\n`);