const moment = require('moment');
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST endpoint to create a booking, now including description
router.post('/', (req, res) => {
  const {
    user_id,
    booking_date,
    booking_time,
    bookingendtime,
    no_of_people,
    description
  } = req.body;
  const insertSql = `INSERT INTO bookings (user_id, booking_date, booking_time, bookingendtime, no_of_people, description) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(insertSql, [user_id, booking_date, booking_time, bookingendtime, no_of_people, description], (err, result) => {
    if (err) {
      console.error('Error inserting booking:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }

    // Now fetch the user name from the users table
    const userSql = `SELECT name FROM users WHERE id = ?`;
    db.query(userSql, [user_id], (userErr, userResult) => {
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      if (userErr || userResult.length === 0) {
        console.warn('Booking created, but failed to fetch user name');
        console.log('Booking created at:', logintime, 'by user_id:', user_id);
      } else {
        const userName = userResult[0].name;
        console.log('Booking created at:', logintime, 'by:', userName);
      }
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
    if (err) {
      return res.status(500).json({
        error: 'Database error'
      });
    }
    return res.json(results);
  });
});

// PUT endpoint to update booking status
router.put('/:id', (req, res) => {
  const bookingId = req.params.id;
  const {
    status
  } = req.body;
  const sql = 'UPDATE bookings SET status = ? WHERE id = ?';
  db.query(sql, [status, bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log('Updated Booking Status at :', logintime);
    console.log('Updated Booking ID :', bookingId);
    return res.json({
      success: true,
      message: 'Booking status updated'
    });
  });
});

// DELETE endpoint to remove a booking
router.delete('/:id', (req, res) => {
  const bookingId = req.params.id;
  const sql = 'DELETE FROM bookings WHERE id = ?';
  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log('Booking ', bookingId, 'deleted at :', logintime);
    return res.json({
      success: true,
      message: 'Booking deleted'
    });
  });
});
module.exports = router;