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

// PayHere Configuration (defined separately to avoid circular reference)
config.payhere = {
  // Webhook/Notify URL - use ngrok for development, server URL for production
  notifyUrl: process.env.PAYHERE_NOTIFY_URL || (isDevelopment
    ? (process.env.NGROK_URL ? process.env.NGROK_URL + '/api/student_payments/payhere/notify' : 'http://localhost:5003/api/student_payments/payhere/notify')
    : config.serverUrl + '/api/student_payments/payhere/notify'),
  
  // Return URLs
  successUrl: process.env.PAYHERE_SUCCESS_URL || (isDevelopment
    ? 'http://localhost:3000/payment-success'
    : 'https://mpmaerp.slpa.lk/payment-success'),
    
  cancelUrl: process.env.PAYHERE_CANCEL_URL || (isDevelopment
    ? 'http://localhost:3000/payment-cancel'
    : 'https://mpmaerp.slpa.lk/payment-cancel')
};

// Add CORS origins to the config
config.corsOrigins = [
  'http://localhost:3000',
  'https://mpmaerp.slpa.lk'
];

module.exports = config;