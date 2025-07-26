import axios from 'axios';

const API_URL = 'http://localhost:5003/api';

let accessToken = null;
let isRefreshing = false;
let refreshPromise = null;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 5000;

axios.defaults.withCredentials = true;
const DEBUG = false;
const log = (...args) => { if (DEBUG) { console.log('[Auth Service]', ...args); } };

const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    log('Auth header set with token');
  } else {
    delete axios.defaults.headers.common['Authorization'];
    log('Auth header cleared');
  }
};

const broadcastSessionExpired = () => {
  window.localStorage.setItem('sessionExpired', Date.now());
};

window.addEventListener('storage', (event) => {
  if (event.key === 'sessionExpired') {
    accessToken = null;
    setAuthHeader(null);
    localStorage.removeItem('user');
    window.location.href = '/login';
    setTimeout(() => {
      alert('You have been logged out because your account was used to log in elsewhere.');
    }, 200);
  }
});


export const checkServerStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

export const initializeAuth = async () => {
  try {
    log('Initializing auth...');
    const result = await refreshToken();
    log('Auth initialization result:', result);
    return result;
  } catch (error) {
    console.error('Auth initialization failed:', error);
    return false;
  }
};

export const refreshToken = async () => {
  if (isRefreshing) {
    return refreshPromise;
  }
  const now = Date.now();
  if (now - lastRefreshTime < REFRESH_COOLDOWN) {
    return !!accessToken;
  }
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
      accessToken = null;
      setAuthHeader(null);
      return false;
    } finally {
      setTimeout(() => {
        isRefreshing = false;
        refreshPromise = null;
      }, 100);
    }
  })();
  return refreshPromise;
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.accessToken) {
      accessToken = response.data.accessToken;
      setAuthHeader(accessToken);
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

export const logout = async () => {
  try {
    accessToken = null;
    setAuthHeader(null);
    await axios.post(`${API_URL}/auth/logout`);
    localStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    accessToken = null;
    setAuthHeader(null);
    localStorage.removeItem('user');
    return false;
  }
};

let pendingRequests = [];

export const authRequest = async (method, url, data = null) => {
  try {
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

      case "patch":
        response = await axios.patch(url, data);
        break;

      case 'delete':
        response = await axios.delete(url);
        
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    return response.data;
  } catch (error) {
    if (
      error.response?.status === 401 &&
      error.response?.data?.error &&
      error.response.data.error.includes('logged in elsewhere')
    ) {
      broadcastSessionExpired();
      throw new Error('Session expired: logged in elsewhere.');
    }
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshed = await refreshToken();
        if (refreshed) {
          return authRequest(method, url, data);
        }
      } catch (refreshError) {
        console.error('Token refresh failed during request retry:', refreshError);
      }
    }
    throw error;
  }
};

axios.interceptors.request.use(
  (config) => {
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
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest._skipAuthRefresh
    ) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push(() => {
            const newConfig = { ...originalRequest };
            if (accessToken) {
              newConfig.headers.Authorization = `Bearer ${accessToken}`;
            }
            resolve(axios(newConfig));
          });
        });
      }
      try {
        const refreshed = await refreshToken();
        if (refreshed) {
          const requestsToRetry = [...pendingRequests];
          pendingRequests = [];
          requestsToRetry.forEach(callback => callback());
          if (accessToken) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Interceptor refresh error:', refreshError);
        pendingRequests = [];
      }
    }
    if (
      error.response?.status === 401 &&
      error.response?.data?.error &&
      error.response.data.error.includes('logged in elsewhere')
    ) {
      broadcastSessionExpired();
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => !!accessToken;

export const checkServerHealth = async () => {
  try {
    await axios.get(`${API_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
};
