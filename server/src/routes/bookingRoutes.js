const moment = require('moment');
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const auth = require('../auth');
const db = require('../db');

router.post('/', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/bookings`);
  console.log('Auditorium Reservation POST body 📆 :', req.body);

  const user_name = req.user.name;
  
  // Handle field name mapping - support both old and new field names
  const {
    user_id, 
    description, 
    // New field names from client
    bookingDate, 
    startTime, 
    endTime, 
    attendees,
    // Old field names (for backward compatibility)
    booking_date, 
    booking_time, 
    bookingendtime, 
    no_of_people,
    status 
  } = req.body;

  // Map client field names to database field names
  const mappedBookingDate = bookingDate || booking_date;
  const mappedBookingTime = startTime || booking_time;
  const mappedBookingEndTime = endTime || bookingendtime;
  const mappedNoOfPeople = attendees || no_of_people;

  // Debug logging for field mapping
  console.log('Field mapping debug:', {
    original: { bookingDate, startTime, endTime, attendees },
    fallback: { booking_date, booking_time, bookingendtime, no_of_people },
    mapped: { mappedBookingDate, mappedBookingTime, mappedBookingEndTime, mappedNoOfPeople }
  });

  // Validate required fields
  if (!mappedBookingDate) {
    return res.status(400).json({ error: 'booking date is required' });
  }
  if (!mappedBookingTime) {
    return res.status(400).json({ error: 'start time is required' });
  }
  if (!mappedBookingEndTime) {
    return res.status(400).json({ error: 'end time is required' });
  }
  if (!mappedNoOfPeople || mappedNoOfPeople < 1) {
    return res.status(400).json({ error: 'number of attendees must be at least 1' });
  }

  const sql = `INSERT INTO bookings (user_id, description, booking_date, booking_time, bookingendtime, no_of_people, status) 
               VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, 'PENDING'))`;

  db.query(sql, [user_id, description, mappedBookingDate, mappedBookingTime, mappedBookingEndTime, mappedNoOfPeople, status], (err, result) => {
    if (err) {
      logger.error('Error inserting booking:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Booking created successfully at: ${logintime} by user: ${user_name}`);
    return res.json({ success: true, message: 'Booking created successfully', bookingId: result.insertId });
  });
});

router.get('/', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  //console.log(`[${now}] GET /api/bookings`);
  const sql = `SELECT b.*, u.name, u.email, u.phone 
               FROM bookings b
               JOIN users u ON b.user_id = u.id`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    return res.json(results);
  });
});

router.put('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] PUT /api/bookings/${req.params.id}`);
  console.log('Update booking status body:', req.body);

  const bookingId = req.params.id;
  const { status } = req.body;
  const user_name = req.user.name;

  const sql = 'UPDATE bookings SET status = ? WHERE id = ?';
  db.query(sql, [status, bookingId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Updated booking status to: ${status} at: ${logintime} by: ${user_name}`);
    logger.info(`Updated booking ID: ${bookingId}`);
    return res.json({ success: true, message: 'Booking status updated' });
  });
});

router.delete('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/bookings/${req.params.id}`);

  const bookingId = req.params.id;
  const user_name = req.user.name;

  const sql = 'DELETE FROM bookings WHERE id = ?';
  db.query(sql, [bookingId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Booking deleted at: ${logintime} by: ${user_name}`);
    logger.info(`Deleted booking ID: ${bookingId}`);
    return res.json({ success: true, message: 'Booking deleted' });
  });
});

module.exports = router;
