"use strict";

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');
const setupGracefulShutdown = require('./utils/gracefulShutdown');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const busBooking = require('./routes/busroute');
const CourseRegistrationRoute = require('./routes/CourseRegistrationRoute');
const PayCourseRoute = require('./routes/PayCourseRoute');
const lecturerRegistrationRoutes = require('./routes/lecturerRegistration');
const studentRoutes = require('./routes/studentRoutes'); // Make sure this is imported
const {
  requestMonitor
} = require('./utils/monitorServer');

// Import the batch routes
const batchRoutes = require('./routes/batchRoutes');

// Initialize Express app
const app = express();

// Enable debug mode for development
const DEBUG = process.env.NODE_ENV !== 'production';

// Debug middleware to log requests
if (DEBUG) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// CORS configuration to support credentials
const allowedOrigins = ['http://localhost:3000', 'http://10.70.4.34:3060'];
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); // Add cookie-parser middleware before routes

// Clear logs every 5 minutes to prevent terminal lag (for testing)
setInterval(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.clear();
    console.log(`[${new Date().toISOString()}] Console cleared to prevent lag.`);
  }
}, 5 * 60 * 1000); // every 5 minutes

// Public health check endpoint (doesn't require authentication)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running normally'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/busBookings', busBooking);
app.use('/api/CourseRegistrationRoute', CourseRegistrationRoute);
app.use('/api/course-payments', PayCourseRoute);
app.use('/api/lecturer-registration', lecturerRegistrationRoutes);
app.use('/api/students', studentRoutes); // Make sure this route is registered
app.use('/api/batches', batchRoutes); // Add batch routes

// Stats endpoint (admin only)
app.get('/api/stats', (req, res) => {
  // In production, this should be protected by admin authentication
  const {
    getStats
  } = require('./utils/monitorServer');
  res.json(getStats());
});

// Route not found handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: DEBUG ? err.message : 'Something went wrong'
  });
});
const port = process.env.PORT || 5003;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit the process and let a process manager restart it
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to exit the process and let a process manager restart it
  // process.exit(1);
});
const gracefulShutdown = setupGracefulShutdown(server, db);
module.exports = server;