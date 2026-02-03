import axios from 'axios';

// Ensure API base URL is configured
const apiBaseURL = import.meta.env.VITE_API_BASE_URL;
if (!apiBaseURL) {
  console.warn('VITE_API_BASE_URL environment variable is not set.');
}

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect to login if not already on a public route
      const currentPath = window.location.pathname;
      const publicRoutePatterns = [
        /^\/$/,                    // Home page
        /^\/login/,                // Login page
        /^\/register/,             // Register page
        /^\/packages(\/|$)/,       // Packages pages (including /packages/:id)
        /^\/recommendations/,      // Recommendations page
      ];
      
      const isPublicRoute = publicRoutePatterns.some(pattern => 
        pattern.test(currentPath)
      );
      
      if (!isPublicRoute) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

