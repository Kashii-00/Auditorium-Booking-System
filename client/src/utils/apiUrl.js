import { API_CONFIG } from '../config/api.config';

// Helper function to get the base API URL
export const getApiUrl = (path = '') => {
  const baseUrl = API_CONFIG.BASE_URL;
  // Remove /api from the end if it exists and path starts with /api
  if (baseUrl.endsWith('/api') && path.startsWith('/api')) {
    return baseUrl.replace(/\/api$/, '') + path;
  }
  return baseUrl + path;
};

// Helper to get the base URL for file paths
export const getBaseUrl = () => {
  return API_CONFIG.BASE_FILE_URL;
};

export default getApiUrl;