const moment = require('moment');
const express = require('express');
const router = express.Router();

const db = require('../db');
const authMiddleware = require('../auth'); 

// POST endpoint to create a booking
router.post('/', authMiddleware, (req, res) => {
  const { user_id, booking_date, booking_time, bookingendtime, no_of_people, description } = req.body;
  const sql = `INSERT INTO bookings (user_id, booking_date, booking_time, bookingendtime, no_of_people, description) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [user_id, booking_date, booking_time, bookingendtime, no_of_people, description], (err, result) => {
    if (err) {
      console.error('Error inserting booking:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log('Booking created successfully at :', logintime, "by :", req.user.name); // ✅ Fixed
    return res.json({ success: true, message: 'Booking created successfully', bookingId: result.insertId });
  });
});

// GET endpoint (no auth needed here unless you want to restrict)
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
  const sql = 'UPDATE bookings SET status = ? WHERE id = ?';
  db.query(sql, [status, bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log('Updated Booking Status to', status, 'at :', logintime, 'by :', req.user.name); // ✅ Fixed
    console.log('Updated Booking ID :', bookingId);
    return res.json({ success: true, message: 'Booking status updated' });
  });
});

// DELETE endpoint to remove a booking
router.delete('/:id', authMiddleware, (req, res) => {
  const bookingId = req.params.id;
  const sql = 'DELETE FROM bookings WHERE id = ?';
  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log('Booking', bookingId, 'deleted at :', logintime, 'by :', req.user.name); // ✅ Fixed
    return res.json({ success: true, message: 'Booking deleted' });
  });
});

module.exports = router;
