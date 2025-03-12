const moment = require('moment');
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST endpoint to create a booking
router.post('/', (req, res) => {
  const {
    user_id,
    booking_date,
    booking_time,
    bookingendtime,
    no_of_people,
    description
  } = req.body;

  // First get the user's name
  const getUserSql = 'SELECT name FROM users WHERE id = ?';
  db.query(getUserSql, [user_id], (err, userResult) => {
    if (err || userResult.length === 0) {
      console.error('Error fetching user for booking:', err);
      return res.status(500).json({
        error: 'User not found'
      });
    }
    const username = userResult[0].name;
    const insertSql = `INSERT INTO bookings (user_id, booking_date, booking_time, bookingendtime, no_of_people, description) 
                       VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(insertSql, [user_id, booking_date, booking_time, bookingendtime, no_of_people, description], (err, result) => {
      if (err) {
        console.error('Error inserting booking:', err);
        return res.status(500).json({
          error: 'Database error'
        });
      }
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      console.log('Booking created successfully at:', logintime, 'by:', username);
      return res.json({
        success: true,
        message: 'Booking created successfully',
        bookingId: result.insertId
      });
    });
  });
});

// GET endpoint to retrieve bookings
router.get('/', (req, res) => {
  const sql = `SELECT b.*, u.name, u.email, u.phone 
               FROM bookings b
               JOIN users u ON b.user_id = u.id`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({
      error: 'Database error'
    });
    return res.json(results);
  });
});

// PUT endpoint to update booking status
router.put('/:id', (req, res) => {
  const bookingId = req.params.id;
  const {
    status,
    user_id
  } = req.body;

  // First get the user's name
  const getUserSql = 'SELECT name FROM users WHERE id = ?';
  db.query(getUserSql, [user_id], (err, userResult) => {
    if (err || userResult.length === 0) {
      console.error('Error fetching user for status update:', err);
      return res.status(500).json({
        error: 'User not found'
      });
    }
    const username = userResult[0].name;
    const sql = 'UPDATE bookings SET status = ? WHERE id = ?';
    db.query(sql, [status, bookingId], (err, result) => {
      if (err) return res.status(500).json({
        error: 'Database error'
      });
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      console.log(`Updated Booking Status to '${status}' at: ${logintime} by: ${username}`);
      return res.json({
        success: true,
        message: 'Booking status updated'
      });
    });
  });
});

// DELETE endpoint to remove a booking
router.delete('/:id', (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user?.id; // Assumes auth middleware is used

  const userSql = 'SELECT name FROM users WHERE id = ?';
  db.query(userSql, [userId], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(500).json({
        error: 'Failed to fetch user'
      });
    }
    const username = userResult[0].name;
    const sql = 'DELETE FROM bookings WHERE id = ?';
    db.query(sql, [bookingId], (err, result) => {
      if (err) return res.status(500).json({
        error: 'Database error'
      });
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      console.log(`Booking ${bookingId} deleted at: ${logintime} by: ${username}`);
      return res.json({
        success: true,
        message: 'Booking deleted'
      });
    });
  });
});
module.exports = router;