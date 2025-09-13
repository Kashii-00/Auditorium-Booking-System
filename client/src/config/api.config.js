const getApiUrl = () => {
  return '/erp/api';
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  ENABLE_LOGGING: import.meta.env.MODE === 'development'
};

export default API_CONFIG;