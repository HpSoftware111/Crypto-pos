import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for logging (development only)
apiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('[API Error Response]', {
        status: status,
        data: data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
      
      // Handle specific error codes
      if (status === 418) {
        console.error('[418 Error] This usually indicates a server configuration issue');
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('[API Network Error]', {
        message: 'No response from server',
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      });
    } else {
      // Something else happened
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

