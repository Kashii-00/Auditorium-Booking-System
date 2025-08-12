require('dotenv').config();
const mysql = require('mysql');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Create necessary directories - Fixed to create inside server folder
['uploads', 'uploads/students', 'uploads/lecturers', 'uploads/courses'].forEach(dir => {
  ensureDirectoryExists(path.join(__dirname, '..', dir));
});

// Create connection pool with optimal settings
const db = mysql.createPool({
  connectionLimit: 20, // Increased for better concurrency
  connectTimeout: 30000, // 30 seconds
  acquireTimeout: 30000,
  timeout: 60000, // 60 seconds
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  timezone: process.env.DB_TIMEZONE,
  charset: 'utf8mb4', // Support all unicode characters
  multipleStatements: true, // Allow multiple statements for transactions
});

// Database schema - organized by entity relationships


// Promise wrapper for database queries
function queryPromise(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Add promisified query method to the db object
db.queryPromise = queryPromise;

// Add connection promise methods for transaction handling
db.getConnectionPromise = function() {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        // Add promisified methods to the connection
        connection.queryPromise = function(sql, values) {
          return new Promise((resolve, reject) => {
            this.query(sql, values, (err, results) => {
              if (err) {
                reject(err);
              } else {
                resolve(results);
              }
            });
          });
        };
        
        connection.beginTransactionPromise = function() {
          return new Promise((resolve, reject) => {
            this.beginTransaction(err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        };
        
        connection.commitPromise = function() {
          return new Promise((resolve, reject) => {
            this.commit(err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        };
        
        connection.rollbackPromise = function() {
          return new Promise((resolve, reject) => {
            this.rollback(() => {
              // Always resolve rollback to ensure cleanup
              resolve();
            });
          });
        };
        
        resolve(connection);
      }
    });
  });
};


// Keep connection alive
setInterval(() => {
  db.query('SELECT 1', (err) => {
    if (err) {
      logger.error('❌ DB KEEP ALIVE FAILED:', err);
    } else {
      logger.debug('✅ DB KEEP ALIVE SUCCESSFUL');
    }
  });
}, 60 * 60 * 1000); // Every hour

// Initial connection test
db.query('SELECT 1', (err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    logger.info('');
    logger.info(`Connection to Database ${process.env.DB_DATABASE} 🛜 Successful ✅`);
    logger.info(`DB HOST: ${process.env.DB_HOST} 🛜`);
    logger.info('');
  }
});

module.exports = db;
