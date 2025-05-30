import axios from 'axios';

// Check if we're running on Railway or localhost
const isLocalDevelopment = typeof window !== 'undefined' && 
                          (window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1');

const isRailwayProduction = typeof window !== 'undefined' && 
                           (window.location.hostname.includes('railway.app') || 
                            window.location.hostname.includes('up.railway.app'));

// API URL configuration - be very explicit
let API_URL;
if (process.env.REACT_APP_API_URL) {
  API_URL = process.env.REACT_APP_API_URL;
  console.log('🔧 Using REACT_APP_API_URL:', API_URL);
} else if (isRailwayProduction) {
  API_URL = '/api'; // Production: same domain
  console.log('🚂 Railway detected - using relative API URL:', API_URL);
} else if (isLocalDevelopment) {
  API_URL = 'http://localhost:8080/api'; // Development
  console.log('🏠 Local development detected - using localhost:', API_URL);
} else {
  // Fallback for any other environment
  API_URL = '/api';
  console.log('🌍 Unknown environment - using relative API URL:', API_URL);
}

console.log('🔍 API Configuration Debug:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  href: typeof window !== 'undefined' ? window.location.href : 'server',
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
        console.log('📡 API Request:', config.method?.toUpperCase(), config.url, 'Base:', config.baseURL);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
); 