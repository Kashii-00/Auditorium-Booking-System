"use strict";

/**
 * This script automatically fixes auth middleware issues in route files
 */
const fs = require('fs');
const path = require('path');

// Get all route files
const routesDir = path.join(__dirname, 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
console.log('Checking route files for auth middleware issues...');
let changedFiles = 0;
for (const file of routeFiles) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Check if the file imports auth properly
  if (!content.includes('const auth = require') && content.includes('authMiddleware')) {
    console.log(`[${file}] Missing auth import, adding it...`);

    // Add the import
    content = content.replace(/(const .+ = require\('[^']+'\);[\r\n]+)+(.*)/, '$1const auth = require(\'../auth\');\n\n$2');
  }

  // Fix router.METHOD(..., authMiddleware, ...) to router.METHOD(..., auth.authMiddleware, ...)
  const routerMethods = ['get', 'post', 'put', 'delete', 'patch'];
  for (const method of routerMethods) {
    const pattern = new RegExp(`router\\.${method}\\s*\\([^)]*authMiddleware(?!\\.)[^)]*\\)`, 'g');
    if (pattern.test(content)) {
      console.log(`[${file}] Found direct authMiddleware usage in router.${method}, fixing...`);
      content = content.replace(new RegExp(`(router\\.${method}\\s*\\()([^)]*)authMiddleware((?!\\.)[^)]*)\\)`, 'g'), '$1$2auth.authMiddleware$3)');
    }
  }

  // Save if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`[${file}] Updated.`);
    changedFiles++;
  }
}
console.log(`Done. Fixed ${changedFiles} file(s).`);