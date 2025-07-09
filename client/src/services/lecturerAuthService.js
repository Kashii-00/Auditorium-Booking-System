import axios from 'axios';

const API_URL = 'http://localhost:5003/api';

// Lecturer login function
export const lecturerLogin = async (email, password) => {
  try {
    // Make the login request
    const response = await axios.post(`${API_URL}/lecturer-auth/login`, {
      email,
      password,
    });

    // Check if we have a successful response
    if (response.status === 200 && response.data) {
      // Store the tokens
      const { token, refreshToken, user } = response.data;

      // Enable this line for debugging
      console.log('Lecturer login response:', response.data);

      // Store in localStorage
      localStorage.setItem('lecturerToken', token);
      localStorage.setItem('lecturerRefreshToken', refreshToken);
      localStorage.setItem('lecturerUser', JSON.stringify(user));

      // Set up axios defaults for future requests
      setAuthHeader(token);

      // Return the response data directly
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Lecturer login error:', error.response?.data || error.message);
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

// Lecturer logout function
export const lecturerLogout = () => {
  localStorage.removeItem('lecturerToken');
  localStorage.removeItem('lecturerRefreshToken');
  localStorage.removeItem('lecturerUser');
  setAuthHeader(null);
};

// Check if lecturer is logged in
export const isLecturerLoggedIn = () => {
  const token = localStorage.getItem('lecturerToken');
  return !!token;
};

// Get lecturer user data
export const getLecturerUser = () => {
  const userStr = localStorage.getItem('lecturerUser');
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
export const refreshLecturerToken = async () => {
  try {
    const refreshToken = localStorage.getItem('lecturerRefreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axios.post(`${API_URL}/lecturer-auth/refresh-token`, {
      refreshToken,
    });

    if (response.data && response.data.token) {
      localStorage.setItem('lecturerToken', response.data.token);
      setAuthHeader(response.data.token);
      return response.data.token;
    }

    return null;
  } catch (error) {
    console.error('Refresh token error:', error);
    lecturerLogout();
    throw error;
  }
};

// Create a request function with authentication
export const lecturerAuthRequest = async (method, url, data = null, options = {}) => {
  try {
    const token = localStorage.getItem('lecturerToken');
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
        await refreshLecturerToken();
        return lecturerAuthRequest(method, url, data, options);
      } catch (refreshError) {
        throw refreshError;
      }
    }
    throw error;
  }
};

// Change password function
export const changeLecturerPassword = async (currentPassword, newPassword) => {
  try {
    const response = await lecturerAuthRequest('POST', '/lecturer-auth/change-password', {
      currentPassword,
      newPassword
    });
    return response;
  } catch (error) {
    console.error('Change password error:', error);
    throw new Error(error.response?.data?.error || 'Failed to change password');
  }
};

// Forgot password function
export const forgotLecturerPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/lecturer-auth/forgot-password`, {
      email
    });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw new Error(error.response?.data?.error || 'Failed to send reset email');
  }
};

// Reset password with token
export const resetLecturerPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/lecturer-auth/reset-password`, {
      token,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw new Error(error.response?.data?.error || 'Failed to reset password');
  }
};

// Get lecturer profile
export const getLecturerProfile = async () => {
  try {
    const response = await lecturerAuthRequest('GET', '/lecturer-auth/profile');
    return response;
  } catch (error) {
    console.error('Get profile error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch profile');
  }
};

// Get lecturer's students
export const getLecturerStudents = async (batchId = null, courseId = null) => {
  try {
    let url = '/lecturer-auth/students';
    const params = new URLSearchParams();
    if (batchId) params.append('batchId', batchId);
    if (courseId) params.append('courseId', courseId);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await lecturerAuthRequest('GET', url);
    return response;
  } catch (error) {
    console.error('Get students error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch students');
  }
}; 