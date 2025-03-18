require('dotenv').config();
const mysql = require('mysql');
const logger = require('./logger');
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  timezone: process.env.DB_TIMEZONE
});

// Keep DB connection alive every 10 minutes
setInterval(() => {
  db.query('SELECT 1', err => {
    if (err) {
      logger.error('❌ DB KEEP ALIVE FAILED:', err);
    } else {
      logger.info('✅ DB KEEP ALIVE SUCCESSFUL');
    }
  });
}, 10 * 60 * 1000);

// Clear logs every 24 hours
setInterval(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.clear();
  }
  logger.info('🔄 Logs cleared - 24h cycle restart');
}, 24 * 60 * 60 * 1000);
db.query('SELECT 1', err => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    logger.info('Connected to MySQL database');
    logger.info('DB_HOST:', process.env.DB_HOST);
  }
});
module.exports = db;