import axios from 'axios';

// In production, use relative URL since frontend and backend are served from same domain
// In development, use explicit localhost URL
const API_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api'
);

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