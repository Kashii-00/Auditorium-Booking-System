const fs = require('fs');
const path = require('path');

// Get all route files
const routesDir = path.join(__dirname, 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

console.log('\n=== Route Fixer ===\n');
let fixedFiles = 0;

routeFiles.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  console.log(`Processing ${file}...`);
  
  // Check if auth is properly imported
  if (!content.includes('const auth = require(') && content.includes('authMiddleware')) {
    // Add auth import if needed
    console.log(`  Adding auth import to ${file}`);
    content = content.replace(
      /(const .+ = require\('[^']+'\);?(?:\n|\r\n)+)+/,
      `$&const auth = require('../auth');\n`
    );
  }
  
  // Fix standalone authMiddleware
  content = content.replace(
    /router\.(get|post|put|delete|patch)\s*\(\s*(['"`][^'"`]*['"`]|[^,)]+)\s*,\s*authMiddleware\s*,/g,
    `router.$1($2, auth.authMiddleware,`
  );
  
  // Save if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ Fixed ${file}`);
    fixedFiles++;
  } else {
    console.log(`  ✓ No issues found in ${file}`);
  }
});

if (fixedFiles > 0) {
  console.log(`\n✓ Fixed issues in ${fixedFiles} file(s)`);
} else {
  console.log('\n✓ No issues found');
}

console.log('\n=== End of Route Fixer ===\n');
