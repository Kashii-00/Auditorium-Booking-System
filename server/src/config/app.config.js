// Application Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

const config = {
  // Server Configuration
  port: process.env.PORT || 5003,
  
  // Client URL Configuration
  clientUrl: process.env.CLIENT_URL || (isDevelopment 
    ? 'http://localhost:3000' 
    : 'https://mpmaerp.slpa.lk'),
    
  // API URL Configuration  
  apiUrl: process.env.API_URL || (isDevelopment
    ? 'http://localhost:5003/api'
    : 'https://mpmaerp.slpa.lk/api'),

  // Server URL Configuration (for webhooks and callbacks)
  serverUrl: process.env.SERVER_URL || (isDevelopment
    ? 'http://localhost:5003'
    : 'https://mpmaerp.slpa.lk')
};



// Add CORS origins to the config
config.corsOrigins = [
  'http://localhost:3000',
  'https://mpmaerp.slpa.lk',
  'https://mpma.slpa.lk/erp'
];

// Add environment variable support for additional origins
if (process.env.ADDITIONAL_CORS_ORIGINS) {
  const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(origin => origin.trim());
  config.corsOrigins.push(...additionalOrigins);
}

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