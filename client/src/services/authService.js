import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const API_URL = API_CONFIG.BASE_URL;

let accessToken = null;
let currentSessionId = null;
let isRefreshing = false;
let refreshPromise = null;
let lastRefreshTime = 0;
let sessionValidationInterval = null;
let lastUserActivity = Date.now();
let inactivityTimer = null;
let inactivityWarningTimer = null;
const REFRESH_COOLDOWN = 5000;
const SESSION_CHECK_INTERVAL = 30000; // Check session every 30 seconds (reduced frequency)
const ACTIVITY_CHECK_INTERVAL = 60000; // Only check if user has been active in last 60 seconds
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes of inactivity
const INACTIVITY_WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout

axios.defaults.withCredentials = true;
const DEBUG = false; // Disable debug logging in production
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

// Enhanced user notification for session invalidation
const showSessionInvalidatedNotification = () => {
  // Create a modern notification instead of basic alert
  const notification = document.createElement('div');
  notification.id = 'session-invalidated-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a52);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
      z-index: 10000;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideInFromRight 0.4s ease-out;
    ">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
        ">
          🔒
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">
            Session Ended
          </div>
          <div style="font-size: 14px; line-height: 1.4; opacity: 0.95;">
            You've been logged out because your account was accessed from another device.
          </div>
          <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
            Redirecting to login page...
          </div>
        </div>
      </div>
    </div>
    <style>
      @keyframes slideInFromRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove notification after redirect
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
};

const handleSessionInvalidated = () => {
  log('🚪 Session invalidated - performing client-side cleanup...');
  
  // Clean up client-side state
  accessToken = null;
  currentSessionId = null;
  setAuthHeader(null);
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('sessionId');
  
  // Stop session validation interval and inactivity timers
  if (sessionValidationInterval) {
    clearInterval(sessionValidationInterval);
    sessionValidationInterval = null;
  }
  stopInactivityTimer();
  
  // Show enhanced notification
  showSessionInvalidatedNotification();
  
  // Broadcast to other tabs
  broadcastSessionExpired();
  
  // Redirect with URL parameter for this specific tab
  setTimeout(() => {
    window.location.href = '/erp/login?reason=session_expired';
  }, 800);
};

// Track user activity and reset inactivity timer
const updateUserActivity = () => {
  lastUserActivity = Date.now();
  resetInactivityTimer();
};

