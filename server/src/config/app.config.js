const config = {
  port: 5003,
};


config.corsOrigins = [

  'http://localhost:3000',
  // Public VM IP (mpma.slpa.lk)
  'http://203.115.19.56',
  'http://203.115.19.56:3000',
  'http://203.115.19.56:80',
  'http://203.115.19.56:443',
  'https://203.115.19.56',
  'https://203.115.19.56:443',
  // Production domains
  'https://mpmaerp.slpa.lk',        // ← NEW
  'https://mpma.slpa.lk/erp/',      // ← NEW
  'https://mpma.slpa.lk',
  'https://mpma.slpa.lk:443',
  'http://mpma.slpa.lk',
  'http://mpma.slpa.lk:80',
  // Private VM IP for internal access
  'http://10.70.4.34:5003',
  'http://10.70.4.34:3000',
];


if (process.env.ADDITIONAL_CORS_ORIGINS) {
  const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(origin => origin.trim());
  config.corsOrigins.push(...additionalOrigins);
}

// Dynamic CORS function to allow any domain with /erp
config.corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (config.corsOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow any domain that ends with /erp (for production)
    if (origin.includes('/erp') || origin.endsWith('.slpa.lk') || origin.endsWith('.local')) {
      return callback(null, true);
    }
    
    // Allow public VM IP patterns (mpma.slpa.lk)
    if (origin.startsWith('http://203.115.19.56') || origin.startsWith('https://203.115.19.56')) {
      return callback(null, true);
    }
    
    // Allow private VM IP patterns
    if (origin.startsWith('http://10.70.4.34')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Upload Security Configuration
config.uploads = {
  root: process.env.UPLOAD_ROOT || 'secure_uploads',
  maxSizeMB: parseInt(process.env.MAX_UPLOAD_MB) || 100,
  allowedExtensions: process.env.ALLOWED_EXTENSIONS?.split(',') || null
};

// Security Configuration
config.security = {
  uploadRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.UPLOAD_RATE_LIMIT) || 10
  }
};

module.exports = config;