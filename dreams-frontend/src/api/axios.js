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
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Try to refresh the token
          // We use axios directly to avoid interceptors on the refresh call
          const response = await axios.post(`${apiBaseURL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { access_token } = response.data.data || response.data;

          if (access_token) {
            localStorage.setItem('token', access_token);

            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;

            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear everything
          console.error('Token refresh failed:', refreshError);
        }
      }

      // If we reach here, refresh failed or no refresh token exists
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
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
        // We can't easily update AuthContext state here, but a redirect will 
        // reload the app and AuthContext status will be synchronized with localStorage
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

