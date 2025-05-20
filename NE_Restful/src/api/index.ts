import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add a request interceptor to include the token in all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      // Return the error message from the server if available
      if (error.response.data && error.response.data.message) {
        return Promise.reject(new Error(error.response.data.message));
      }
    }
    return Promise.reject(error);
  }
);

export default axios;