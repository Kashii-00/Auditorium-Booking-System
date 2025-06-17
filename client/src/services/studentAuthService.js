import axios from 'axios';

const API_URL = 'http://localhost:5003/api';

// Student login function
export const studentLogin = async (email, password) => {
  try {
    // Make the login request
    const response = await axios.post(`${API_URL}/student-auth/login`, {
      email,
      password,
    });

    // Check if we have a successful response
    if (response.status === 200 && response.data) {
      // Store the tokens
      const { token, refreshToken, user } = response.data;

      // Enable this line for debugging
      console.log('Student login response:', response.data);

      // Set up axios defaults for future requests
      setAuthHeader(token);

      // Return the response data directly
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Student login error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Login failed');
  }
};

// Set auth token for future requests
export const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Student logout function
export const studentLogout = () => {
  localStorage.removeItem('studentToken');
  localStorage.removeItem('studentRefreshToken');
  localStorage.removeItem('studentUser');
  setAuthHeader(null);
};

// Check if student is logged in
export const isStudentLoggedIn = () => {
  const token = localStorage.getItem('studentToken');
  return !!token;
};

// Get student user data
export const getStudentUser = () => {
  const userStr = localStorage.getItem('studentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Refresh token function
export const refreshStudentToken = async () => {
  try {
    const refreshToken = localStorage.getItem('studentRefreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axios.post(`${API_URL}/student-auth/refresh-token`, {
      refreshToken,
    });

    if (response.data && response.data.token) {
      localStorage.setItem('studentToken', response.data.token);
      setAuthHeader(response.data.token);
      return response.data.token;
    }

    return null;
  } catch (error) {
    console.error('Refresh token error:', error);
    studentLogout();
    throw error;
  }
};

// Create a request function with authentication
export const studentAuthRequest = async (method, url, data = null, options = {}) => {
  try {
    const token = localStorage.getItem('studentToken');
    if (token) {
      setAuthHeader(token);
    }

    const config = {
      method,
      url: url.startsWith('http') ? url : `${API_URL}${url}`,
      ...options,
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    // If token expired, try to refresh and retry
    if (error.response?.status === 401) {
      try {
        await refreshStudentToken();
        return studentAuthRequest(method, url, data, options);
      } catch (refreshError) {
        throw refreshError;
      }
    }
    throw error;
  }
};
