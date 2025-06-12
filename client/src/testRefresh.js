const axios = require('axios');

// Configure axios for cookies
axios.defaults.withCredentials = true;

// Counter for refresh attempts
let refreshCount = 0;
const MAX_ATTEMPTS = 3;

// Simulate login
const login = async () => {
  try {
    const response = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Login successful');
    return response.data.accessToken;
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
};

// Test refresh token
const testRefresh = async () => {
  try {
    if (refreshCount >= MAX_ATTEMPTS) {
      console.log('Maximum refresh attempts reached. Stopping test.');
      return;
    }
    
    refreshCount++;
    console.log(`Refresh attempt ${refreshCount}`);
    
    const response = await axios.post('http://localhost:5003/api/auth/refresh');
    
    console.log('Refresh successful:', response.data);
    
    // Wait and try again
    setTimeout(testRefresh, 1000);
  } catch (error) {
    console.error('Refresh error:', error.message);
  }
};

// Main test sequence
const runTest = async () => {
  console.log('Starting refresh token test sequence');
  
  // First login
  const token = await login();
  
  if (!token) {
    console.log('Test aborted - could not login');
    return;
  }
  
  // Then test refresh
  console.log('Starting refresh tests in 1 second...');
  setTimeout(testRefresh, 1000);
};

runTest();
