import axios from 'axios';

// Detect production environment more reliably
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.RAILWAY_ENVIRONMENT === 'production' ||
                    window.location.hostname !== 'localhost';

// In production, use relative URL since frontend and backend are served from same domain
// In development, use explicit localhost URL
const API_URL = process.env.REACT_APP_API_URL || (
  isProduction ? '/api' : 'http://localhost:8080/api'
);

console.log('API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  hostname: window.location.hostname,
  isProduction,
  API_URL
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