// Show inactivity warning notification
const showInactivityWarning = () => {
  const warningNotification = document.createElement('div');
  warningNotification.id = 'inactivity-warning';
  warningNotification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.95), rgba(234, 88, 12, 0.95));
      color: white;
      padding: 16px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      z-index: 10000;
      min-width: 320px;
      max-width: 380px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      position: relative;
      overflow: hidden;
    ">
      <!-- Animated background particles -->
      <div style="
        position: absolute;
        inset: 0;
        opacity: 0.2;
        animation: rotate 20s linear infinite;
      ">
        <div style="position: absolute; top: 8px; right: 32px; width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        <div style="position: absolute; top: 32px; right: 16px; width: 4px; height: 4px; background: white; border-radius: 50%;"></div>
        <div style="position: absolute; bottom: 16px; left: 24px; width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
      </div>
      
      <!-- Progress bar -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 16px 16px 0 0;
        animation: progressBar 120s linear;
        width: 100%;
      "></div>
      
      <!-- Glowing edge effect -->
      <div style="
        position: absolute;
        inset: 0;
        border-radius: 16px;
        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        animation: shimmer 2s ease-in-out infinite alternate;
      "></div>
      
      <div style="position: relative;">
        <div style="display: flex; align-items: start; gap: 12px;">
          <!-- Animated Icon -->
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            animation: pulse 2s ease-in-out infinite;
            position: relative;
          ">
            ⚠️
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              animation: ripple 2s ease-out infinite;
            "></div>
          </div>
          
          <div style="flex: 1;">
            <div style="
              font-weight: 600; 
              font-size: 15px; 
              margin-bottom: 4px;
              animation: fadeInUp 0.6s ease-out 0.2s both;
            ">
              ⏰ Session Expiring Soon
            </div>
            <div style="
              font-size: 13px; 
              opacity: 0.95;
              line-height: 1.4;
              animation: fadeInUp 0.6s ease-out 0.4s both;
            ">
              Auto-logout in 2 minutes. Any activity will extend your session.
            </div>
          </div>
          
          <button 
            onclick="this.parentElement.parentElement.parentElement.remove(); window.authService?.resetInactivityTimer?.()" 
            style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.15);
              backdrop-filter: blur(10px);
              border: none;
              border-radius: 8px;
              color: white;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              animation: fadeInUp 0.6s ease-out 0.6s both;
            "
            onmouseover="
              this.style.background='rgba(255, 255, 255, 0.25)'; 
              this.style.transform='scale(1.05)';
            "
            onmouseout="
              this.style.background='rgba(255, 255, 255, 0.15)'; 
              this.style.transform='scale(1)';
            "
          >
            Stay Active
          </button>
        </div>
        
        <!-- Breathing indicator -->
        <div style="
          margin-top: 12px;
          text-align: center;
          animation: fadeInUp 0.6s ease-out 0.8s both;
        ">
          <div style="
            display: inline-block;
            padding: 4px 12px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            animation: breathe 2s ease-in-out infinite;
          ">
            💭 Click, type, or move to stay logged in
          </div>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes bounceIn {
        0% { transform: translateX(100%) scale(0.3); opacity: 0; }
        50% { transform: translateX(-10%) scale(1.05); }
        70% { transform: translateX(5%) scale(0.95); }
        100% { transform: translateX(0) scale(1); opacity: 1; }
      }
      
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      @keyframes ripple {
        0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
        70% { box-shadow: 0 0 0 12px rgba(255, 255, 255, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
      }
      
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes breathe {
        0%, 100% { opacity: 0.8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.02); }
      }
      
      @keyframes progressBar {
        from { width: 100%; }
        to { width: 0%; }
      }
    </style>
  `;
  
  document.body.appendChild(warningNotification);
  
  // Auto-remove warning after 2 minutes (when logout happens)
  setTimeout(() => {
    if (warningNotification.parentNode) {
      warningNotification.remove();
    }
  }, INACTIVITY_WARNING_TIME);
};

// Reset inactivity timers
const resetInactivityTimer = () => {
  // Clear existing timers
  clearTimeout(inactivityTimer);
  clearTimeout(inactivityWarningTimer);
  
  // Remove any existing warning
  const existingWarning = document.getElementById('inactivity-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  // Only set timers if user is logged in
  if (accessToken && currentSessionId) {
    // Set warning timer (8 minutes)
    inactivityWarningTimer = setTimeout(() => {
      showInactivityWarning();
    }, INACTIVITY_TIMEOUT - INACTIVITY_WARNING_TIME);
    
    // Set logout timer (10 minutes)
    inactivityTimer = setTimeout(() => {
      log('Logging out due to inactivity');
      
      // Perform logout
      logout('inactivity');
      window.location.href = '/erp/login?reason=inactivity';
    }, INACTIVITY_TIMEOUT);
    
    log('Inactivity timers reset');
  }
};

// Stop inactivity timers
const stopInactivityTimer = () => {
  clearTimeout(inactivityTimer);
  clearTimeout(inactivityWarningTimer);
  
  // Remove any existing warning
  const existingWarning = document.getElementById('inactivity-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  inactivityTimer = null;
  inactivityWarningTimer = null;
  log('Inactivity timers stopped');
};

// Add activity listeners
const setupActivityTracking = () => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, updateUserActivity, { passive: true });
  });
};

// Session validation interval - only checks if user has been active
const startSessionValidationInterval = () => {
  // Clear any existing interval
  if (sessionValidationInterval) {
    clearInterval(sessionValidationInterval);
  }
  
  // Setup activity tracking and inactivity timer
  setupActivityTracking();
  resetInactivityTimer();
  
  sessionValidationInterval = setInterval(async () => {
    if (accessToken && currentSessionId) {
      const timeSinceActivity = Date.now() - lastUserActivity;
      
      // Only validate if user has been active in the last minute
      if (timeSinceActivity < ACTIVITY_CHECK_INTERVAL) {
        try {
          await axios.get(`${API_URL}/users?limit=1`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          log('Periodic validation: Session is still valid');
        } catch (error) {
          if (error.response?.status === 401) {
            handleSessionInvalidated();
          }
        }
      } else {
        log('Skipping session validation - user inactive');
      }
    }
  }, SESSION_CHECK_INTERVAL);
  
  log('Started smart session validation interval');
};

window.addEventListener('storage', (event) => {
  if (event.key === 'sessionExpired') {
    handleSessionInvalidated();
  } else if (event.key === 'newLoginHappened') {
    // Another tab just logged in, check if our session is still valid
    const loginData = JSON.parse(event.newValue || '{}');
    
    // If we have a current session and it's different from the new one, validate immediately
    if (currentSessionId && loginData.sessionId && currentSessionId !== loginData.sessionId) {
      setTimeout(checkSessionOnFocus, 100); // Small delay to let the server process
    }
  }
});

// Check session validity when user focuses on the tab/window
const checkSessionOnFocus = async () => {
  if (accessToken && currentSessionId) {
    try {
      await axios.get(`${API_URL}/users?limit=1`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionInvalidated();
      }
    }
  }
};

// Add event listeners for window focus and visibility change
window.addEventListener('focus', checkSessionOnFocus);
window.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkSessionOnFocus();
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
    
    // Restore session ID from sessionStorage
    const storedSessionId = sessionStorage.getItem('sessionId');
    if (storedSessionId) {
      currentSessionId = storedSessionId;
      log('Restored session ID:', currentSessionId);
    }
    
    const result = await refreshToken();
    log('Auth initialization result:', result);
    
    // If auth initialized successfully, start session validation interval
    if (result) {
      startSessionValidationInterval();
    }
    
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
      // Broadcast new login for cross-tab session invalidation
      window.localStorage.setItem('newLoginHappened', JSON.stringify({
        timestamp: Date.now(),
        sessionId: response.data.sessionId,
        userId: response.data.user.id
      }));
      
      // Set up new session
      accessToken = response.data.accessToken;
      currentSessionId = response.data.sessionId;
      setAuthHeader(accessToken);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      sessionStorage.setItem('sessionId', currentSessionId);
      
      // Start session monitoring
      startSessionValidationInterval();
      
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

export const logout = async (reason = 'user_logout') => {
  try {
    accessToken = null;
    currentSessionId = null;
    setAuthHeader(null);
    
    // Stop session validation interval and inactivity timers
    if (sessionValidationInterval) {
      clearInterval(sessionValidationInterval);
      sessionValidationInterval = null;
    }
    stopInactivityTimer();
    
    // No need to store notification - will be handled via URL parameter when redirecting
    
    await axios.post(`${API_URL}/auth/logout`);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sessionId');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    accessToken = null;
    currentSessionId = null;
    setAuthHeader(null);
    
    // Stop session validation interval
    if (sessionValidationInterval) {
      clearInterval(sessionValidationInterval);
      sessionValidationInterval = null;
    }
    
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sessionId');
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
      (error.response.data.error.includes('logged in elsewhere') || 
       error.response.data.error.includes('Session expired'))
    ) {
      handleSessionInvalidated();
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
      (error.response.data.error.includes('logged in elsewhere') || 
       error.response.data.error.includes('Session expired'))
    ) {
      handleSessionInvalidated();
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem('user');
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

// Expose functions globally for inactivity warning button
window.authService = {
  resetInactivityTimer
};
