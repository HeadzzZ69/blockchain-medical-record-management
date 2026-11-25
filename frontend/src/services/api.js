import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('emr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        localStorage.removeItem('emr_token');
        error.userMessage = error.response.data?.message || 'Authentication required. Please reconnect your wallet.';
      } else if (status === 403) {
        error.userMessage =
          error.response.data?.message || 'Access Denied: You do not possess valid blockchain permission.';
      } else if (status === 404) {
        error.userMessage = error.response.data?.message || 'Requested record or endpoint was not found.';
      } else if (status === 409) {
        error.userMessage = error.response.data?.message || 'A conflicting record already exists in the system.';
      } else if (status === 422 || status === 400) {
        error.userMessage = error.response.data?.message || 'Validation Error: Please check request inputs.';
      } else if (status >= 500) {
        error.userMessage =
          error.response.data?.message || 'Server encountered an internal error. Please check backend logs.';
      } else {
        error.userMessage = error.response.data?.message || `Request failed with HTTP ${status}.`;
      }
    } else if (error.request) {
      error.userMessage =
        'Backend server is unreachable at ' + API_BASE_URL + '. Please ensure the Node.js server is started.';
    } else {
      error.userMessage = error.message || 'An unexpected client error occurred.';
    }
    return Promise.reject(error);
  }
);

export default api;
