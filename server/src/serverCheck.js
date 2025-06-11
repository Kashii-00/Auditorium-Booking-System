const fs = require('fs');
const path = require('path');
const http = require('http');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.blue}===== SERVER DIAGNOSTICS TOOL =====\n${colors.reset}`);

// 1. Check environment variables
console.log(`${colors.cyan}CHECKING ENVIRONMENT VARIABLES${colors.reset}`);
const requiredEnvVars = ['PORT', 'DB_HOST', 'DB_USER', 'DB_DATABASE', 'JWT_SECRET'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.log(`${colors.yellow}⚠️  Missing ${envVar} environment variable${colors.reset}`);
  }
});

// 2. Check server connectivity
console.log(`${colors.cyan}CHECKING SERVER CONNECTIVITY${colors.reset}`);
const serverPort = process.env.PORT || 5003;

const checkServer = () => {
  const req = http.request({
    hostname: '10.70.4.34',
    port: serverPort,
    path: '/api/health',
    method: 'GET',
    timeout: 2000
  }, (res) => {
    console.log(`${colors.green}✅ Server is running on port ${serverPort}`);
    console.log(`✅ Status code: ${res.statusCode}${colors.reset}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`✅ Response: ${JSON.stringify(response)}`);
      } catch (e) {
        console.log(`${colors.yellow}⚠️  Could not parse response: ${data}${colors.reset}`);
      }
      console.log(`${colors.blue}\n===== DIAGNOSTICS COMPLETE =====\n${colors.reset}`);
    });
  });
  
  req.on('error', (error) => {
    console.log(`${colors.red}❌ Server is not running on port ${serverPort}`);
    console.log(`❌ Error: ${error.message}`);
    console.log(`${colors.yellow}Make sure you start the server with: npm run dev${colors.reset}`);
    console.log(`${colors.blue}\n===== DIAGNOSTICS COMPLETE =====\n${colors.reset}`);
  });
  
  req.on('timeout', () => {
    console.log(`${colors.red}❌ Request timed out trying to connect to port ${serverPort}`);
    console.log(`${colors.yellow}Make sure your server is running${colors.reset}`);
    console.log(`${colors.blue}\n===== DIAGNOSTICS COMPLETE =====\n${colors.reset}`);
    req.destroy();
  });
  
  req.end();
};

// Add a delay before checking server to avoid running too early
setTimeout(checkServer, 1000);
