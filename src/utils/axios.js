import axios from 'axios';
import { auth } from '../firebase';

// Auto-select API URL: use production on vercel, localhost otherwise
const getApiUrl = () => {
  // In production (Vercel), always use the backend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    // Priority: env var > hardcoded backend URL
    return process.env.REACT_APP_API_URL_PROD || 'https://hamai-backend.vercel.app/api';
  }
  // In local development
  return process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL_LOCAL || 'http://localhost:5001/api';
};

const API_URL = getApiUrl();
console.log('🔗 API URL:', API_URL); // Debug log - check browser console to verify

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add Firebase token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
