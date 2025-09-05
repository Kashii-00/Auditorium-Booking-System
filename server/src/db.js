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


// Create connection pool with optimal security settings
const db = mysql.createPool({
  connectionLimit: 20, // Increased for better concurrency
  connectTimeout: 30000, // 30 seconds
  acquireTimeout: 30000,
  timeout: 60000, // 60 seconds - Query timeout for DoS prevention
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  timezone: process.env.DB_TIMEZONE,
  charset: 'utf8mb4', // Support all unicode characters
  // SECURITY: multipleStatements removed to prevent SQL injection attacks
  // multipleStatements: false, // Explicitly disabled (default is false)
  
  // Additional security configurations
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: true, // Always secure - for both localhost and production
    ca: process.env.DB_SSL_CA ? require('fs').readFileSync(process.env.DB_SSL_CA) : undefined,
    cert: process.env.DB_SSL_CERT ? require('fs').readFileSync(process.env.DB_SSL_CERT) : undefined,
    key: process.env.DB_SSL_KEY ? require('fs').readFileSync(process.env.DB_SSL_KEY) : undefined
  } : false,
  
  // Connection flags for security
  flags: ['-FOUND_ROWS'], // Disable FOUND_ROWS for better security
  
  // Query timeout to prevent DoS attacks
  queryTimeout: 30000, // 30 seconds max per query
});

// Database schema - organized by entity relationships

// Security: Input validation and sanitization utilities
const validator = require('validator');

// SQL Injection Protection: Whitelist allowed characters for different field types
const INPUT_VALIDATORS = {
  // Alphanumeric with basic punctuation
  general: /^[a-zA-Z0-9\s\-_.@,()]+$/,
  
  // Email validation (using validator.js)
  email: (input) => validator.isEmail(input),
  
  // Numeric fields
  numeric: /^[0-9]+$/,
  
  // Decimal numbers
  decimal: /^[0-9]+(\.[0-9]{1,2})?$/,
  
  // Date format (YYYY-MM-DD)
  date: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  
  // Phone numbers (international format)
  phone: /^[\+]?[0-9\s\-()]{7,15}$/,
  
  // Text fields (more permissive but safe)
  text: /^[a-zA-Z0-9\s\-_.@,()!?'"\/\\\n\r]+$/,
  
  // File paths (for uploaded files)
  filepath: /^[a-zA-Z0-9\s\-_./\\]+$/,
  
  // Search terms (more restrictive)
  search: /^[a-zA-Z0-9\s\-_.@]+$/
};

// Security: Input sanitization function
function sanitizeInput(input, type = 'general') {
  if (input === null || input === undefined) return null;
  
  // Convert to string and trim
  const sanitized = String(input).trim();
  
  // Length check to prevent DoS
  if (sanitized.length > 10000) {
    throw new Error('Input too long - potential DoS attack');
  }
  
  // Validate based on type
  if (type === 'email') {
    if (!INPUT_VALIDATORS.email(sanitized)) {
      throw new Error('Invalid email format');
    }
  } else if (INPUT_VALIDATORS[type]) {
    if (typeof INPUT_VALIDATORS[type] === 'function') {
      if (!INPUT_VALIDATORS[type](sanitized)) {
        throw new Error(`Invalid ${type} format`);
      }
    } else if (!INPUT_VALIDATORS[type].test(sanitized)) {
      throw new Error(`Invalid ${type} format`);
    }
  }
  
  return sanitized;
}

// Security: Enhanced query logging for monitoring
function logQuery(sql, values, executionTime, error = null) {
  const logData = {
    timestamp: new Date().toISOString(),
    sql: sql.replace(/\s+/g, ' ').trim(),
    parameterCount: values ? values.length : 0,
    executionTime: executionTime ? `${executionTime}ms` : 'N/A',
    success: !error
  };
  
  if (error) {
    logData.error = error.message;
    logger.error('🔴 SQL Query Failed:', logData);
  } else if (process.env.NODE_ENV === 'development') {
    logger.debug('🔍 SQL Query:', logData);
  }
  
  // Log slow queries in production
  if (executionTime > 1000) {
    logger.warn('🐌 Slow Query Detected:', logData);
  }
}

// Enhanced Promise wrapper for database queries with security features
function queryPromise(sql, values = []) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    // Security: Validate SQL query doesn't contain multiple statements
    if (sql.includes(';') && sql.trim().split(';').filter(s => s.trim()).length > 1) {
      const error = new Error('Multiple SQL statements not allowed');
      logQuery(sql, values, null, error);
      reject(error);
      return;
    }
    
    // Security: Check for dangerous SQL patterns
    const dangerousPatterns = [
      /\b(DROP|DELETE|TRUNCATE)\s+(?!.*WHERE)/i, // Only check WHERE clause for dangerous operations
      /\bunion\s+select/i,
      /\bxp_cmdshell/i,
      /\bsp_executesql/i,
      /\b--/,
      /\/\*.*\*\//
    ];
    
    const sqlLower = sql.toLowerCase();
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sqlLower) && !sql.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)/i)) {
        const error = new Error('Potentially dangerous SQL pattern detected');
        logQuery(sql, values, null, error);
        reject(error);
        return;
      }
    }
    
    db.query(sql, values, (error, results) => {
      const executionTime = Date.now() - startTime;
      
      if (error) {
        logQuery(sql, values, executionTime, error);
        reject(error);
      } else {
        logQuery(sql, values, executionTime);
        resolve(results);
      }
    });
  });
}

