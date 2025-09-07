require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const logger = require('./logger');
const setupGracefulShutdown = require('./utils/gracefulShutdown');
const { initializeDatabase } = require('./databaseInit');
const { xssProtectionMiddleware } = require('./middleware/xssProtection');

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
const classroom_booking_email_notifications = require("./routes/classroomBookingEmailRoutes");

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

// Security middleware configuration
// Enable compression middleware first (before other middleware)
app.use(compression({
  // Enable compression for all response types
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  // Compression level (1-9, 6 is default, 9 is best compression but slower)
  level: 6,
  // Minimum response size to compress (in bytes)
  threshold: 1024,
  // Memory level (1-9, affects memory usage vs speed)
  memLevel: 8
}));

// Generate nonce for CSP
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Comprehensive Helmet security configuration
app.use(helmet({
  // Content Security Policy - Strict with necessary allowlists
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      
      // Scripts: Allow self, PayHere, Microsoft Graph, and nonce-based scripts
      scriptSrc: [
        "'self'",
        "https://www.payhere.lk",
        "https://sandbox.payhere.lk", // PayHere sandbox for testing
        "https://graph.microsoft.com",
        "https://login.microsoftonline.com",
        (req, res) => `'nonce-${res.locals.nonce}'`,
        // Only allow unsafe-inline in development for React hot reloading
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-inline'"] : [])
      ],
      
      // Styles: Allow self, nonce-based styles, and external stylesheets
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        (req, res) => `'nonce-${res.locals.nonce}'`,
        // Only allow unsafe-inline in development for React hot reloading
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-inline'"] : [])
      ],
      
      // Images: Allow self, data URIs, and trusted CDNs
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://www.payhere.lk",
        "https://graph.microsoft.com",
        "https://*.slpa.lk"
      ],
      
      // Fonts: Allow self and Google Fonts
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      
      // Connect: Allow self, PayHere, Microsoft Graph APIs
      connectSrc: [
        "'self'",
        "https://www.payhere.lk",
        "https://sandbox.payhere.lk",
        "https://graph.microsoft.com",
        "https://login.microsoftonline.com",
        "https://*.slpa.lk",
        process.env.NODE_ENV === 'development' ? "http://localhost:*" : null,
        process.env.NODE_ENV === 'development' ? "ws://localhost:*" : null, // WebSocket for dev
      ].filter(Boolean),
      
      // Frames: Deny all framing except PayHere for payment processing
      frameSrc: [
        "https://www.payhere.lk",
        "https://sandbox.payhere.lk"
      ],
      
      // Objects and embeds: Deny all
      objectSrc: ["'none'"],
      embedSrc: ["'none'"],
      
      // Media: Allow self
      mediaSrc: ["'self'"],
      
      // Workers: Allow self
      workerSrc: ["'self'", "blob:"],
      
      // Base URI: Restrict to self
      baseUri: ["'self'"],
      
      // Form actions: Allow self and PayHere
      formAction: [
        "'self'",
        "https://www.payhere.lk",
        "https://sandbox.payhere.lk"
      ]
    },
    // Report violations in development
    reportOnly: process.env.NODE_ENV === 'development'
  },

  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options: Prevent MIME type sniffing
  noSniff: true,

  // X-XSS-Protection: Enable XSS filtering (legacy browsers)
  xssFilter: true,

  // Referrer Policy: Strict referrer policy
  referrerPolicy: {
    policy: ['strict-origin-when-cross-origin']
  },

  // HTTP Strict Transport Security (HSTS) - Only in production with HTTPS
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,

  // Permissions Policy: Restrict browser features
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: ['self', 'https://www.payhere.lk', 'https://sandbox.payhere.lk'],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
    'ambient-light-sensor': [],
    autoplay: [],
    'encrypted-media': [],
    fullscreen: ['self'],
    'picture-in-picture': [],
    'display-capture': []
  },

  // Cross-Origin-Embedder-Policy: Require CORP for cross-origin resources
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? {
    policy: 'credentialless'
  } : false,

  // Cross-Origin-Opener-Policy: Isolate browsing context
  crossOriginOpenerPolicy: {
    policy: 'same-origin-allow-popups' // Allow PayHere popups
  },

  // Cross-Origin-Resource-Policy: Control cross-origin resource sharing
  crossOriginResourcePolicy: {
    policy: 'cross-origin' // Allow cross-origin requests for API
  },

  // Expect-CT: Certificate Transparency (deprecated but still useful)
  expectCt: process.env.NODE_ENV === 'production' ? {
    maxAge: 86400,
    enforce: true
  } : false,

  // Origin-Agent-Cluster: Isolate origins
  originAgentCluster: true
}));


