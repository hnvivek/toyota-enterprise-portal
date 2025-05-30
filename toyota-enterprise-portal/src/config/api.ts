import axios from 'axios';

// Check if we're running on Railway or localhost
const isLocalDevelopment = typeof window !== 'undefined' && 
                          (window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1');

const isRailwayProduction = typeof window !== 'undefined' && 
                           window.location.hostname.includes('railway.app');

// API URL configuration - be very explicit
let API_URL;
if (process.env.REACT_APP_API_URL) {
  API_URL = process.env.REACT_APP_API_URL;
} else if (isRailwayProduction || (!isLocalDevelopment && typeof window !== 'undefined')) {
  API_URL = '/api'; // Production: same domain
} else {
  API_URL = 'http://localhost:8080/api'; // Development
}

console.log('API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  isLocalDevelopment,
  isRailwayProduction,
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
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
); 