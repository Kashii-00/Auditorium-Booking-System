const fs = require('fs');
const path = require('path');

// Get all route files
const routesDir = path.join(__dirname, 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

console.log('\n=== Route Validator ===\n');

let hasErrors = false;

routeFiles.forEach(file => {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  console.log(`Checking ${file}...`);
  
  // Find router definitions and middleware usage
  const routeMethods = ['get', 'post', 'put', 'delete', 'patch'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for route definitions
    for (const method of routeMethods) {
      const routeRegex = new RegExp(`router\\.${method}\\s*\\(\\s*(['"\`][^'"\`]*['"\`]|[^,)]+)\\s*,\\s*([^,)]+)`, 'i');
      const match = line.match(routeRegex);
      
      if (match) {
        const path = match[1].trim();
        const middleware = match[2].trim();
        
        if (middleware === 'authMiddleware' || middleware.includes('authMiddleware') && !middleware.includes('auth.authMiddleware')) {
          console.log(`  Line ${i + 1}: Route ${method.toUpperCase()} ${path} uses standalone 'authMiddleware'`);
          console.log(`    Should be 'auth.authMiddleware'`);
          hasErrors = true;
        }
      }
    }
    
    // Check for incorrect middleware reference
    if (line.includes('authMiddleware') && !line.includes('auth.authMiddleware') && !line.includes('const authMiddleware')) {
      console.log(`  Line ${i + 1}: Possible incorrect middleware reference: ${line}`);
      hasErrors = true;
    }
  }
});

if (!hasErrors) {
  console.log('\n✓ All routes appear to be correctly defined');
} else {
  console.log('\n✗ Found potential issues in route definitions');
  console.log('\nFix by changing:');
  console.log('  authMiddleware -> auth.authMiddleware');
}

console.log('\n=== End of Route Validator ===\n');
