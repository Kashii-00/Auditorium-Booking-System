"use strict";

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
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        courseId VARCHAR(50) UNIQUE NOT NULL,
        stream VARCHAR(100) NOT NULL,
        courseName VARCHAR(255) NOT NULL,
        medium JSON NOT NULL,
        location JSON NOT NULL,
        assessmentCriteria JSON NOT NULL,
        resources JSON NOT NULL,
        fees DECIMAL(10,2) NOT NULL,
        registrationFee DECIMAL(10,2) NOT NULL,
        installment1 DECIMAL(10,2) DEFAULT NULL,
        installment2 DECIMAL(10,2) DEFAULT NULL,
        additionalInstallments LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`;
const createLecturerTableQuery = `
    CREATE TABLE IF NOT EXISTS lecturers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        category VARCHAR(100),
        grade VARCHAR(100),
        stream VARCHAR(100),
        module VARCHAR(100),
        nic_file VARCHAR(255),
        photo_file VARCHAR(255),
        passbook_file VARCHAR(255),
        education_certificate_file VARCHAR(255),
        cdc_book_file VARCHAR(255),
        driving_trainer_license_file VARCHAR(255),
        other_documents_file VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
    )
`;
const createRefreshTokenTableQuery = `
  CREATE TABLE IF NOT EXISTS user_refresh_tokens (
    user_id INT PRIMARY KEY,
    refresh_token VARCHAR(512) NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;
db.query(createTableQuery, (err, result) => {
  if (err) console.error("Error creating table:", err);else console.log("Courses table is ready.");
});
db.query(createLecturerTableQuery, (err, result) => {
  if (err) {
    console.error("Error creating lecturers table:", err);
  } else {
    console.log("Lecturers table is ready.");
  }
});
db.query(createRefreshTokenTableQuery, (err, result) => {
  if (err) {
    console.error("Error creating user_refresh_tokens table:", err);
  } else {
    console.log("user_refresh_tokens table is ready.");
  }
});

// Keep DB connection alive every hour
setInterval(() => {
  db.query('SELECT 1', err => {
    if (err) {
      logger.error('❌ DB KEEP ALIVE FAILED:', err);
    } else {
      logger.info('✅ DB KEEP ALIVE SUCCESSFUL');
    }
  });
}, 60 * 60 * 1000);

// Log rotation every 24 hours
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
    logger.info(`DB HOST: ${process.env.DB_HOST}`);
  }
});
module.exports = db;