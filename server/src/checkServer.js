const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 5003;

console.log('Checking server configuration...');

// Check for crucial environment variables
console.log('\n--- Environment Variables ---');
console.log(`PORT: ${process.env.PORT || 'Not set, using default 5003'}`);
console.log(`DB_HOST: ${process.env.DB_HOST || 'Not set!'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'Not set!'}`);
console.log(`DB_DATABASE: ${process.env.DB_DATABASE || 'Not set!'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set (hidden for security)' : 'Not set!'}`);
console.log(`JWT_ACCESS_SECRET: ${process.env.JWT_ACCESS_SECRET ? 'Set (hidden for security)' : 'Not set!'}`);
console.log(`JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? 'Set (hidden for security)' : 'Not set!'}`);

// Check if auth.js has correct exports
console.log('\n--- Checking auth.js ---');
try {
  const authPath = path.join(__dirname, 'auth.js');
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  if (authContent.includes('module.exports = authMiddleware')) {
    console.log('✓ auth.js exports middleware function correctly');
  } else {
    console.log('✗ auth.js might not export the middleware function correctly');
    console.log('Recommendation: Ensure auth.js exports authMiddleware function');
  }
} catch (error) {
  console.log(`✗ Error checking auth.js: ${error.message}`);
}

// Check if routes are using the auth middleware correctly
console.log('\n--- Checking routes ---');
const routesDir = path.join(__dirname, 'routes');
try {
  const files = fs.readdirSync(routesDir);
  
  for (const file of files) {
    if (file.endsWith('.js')) {
      const routeContent = fs.readFileSync(path.join(routesDir, file), 'utf8');
      
      if (routeContent.includes('router.post(') || 
          routeContent.includes('router.get(') || 
          routeContent.includes('router.put(') || 
          routeContent.includes('router.delete(')) {
        
        console.log(`Checking ${file}...`);
        
        if (routeContent.includes('authMiddleware,')) {
          console.log(`✓ ${file} uses authMiddleware correctly`);
        } else {
          console.log(`⚠ ${file} might not use authMiddleware correctly`);
        }
      }
    }
  }
} catch (error) {
  console.log(`✗ Error checking routes: ${error.message}`);
}

// Check if the server is running
console.log('\n--- Checking if server is running ---');
const req = http.request({
  host: '10.70.4.34 ',
  port: PORT,
  path: '/',
  method: 'GET',
  timeout: 2000
}, (res) => {
  console.log(`✓ Server is running on port ${PORT}`);
  console.log(`Status code: ${res.statusCode}`);
  process.exit(0);
});

req.on('error', (error) => {
  console.log(`✗ Server is not running on port ${PORT}`);
  console.log(`Error: ${error.message}`);
  console.log('Make sure you start the server with: npm run dev');
  process.exit(1);
});

req.on('timeout', () => {
  console.log(`✗ Request timed out trying to connect to port ${PORT}`);
  console.log('Make sure your server is running');
  req.destroy();
  process.exit(1);
});

req.end();

/**
 * Server Diagnostic Tool
 * 
 * Run this with: node src/checkServer.js
 * This will help diagnose common issues with the server setup
 */

const { execSync } = require('child_process');

console.log('\n============ SERVER DIAGNOSTICS ============\n');

// 1. Check if nodemon.json exists and is valid JSON
console.log('Checking nodemon.json configuration...');
const nodemonPath = path.join(__dirname, '..', 'nodemon.json');

try {
  if (fs.existsSync(nodemonPath)) {
    try {
      const nodemonConfig = fs.readFileSync(nodemonPath, 'utf8');
      JSON.parse(nodemonConfig);
      console.log('✅ nodemon.json exists and contains valid JSON');
    } catch (err) {
      console.log('❌ nodemon.json exists but contains INVALID JSON');
      
      // Create a fixed nodemon.json
      const fixedConfig = {
        "restartable": "rs",
        "ignore": [".git", "node_modules/**/node_modules", "dist"],
        "verbose": true,
        "watch": ["src/"],
        "ext": "js,json,ts"
      };
      
      console.log('Creating a new nodemon.json with valid configuration...');
      fs.writeFileSync(nodemonPath, JSON.stringify(fixedConfig, null, 2), 'utf8');
      console.log('✅ Fixed nodemon.json created');
    }
  } else {
    console.log('❌ nodemon.json does not exist');
    
    // Create a new nodemon.json
    const newConfig = {
      "restartable": "rs",
      "ignore": [".git", "node_modules/**/node_modules", "dist"],
      "verbose": true,
      "watch": ["src/"],
      "ext": "js,json,ts"
    };
    
    console.log('Creating nodemon.json...');
    fs.writeFileSync(nodemonPath, JSON.stringify(newConfig, null, 2), 'utf8');
    console.log('✅ nodemon.json created');
  }
} catch (err) {
  console.error('Error checking nodemon.json:', err);
}

// 2. Check if .babelrc exists and is valid JSON
console.log('\nChecking .babelrc configuration...');
const babelrcPath = path.join(__dirname, '..', '.babelrc');

try {
  if (fs.existsSync(babelrcPath)) {
    try {
      const babelConfig = fs.readFileSync(babelrcPath, 'utf8');
      JSON.parse(babelConfig);
      console.log('✅ .babelrc exists and contains valid JSON');
    } catch (err) {
      console.log('❌ .babelrc exists but contains INVALID JSON');
      
      // Create a fixed .babelrc
      const fixedConfig = {
        "presets": [
          [
            "@babel/preset-env",
            {
              "targets": {
                "node": "current"
              }
            }
          ]
        ]
      };
      
      console.log('Creating a new .babelrc with valid configuration...');
      fs.writeFileSync(babelrcPath, JSON.stringify(fixedConfig, null, 2), 'utf8');
      console.log('✅ Fixed .babelrc created');
    }
  } else {
    console.log('❌ .babelrc does not exist');
    
    // Create a new .babelrc
    const newConfig = {
      "presets": [
        [
          "@babel/preset-env",
          {
            "targets": {
              "node": "current"
            }
          }
        ]
      ]
    };
    
    console.log('Creating .babelrc...');
    fs.writeFileSync(babelrcPath, JSON.stringify(newConfig, null, 2), 'utf8');
    console.log('✅ .babelrc created');
  }
} catch (err) {
  console.error('Error checking .babelrc:', err);
}

// 3. Check if required packages are installed
console.log('\nChecking for required packages...');

const requiredPackages = [
  '@babel/cli',
  '@babel/core',
  '@babel/preset-env',
  'nodemon'
];

try {
  const installedPackages = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).dependencies || {};
  const installedDevPackages = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).devDependencies || {};
  
  const missingPackages = requiredPackages.filter(pkg => 
    !installedPackages[pkg] && !installedDevPackages[pkg]
  );
  
  if (missingPackages.length > 0) {
    console.log(`❌ Missing required packages: ${missingPackages.join(', ')}`);
    console.log('Please install these packages with:');
    console.log(`npm install --save-dev ${missingPackages.join(' ')}`);
  } else {
    console.log('✅ All required packages are installed');
  }
} catch (err) {
  console.error('Error checking packages:', err);
}

console.log('\n============ DIAGNOSTIC COMPLETE ============\n');
console.log('Run the server with: npm run dev');
