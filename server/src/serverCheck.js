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
let envOk = true;

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.log(`${colors.yellow}⚠️  Missing ${envVar} environment variable${colors.reset}`);
    envOk = false;
  } else {
    console.log(`✅ ${envVar} is set`);
  }
});

if (envOk) {
  console.log(`${colors.green}✅ All required environment variables are set\n${colors.reset}`);
} else {
  console.log(`${colors.yellow}⚠️  Some environment variables are missing\n${colors.reset}`);
}

// 2. Check route files for proper middleware usage
console.log(`${colors.cyan}CHECKING ROUTE FILES${colors.reset}`);
const routesDir = path.join(__dirname, 'routes');

try {
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
  let routesOk = true;
  
  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    console.log(`Checking ${file}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file imports auth properly
    if (!content.includes('const auth = require') && content.includes('authMiddleware')) {
      console.log(`${colors.yellow}⚠️  ${file} may be missing auth import${colors.reset}`);
      routesOk = false;
    }
    
    // Check if the file uses auth.authMiddleware or mistakenly uses authMiddleware directly
    if (content.includes('router.') && content.includes('authMiddleware') && !content.includes('auth.authMiddleware')) {
      console.log(`${colors.yellow}⚠️  ${file} appears to use authMiddleware directly instead of auth.authMiddleware${colors.reset}`);
      routesOk = false;
    }
  });
  
  if (routesOk) {
    console.log(`${colors.green}✅ All route files appear to be correctly configured\n${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Some route files may have issues\n${colors.reset}`);
  }
} catch (err) {
  console.log(`${colors.red}❌ Error checking route files: ${err.message}\n${colors.reset}`);
}

// 3. Check server connectivity
console.log(`${colors.cyan}CHECKING SERVER CONNECTIVITY${colors.reset}`);
const serverPort = process.env.PORT || 5007;

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
