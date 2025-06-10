import axios from 'axios';
import { VITE_APIURL } from '../config';

const axiosInstance = axios.create({
  baseURL: VITE_APIURL
});

interface ErrorInfo {
  message?: string;
  stack?: string;
  [key: string]: any;
}

// Get fresh token from storage
const getAuthToken = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  return user.token;
};

// Request interceptor to add auth header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const logErrorToServer = async (error: any, additionalInfo?: ErrorInfo) => {
  console.log('Attempting to log error to server...'); // Debug log

  const errorData = {
    error: error.toString(),
    errorInfo: {
      message: error.message,
      stack: error.stack,
      response: {
        data: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      },
      request: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      },
      timestamp: new Date().toISOString(),
      ...additionalInfo
    }
  };

  try {
    console.log('Sending error data:', JSON.stringify(errorData, null, 2));
    const response = await axios.post(`${VITE_APIURL}/log-error`, errorData);
    console.log('Error logged successfully:', response.status); 
  } catch (loggingError) {
    console.group('Error Logging Failed');
    console.error('Failed to send error to server:', loggingError);
    console.error('Original error:', error);
    console.groupEnd();
  }
};

// Response interceptor for handling auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't handle refresh token errors to avoid loops
    if (error.config?.url === '/refresh') {
      return Promise.reject(error);
    }

    // Handle auth errors
    if (error.response?.status === 401) {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          throw new Error('No user data found');
        }

        const user = JSON.parse(userStr);
        const response = await axios.post(`${VITE_APIURL}/refresh`, {
          refreshToken: user.refreshToken
        });

        // Update token in storage
        user.token = response.data.token;
        localStorage.setItem('user', JSON.stringify(user));

        // Retry original request
        error.config.headers.Authorization = `Bearer ${response.data.token}`;
        return axios(error.config);
      } catch (refreshError) {
        await logErrorToServer(refreshError, {
          component: 'Token Refresh',
          originalError: error.message
        });
        return Promise.reject(refreshError);
      }
    }

    // Log other errors
    await logErrorToServer(error, {
      component: 'API Call',
      timestamp: new Date().toISOString()
    });
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