// Add promisified query method to the db object
db.queryPromise = queryPromise;

// Security: Add sanitization utilities to db object
db.sanitizeInput = sanitizeInput;
db.INPUT_VALIDATORS = INPUT_VALIDATORS;

// Enhanced transaction handling with security features
db.getConnectionPromise = function() {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        logger.error('Failed to get database connection:', err);
        reject(err);
      } else {
        // Add enhanced promisified methods to the connection
        connection.queryPromise = function(sql, values = []) {
          const startTime = Date.now();
          
          return new Promise((resolve, reject) => {
            // Apply same security checks as main queryPromise
            if (sql.includes(';') && sql.trim().split(';').filter(s => s.trim()).length > 1) {
              const error = new Error('Multiple SQL statements not allowed in transaction');
              logQuery(sql, values, null, error);
              reject(error);
              return;
            }
            
            this.query(sql, values, (err, results) => {
              const executionTime = Date.now() - startTime;
              
              if (err) {
                logQuery(sql, values, executionTime, err);
                reject(err);
              } else {
                logQuery(sql, values, executionTime);
                resolve(results);
              }
            });
          });
        };
        
        connection.beginTransactionPromise = function() {
          return new Promise((resolve, reject) => {
            logger.debug('🔄 Starting database transaction');
            this.beginTransaction(err => {
              if (err) {
                logger.error('Failed to begin transaction:', err);
                reject(err);
              } else {
                logger.debug('✅ Transaction started successfully');
                resolve();
              }
            });
          });
        };
        
        connection.commitPromise = function() {
          return new Promise((resolve, reject) => {
            logger.debug('💾 Committing database transaction');
            this.commit(err => {
              if (err) {
                logger.error('Failed to commit transaction:', err);
                reject(err);
              } else {
                logger.debug('✅ Transaction committed successfully');
                resolve();
              }
            });
          });
        };
        
        connection.rollbackPromise = function() {
          return new Promise((resolve, reject) => {
            logger.warn('🔄 Rolling back database transaction');
            this.rollback((err) => {
              if (err) {
                logger.error('Failed to rollback transaction:', err);
              } else {
                logger.debug('✅ Transaction rolled back successfully');
              }
              // Always resolve rollback to ensure cleanup
              resolve();
            });
          });
        };
        
        // Enhanced connection release with logging
        const originalRelease = connection.release;
        connection.release = function() {
          logger.debug('🔓 Releasing database connection');
          originalRelease.call(this);
        };
        
        resolve(connection);
      }
    });
  });
};

// Security: Safe batch operation utility
db.safeBatchOperation = async function(operations) {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error('Operations must be a non-empty array');
  }
  
  if (operations.length > 100) {
    throw new Error('Too many operations - potential DoS attack');
  }
  
  const connection = await this.getConnectionPromise();
  
  try {
    await connection.beginTransactionPromise();
    
    const results = [];
    for (const operation of operations) {
      if (!operation.sql || !Array.isArray(operation.values)) {
        throw new Error('Invalid operation format');
      }
      
      const result = await connection.queryPromise(operation.sql, operation.values);
      results.push(result);
    }
    
    await connection.commitPromise();
    logger.info(`✅ Batch operation completed successfully (${operations.length} operations)`);
    return results;
    
  } catch (error) {
    await connection.rollbackPromise();
    logger.error('❌ Batch operation failed:', error);
    throw error;
  } finally {
    connection.release();
  }
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

// Initial connection test with security validation
db.query('SELECT 1', (err) => {
  if (err) {
    console.error('Database connection failed:', err);
    logger.error('❌ Database connection failed:', err);
  } else {
    logger.info('');
    logger.info(`🛜 Connection to Database ${process.env.DB_DATABASE} Successful ✅`);
    logger.info(`🏠 DB HOST: ${process.env.DB_HOST}`);
    logger.info('');
  }
});

// Export enhanced database object with security features
module.exports = db;
