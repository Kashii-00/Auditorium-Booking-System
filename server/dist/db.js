require('dotenv').config();
const mysql = require('mysql');
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  timezone: process.env.DB_TIMEZONE
});
setInterval(() => {
  db.query('SELECT 1', err => {
    if (err) {
      console.error('DB KEEP ALIVE FAILED:', err);
    } else {
      console.log('DB KEEP ALIVE SUCCESSFUL');
    }
  });
}, 60000);
db.query('SELECT 1', err => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database');
    console.log('DB_HOST:', process.env.DB_HOST);
  }
});
module.exports = db;