// API Configuration
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// Use environment variable if available, otherwise use defaults
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isProduction 
    ? 'https://mpmaerp.slpa.lk/api' 
    : 'http://localhost:5003/api');

const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || 
  (isProduction 
    ? 'https://mpmaerp.slpa.lk' 
    : 'http://localhost:5003');

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  BASE_FILE_URL: FILE_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  ENABLE_LOGGING: isDevelopment
};

export default API_CONFIG;