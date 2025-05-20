import axios, { AxiosInstance } from 'axios';

// Base URL for all API calls
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.parkingmanagement.com/api'
  : 'http://localhost:5000/api';

// Common headers for both instances
const commonHeaders = {
  'Content-Type': 'application/json',
};

// Unauthorized API instance (no auth headers)
export const unauthorizedAPI: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: commonHeaders,
});

// Authorized API instance (adds Bearer token from localStorage)
export const authorizedAPI: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: commonHeaders,
});

// Request interceptor for authorizedAPI to add auth token
authorizedAPI.interceptors.request.use(
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

// Response interceptor for both instances to handle errors
const handleResponseError = (error: any) => {
  if (error.response && error.response.status === 401) {
    // Clear localStorage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

unauthorizedAPI.interceptors.response.use(
  (response) => response,
  handleResponseError
);

authorizedAPI.interceptors.response.use(
  (response) => response,
  handleResponseError
);