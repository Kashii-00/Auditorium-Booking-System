const mysql = require('mysql2');

// Database connection config
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your password here
  database: 'auditorium_booking' // Your database name
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  
  console.log('Connected to database...');
  
  // Remove batch_name column if it exists
  connection.query('ALTER TABLE batches DROP COLUMN IF EXISTS batch_name', (error, results) => {
    if (error) {
      console.error('Error removing batch_name column:', error);
    } else {
      console.log('✅ batch_name column removed successfully');
    }
    
    connection.end();
  });
}); 