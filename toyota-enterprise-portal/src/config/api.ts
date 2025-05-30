import axios from 'axios';

// Debug: Log the environment details
console.log('🔧 API Configuration Debug:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  window_hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
  window_port: typeof window !== 'undefined' ? window.location.port : 'server-side',
  window_href: typeof window !== 'undefined' ? window.location.href : 'server-side'
});

// Simple and reliable API URL configuration
let API_URL;

if (process.env.REACT_APP_API_URL) {
  // Use environment variable (set in Railway: REACT_APP_API_URL="/api")
  API_URL = process.env.REACT_APP_API_URL;
  console.log('🔧 Using REACT_APP_API_URL:', API_URL);
} else if (typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
)) {
  // Local development
  API_URL = 'http://localhost:8080/api';
  console.log('🏠 Local development detected - using localhost:', API_URL);
} else {
  // Production fallback (Railway, etc.)
  API_URL = '/api';
  console.log('🌍 Production environment - using relative API URL:', API_URL);
}

console.log('🔍 Final API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  finalAPI_URL: API_URL
});

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('📡 API Request:', config.method?.toUpperCase(), config.url, 'Base:', config.baseURL);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
); 