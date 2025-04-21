import axios from 'axios';

const API_URL = 'http://10.70.4.34:5003/api';

// In-memory storage for access token (not accessible from browser console)
let accessToken = null;

// Track refresh token operations
let isRefreshing = false;
let refreshPromise = null;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 5000; // 5 seconds minimum between refresh attempts

// Configure axios defaults
axios.defaults.withCredentials = true; // Enable sending cookies with requests

// Debug mode - set to false in production
const DEBUG = false;

// Define the log function properly to avoid ESLint errors
const log = (...args) => {
  if (DEBUG) {
    console.log('[Auth Service]', ...args);
  }
};

// Set auth header for requests
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    log('Auth header set with token');
  } else {
    delete axios.defaults.headers.common['Authorization'];
    log('Auth header cleared');
  }
};

// Check if server is available
export const checkServerStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

// Initialize auth state from refresh token
export const initializeAuth = async () => {
  try {
    log('Initializing auth...');
    // Try to refresh token
    const result = await refreshToken();
    log('Auth initialization result:', result);
    return result;
  } catch (error) {
    console.error('Auth initialization failed:', error);
    return false;
  }
};

// Refresh token using HTTP-only cookie with protection against rapid calls
export const refreshToken = async () => {
  // Prevent multiple simultaneous refresh calls
  if (isRefreshing) {
    return refreshPromise;
  }
  
  // Implement cooldown to prevent rapid refresh calls
  const now = Date.now();
  if (now - lastRefreshTime < REFRESH_COOLDOWN) {
    return !!accessToken;
  }
  
  // Set refreshing flag and create a new promise
  isRefreshing = true;
  lastRefreshTime = now;
  
  refreshPromise = (async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
        _skipAuthRefresh: true
      });
      
      if (response?.data?.accessToken) {
        accessToken = response.data.accessToken;
        setAuthHeader(accessToken);
        return true;
      }
      return false;
    } catch (error) {
      // Error handling...
      accessToken = null;
      setAuthHeader(null);
      return false;
    } finally {
      // Reset the refreshing state
      setTimeout(() => {
        isRefreshing = false;
        refreshPromise = null;
      }, 100);
    }
  })();

  return refreshPromise;
};

// Login and store user data
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    if (response.data.accessToken) {
      // Store access token in memory only (not in localStorage)
      accessToken = response.data.accessToken;
      setAuthHeader(accessToken);
      
      // Store only non-sensitive user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Server connection failed. Please check if the server is running.');
    }
    throw error;
  }
};

// Logout and clear auth state
export const logout = async () => {
  try {
    // Clear token from memory first
    accessToken = null;
    setAuthHeader(null);
    
    // Call server to invalidate refresh token cookie
    await axios.post(`${API_URL}/auth/logout`);
    
    // Clear user data
    localStorage.removeItem('user');
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if server request fails, clear client-side state
    accessToken = null;
    setAuthHeader(null);
    localStorage.removeItem('user');
    
    return false;
  }
};

// Keep track of pending requests that are waiting for token refresh
let pendingRequests = [];

// Helper for authenticated API requests with token refresh
export const authRequest = async (method, url, data = null) => {
  try {
    // Set current access token if available
    if (accessToken) {
      setAuthHeader(accessToken);
    }
    
    let response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await axios.get(url);
        break;
      case 'post':
        response = await axios.post(url, data);
        break;
      case 'put':
        response = await axios.put(url, data);
        break;
      case 'delete':
        response = await axios.delete(url);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    return response.data;
  } catch (error) {
    // If 401 unauthorized and not already retrying, try refreshing token
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        // Wait for token refresh - will use existing promise if refresh is in progress
        const refreshed = await refreshToken();
        if (refreshed) {
          // Create a new request with the same config but new token
          return authRequest(method, url, data);
        }
      } catch (refreshError) {
        console.error('Token refresh failed during request retry:', refreshError);
      }
    }
    
    throw error;
  }
};

// Axios interceptor for automatic token refresh
axios.interceptors.request.use(
  (config) => {
    // Skip auth header for refresh token requests to prevent loops
    if (config.url?.includes('/auth/refresh') || config._skipAuthRefresh) {
      delete config.headers.Authorization;
    } else if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Skip token refresh for these cases:
    // 1. Already retrying
    // 2. It's a refresh token request itself
    // 3. The _skipAuthRefresh flag is set
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest._skipAuthRefresh
    ) {
      originalRequest._retry = true;
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push(() => {
            // Copy the original request but with new token
            const newConfig = { ...originalRequest };
            if (accessToken) {
              newConfig.headers.Authorization = `Bearer ${accessToken}`;
            }
            resolve(axios(newConfig));
          });
        });
      }
      
      try {
        // Attempt token refresh
        const refreshed = await refreshToken();
        
        // Process any pending requests
        if (refreshed) {
          const requestsToRetry = [...pendingRequests];
          pendingRequests = [];
          requestsToRetry.forEach(callback => callback());
          
          // Retry the original request
          if (accessToken) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Interceptor refresh error:', refreshError);
        // Clear the pending requests on error
        pendingRequests = [];
      }
    }
    
    return Promise.reject(error);
  }
);

// Get current user data from localStorage (non-sensitive)
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated
export const isAuthenticated = () => !!accessToken;

// Add a health check method
export const checkServerHealth = async () => {
  try {
    await axios.get(`${API_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
};
