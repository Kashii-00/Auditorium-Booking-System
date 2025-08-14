require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');
const logger = require('./logger');
const setupGracefulShutdown = require('./utils/gracefulShutdown');

const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const busBooking = require('./routes/busroute');
const CourseRegistrationRoute = require('./routes/CourseRegistrationRoute');
const PayCourseRoute = require('./routes/PayCourseRoute');
const lecturerRegistrationRoutes = require('./routes/lecturerRegistration');
const aidRequestRoutes = require("./routes/aidRequests");
const aidHandoverRoutes = require("./routes/aidHandover");
const classroomCalendarRoutes = require("./routes/classroomCalendarRoutes");

const ratesRoutes = require("./routes/rates");
const paymentsRouter = require("./routes/PayMain/coursePaymentsMaindetails");
const studentRoutes = require('./routes/studentRoutes'); 
const studentIdRoutes = require('./routes/studentIdRoutes');
const paymentCDWFull = require("./routes/PayMain/CDWFull");
const paymentCDCFull = require("./routes/PayMain/CDCFull");
const paymentCOHFull = require("./routes/PayMain/COHFull");
const paymentFinalReport = require("./routes/PayMain/course_cost_summary");
const paymentsSFDisplay = require("./routes/PayMain/FullPaymentsGet");
const costSummaryFlags = require("./routes/PayMain/cost_summary_flags");
const specialCasePayments = require("./routes/PayMain/special_case_payments");
const payhereRoutes = require("./routes/Payhere/payhere");
const courseRevenueSummary = require("./routes/PayMain/courseRevenueSummary");

// Import routes from PayMain/excess directory
const LecturerAttendance = require("./routes/PayMain/excess/lecturer_attendance");
const LecturerPayments = require("./routes/PayMain/excess/lecturerPayments");

const StudentPayments = require("./routes/PayMain/excess/StudentPayments");
const { studentAuthRouter } = require('./routes/studentAuthRoutes');
const studentPaymentRoutes = require('./routes/studentPaymentRoutes');

// Import the batch routes
const batchRoutes = require('./routes/batchRoutes');

const emailRoutes = require("./routes/email");

const cron = require("node-cron");
const processPendingEmails = require("./utils/emailProcessor");

// Import backup service
const backupService = require('./services/backupService');

// Initialize Express app
const app = express();

// Enable debug mode for development
const DEBUG = process.env.NODE_ENV !== 'development';


// CORS configuration to support credentials
const allowedOrigins = [
  'http://localhost:3000',
  'https://mpmaerp.slpa.lk'
];
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
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Every 5 minutes
cron.schedule("*/10 * * * *", () => {
  logger.email("⏰ Checking for approved/denied requests needing emails...");
  processPendingEmails();
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser()); 


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
app.use('/api/student-ids', studentIdRoutes); // Student ID management routes
app.use('/api/batches', batchRoutes); // Add batch routes
app.use("/api/aidrequests", aidRequestRoutes);
app.use("/api/aidhandover", aidHandoverRoutes);
app.use("/api/classroom-calendar", classroomCalendarRoutes);

//Payment 
app.use("/api/rates", ratesRoutes);
app.use("/api/payments", paymentsRouter);
app.use("/api/course-development-work", paymentCDWFull);
app.use("/api/course-delivery-cost-full", paymentCDCFull);
app.use("/api/course-overheads-cost", paymentCOHFull);
app.use("/api/payment-course-final-summary", paymentFinalReport);
app.use("/api/payment-sf-display", paymentsSFDisplay);
app.use("/api/cost-summary-flags", costSummaryFlags);
app.use("/api/special-case-payments", specialCasePayments);
app.use("/api/payhere", payhereRoutes);
app.use("/api/course-revenue-summary", courseRevenueSummary);
app.use("/api/lecturer-attendance", LecturerAttendance);
app.use("/api/lecturer-payments", LecturerPayments);

app.use("/api/email", emailRoutes);

// Backup management routes
app.use('/api/backup', require('./routes/backup'));

// Student authentication routes
app.use('/api/student-auth', studentAuthRouter);
app.use("/api/student_payments", StudentPayments);



// Student batch routes
const studentBatchRoutes = require('./routes/studentBatchRoutes');
app.use('/api/student-batches', studentBatchRoutes);

// Lecturer authentication routes  
const lecturerAuthRoutes = require('./routes/lecturerAuthRoutes');
app.use('/api/lecturer-auth', lecturerAuthRoutes);

// Lecturer batch management routes
const lecturerBatchRoutes = require('./routes/lecturer_batchRoutes');
app.use('/api/lecturer-batches', lecturerBatchRoutes);

// Stats endpoint (admin only)
app.get('/api/stats', (req, res) => {
  // In production, this should be protected by admin authentication
  const { getStats } = require('./utils/monitorServer');
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
  logger.NESH(`Server running on port ${port}`);
  
  // Initialize backup service scheduling
  try {
    backupService.init();
  } catch (error) {
    console.error('❌ Failed to initialize backup service:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit the process and let a process manager restart it
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to exit the process and let a process manager restart it
  // process.exit(1);
});

const gracefulShutdown = setupGracefulShutdown(server, db);

module.exports = server;
