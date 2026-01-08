import apiClient from './apiClient';

/**
 * API Endpoints
 * All API calls to the backend server
 */

/**
 * Get all enabled coins/payment methods
 * @returns {Promise<Array>} Array of enabled coins
 */
export const getCoins = async () => {
  try {
    const response = await apiClient.get('/api/coins');
    return response.data.coins || [];
  } catch (error) {
    console.error('Error fetching coins:', error);
    
    // Better error messages
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.error || error.response.data?.message;
      
      if (status === 418) {
        throw new Error('Server configuration error. Please check backend server.');
      }
      
      throw new Error(message || `Server error (${status}). Please check your backend.`);
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Cannot connect to server. Make sure the backend is running on port 4000.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Failed to fetch payment methods');
    }
  }
};

/**
 * Create a new payment request
 * @param {string} method - Payment method code (e.g., 'btc', 'usdt-avax')
 * @param {number} amount - Payment amount
 * @returns {Promise<Object>} Payment data with paymentId, address, qrData
 */
export const createPayment = async (method, amount) => {
  try {
    if (!method || !amount || amount <= 0) {
      throw new Error('Invalid payment method or amount');
    }

    const response = await apiClient.post('/api/payment/create', {
      method,
      amount: parseFloat(amount),
    });

    return response.data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw new Error(error.response?.data?.error || 'Failed to create payment request');
  }
};

/**
 * Check payment status
 * @param {string} paymentId - Payment ID to check
 * @returns {Promise<Object>} Payment status with confirmed flag
 */
export const checkPaymentStatus = async (paymentId) => {
  try {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    const response = await apiClient.get(`/api/payment/status/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw new Error(error.response?.data?.error || 'Failed to check payment status');
  }
};

/**
 * Health check endpoint
 * @returns {Promise<Object>} Server health status
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error('Server is not available');
  }
};

