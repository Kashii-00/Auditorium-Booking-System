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
    
  // CORS Origins - Localhost for development, HTTPS for production
  corsOrigins: [
    'http://localhost:3000',
    'https://mpmaerp.slpa.lk'
  ]
};

module.exports = config;