// CORS configuration to support credentials
const allowedOrigins = [
  'http://localhost:3000',
  'https://mpmaerp.slpa.lk',
  'https://mpma.slpa.lk/erp'
];

// Add environment variable support for additional origins
if (process.env.ADDITIONAL_CORS_ORIGINS) {
  const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(origin => origin.trim());
  allowedOrigins.push(...additionalOrigins);
}
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

// XSS Protection - Apply to all routes except file uploads
app.use(xssProtectionMiddleware({
  skipRoutes: ['/secure_uploads'],
  logSanitization: process.env.NODE_ENV === 'development'
}));

// Serve uploaded files statically
app.use('/secure_uploads', express.static(path.join(__dirname, '../secure_uploads')));

// Serve static files from the React app build directory in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from client build directory
  app.use('/erp', express.static(path.join(__dirname, '../../client/dist'), {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    setHeaders: (res, path) => {
      // Set proper MIME types for different file types
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
      // Add security headers for static assets
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
    }
  }));

  // Serve the React app for all non-API routes
  app.get('/erp/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'), {
      headers: {
        'Content-Type': 'text/html',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  });
}


// Make nonce available to frontend if needed
app.use('/api/security/nonce', (req, res) => {
  res.json({ nonce: res.locals.nonce });
});

// Add CSP nonce to HTML responses
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    if (typeof body === 'string' && body.includes('<html')) {
      // Inject nonce into HTML head
      body = body.replace(
        '<head>',
        `<head>\n    <meta name="csp-nonce" content="${res.locals.nonce}">`
      );
    }
    originalSend.call(this, body);
  };
  next();
}); 


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
app.use('/api/students', studentRoutes); 
app.use('/api/student-ids', studentIdRoutes); 
app.use('/api/batches', batchRoutes); 
app.use("/api/aidrequests", aidRequestRoutes);
app.use("/api/aidhandover", aidHandoverRoutes);
app.use("/api/classroom-calendar", classroomCalendarRoutes);
app.use("/api/classroom-booking-emails", classroom_booking_email_notifications);

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


// Route not found handler - but exclude static asset requests
app.use((req, res, next) => {
  // If it's a request for static assets in production, let it fall through
  if (process.env.NODE_ENV === 'production' && req.path.startsWith('/erp/') && !req.path.startsWith('/erp/api/')) {
    // This should be handled by the static middleware above
    return res.status(404).send('Asset not found');
  }
  
  // For API routes or other paths, return JSON error
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
// Function to ensure required directories exist
const ensureRequiredDirectoriesExist = () => {
  const requiredDirectories = [
    { path: path.join(__dirname, '../ssl/certs'), name: 'SSL certificates', description: 'ssl/certs' },
    { path: path.join(__dirname, '../logs'), name: 'Logs', description: 'logs' },
    { path: path.join(__dirname, '../backups'), name: 'Backups', description: 'backups' },
    { path: path.join(__dirname, '../secure_uploads'), name: 'Secure uploads', description: 'secure_uploads' }
  ];
  
  requiredDirectories.forEach(({ path: dirPath, name, description }) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`📁 Created ${name} directory: ${description}`);
      } else {
        logger.info(`📁 ${name} directory exists: ${description}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to create ${name} directory (${description}):`, error);
    }
  });
};

const server = app.listen(port, async () => {
  logger.NESH(`Server running on port ${port}`);
  
  // Ensure required directories exist
  ensureRequiredDirectoriesExist();
  

  
  // Initialize database tables
  try {
    logger.info('🔧 Initializing database tables...');
    await initializeDatabase();
    logger.info('✅ Database initialization completed');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
  }
  
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
