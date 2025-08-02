const express = require('express');
const router = express.Router();
const logger = require('../logger');
const db = require('../db');
const auth = require('../auth');
const moment = require('moment');

router.post('/', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/busBookings`);
  console.log('Bus booking POST body:', req.body);

  const user_name = req.user.name;
  const { user_id, fromPlace, toPlace, travelDate, returnDate, forWho, ContactNo } = req.body;
  const sql = `INSERT INTO busBooking (user_id, fromPlace, toPlace, travelDate, returnDate, forWho, ContactNo) VALUES (?,?,?,?,?,?,?)`;

  db.query(sql, [user_id, fromPlace, toPlace, travelDate, returnDate, forWho, ContactNo], (err, result) => {
    if (err) {
      logger.error('Error Inserting Booking', err);
      return res.status(500).json({ error: 'Database Error' });
    }
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Booking created successfully at: ${logintime} by user: ${user_name}`);
    return res.json({
      success: true,
      message: 'Booking created Successfully',
      bookingId: result.insertId,
    });
  });
});

router.get('/', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/busBookings`);
  const sql = `SELECT b.*, u.name, u.email, u.phone 
               FROM busBooking b
               JOIN users u ON b.user_id = u.id`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    return res.json(results);
  });
});

router.put('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] PUT /api/busBookings/${req.params.id}`);
  console.log('Update bus booking status body:', req.body);

  const bookingId = req.params.id;
  const { status } = req.body;
  const user_name = req.user.name;

  const sql = 'UPDATE busBooking SET status = ? WHERE id = ?';
  db.query(sql, [status, bookingId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Updated Booking Status to: ${status} at: ${logintime} By: ${user_name}`);
    logger.info(`Updated Booking ID: ${bookingId}`);
    return res.json({ success: true, message: 'Booking status updated' });
  });
});

router.delete('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/busBookings/${req.params.id}`);

  const bookingId = req.params.id;
  const user_name = req.user.name;

  const sql = 'DELETE FROM busBooking WHERE id = ?';
  db.query(sql, [bookingId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`Booking Deleted at: ${logintime} By: ${user_name}`);
    logger.info(`Deleted Booking ID: ${bookingId}`);
    return res.json({ success: true, message: 'Booking deleted' });
  });
});

// Removed unnecessary setInterval for clearing logs

module.exports = router;
