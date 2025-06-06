const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runMigration() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'add_document_fields_to_students.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await db.query(sql);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    // Close the database connection if necessary
    // If your db module has a proper end/close method
    if (typeof db.end === 'function') {
      await db.end();
    }
  }
}

runMigration();
