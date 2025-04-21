"use strict";

const moment = require('moment');
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const auth = require('../auth');
const db = require('../db');

// POST endpoint to create a booking, now including description
router.post('/', auth.authMiddleware, (req, res) => {
  const user_name = req.user.name;
  const {
    user_id,
    description,
    booking_date,
    booking_time,
    bookingendtime,
    no_of_people,
    status
  } = req.body;
  const sql = `INSERT INTO bookings (user_id, description, booking_date, booking_time, bookingendtime, no_of_people, status) 
               VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, 'PENDING'))`;
  db.query(sql, [user_id, description, booking_date, booking_time, bookingendtime, no_of_people, status], (err, result) => {
    if (err) {
      logger.error('Error inserting booking:', err);
      return res.status(500).json({
        error: 'Database error'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Booking created successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Booking created successfully',
      bookingId: result.insertId
    });
  });
});

// GET endpoint to retrieve bookings
router.get('/', auth.authMiddleware, (req, res) => {
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
router.put('/:id', auth.authMiddleware, (req, res) => {
  const bookingId = req.params.id;
  const {
    status
  } = req.body;
  const user_name = req.user.name;
  const sql = 'UPDATE bookings SET status = ? WHERE id = ?';
  db.query(sql, [status, bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Updated booking status to: ${status} at: ${logintime} by: ${user_name}`);
    logger.info(`Updated booking ID: ${bookingId}`);
    return res.json({
      success: true,
      message: 'Booking status updated'
    });
  });
});

// DELETE endpoint to remove a booking
router.delete('/:id', auth.authMiddleware, (req, res) => {
  const bookingId = req.params.id;
  const user_name = req.user.name;
  const sql = 'DELETE FROM bookings WHERE id = ?';
  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error'
      });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Booking deleted at: ${logintime} by: ${user_name}`);
    logger.info(`Deleted booking ID: ${bookingId}`);
    return res.json({
      success: true,
      message: 'Booking deleted'
    });
  });
});

// Clear logs every 24h (86400000ms)
setInterval(() => {
  console.clear(); // clear PowerShell or terminal
  logger.info('🔄 Logs cleared - 24h cycle restart');
}, 24 * 60 * 60 * 1000);
module.exports = router;