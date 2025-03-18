const moment = require('moment');
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const authMiddleware = require('../auth');

const db = require('../db');

// POST endpoint to create a booking, now including description
router.post('/', authMiddleware, (req, res) => {
  const user_name = req.user.name;
  const { user_id,booking_date, booking_time, bookingendtime, no_of_people, description } = req.body;

  const sql = `INSERT INTO bookings (user_id, booking_date, booking_time, bookingendtime, no_of_people, description) 
               VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [user_id, booking_date, booking_time, bookingendtime, no_of_people, description], (err, result) => {
    if (err) {
      logger.info('Error inserting booking:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Booking created successfully at: ${logintime} by user: ${user_name}`);
    
    return res.json({ success: true, message: 'Booking created successfully', bookingId: result.insertId });
  });
});


// GET endpoint to retrieve bookings
router.get('/', (req, res) => {
  const sql = `SELECT b.*, u.name, u.email, u.phone 
               FROM bookings b
               JOIN users u ON b.user_id = u.id`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    return res.json(results);
  });
});

// PUT endpoint to update booking status
router.put('/:id', authMiddleware, (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;
  const user_name = req.user.name;

  const sql = 'UPDATE bookings SET status = ? WHERE id = ?';
  db.query(sql, [status, bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Updated Booking Status to: ${status} at: ${logintime} By: ${user_name}`);
    logger.info(`Updated Booking ID: ${bookingId}`);

    return res.json({ success: true, message: 'Booking status updated' });
  });
});

// DELETE endpoint to remove a booking
router.delete('/:id',authMiddleware,(req, res) => {
  const bookingId = req.params.id;
  const user_name = req.user.name;

  const sql = 'DELETE FROM bookings WHERE id = ?';
  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Booking Deleted at: ${logintime} By: ${user_name}`);
    logger.info(`Deleted Booking ID: ${bookingId}`);
    return res.json({ success: true, message: 'Booking deleted' });
  });
});

// Clear logs every 24h (86400000ms)
setInterval(() => {
  console.clear(); // clear PowerShell or terminal
  logger.info('🔄 Logs cleared - 24h cycle restart');
}, 24 * 60 * 60 * 1000);

module.exports = router;
