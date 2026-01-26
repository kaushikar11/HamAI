import axios from 'axios';
import { auth } from '../firebase';

// Auto-select API URL: use production on vercel, localhost otherwise
const API_URL = (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))
  ? (process.env.REACT_APP_API_URL_PROD || 'https://hamai.vercel.app/api')
  : (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL_LOCAL || 'http://localhost:5001/api');

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
