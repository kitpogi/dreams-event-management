import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { ensureAbsoluteUrl } from '../utils/imageUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (storedToken && userData) {
      setToken(storedToken);
      setUser(JSON.parse(userData));
      // Fetch current user to verify token is still valid
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      // Backend may wrap response in a 'data' property
      const userData = response.data.data || response.data;

      // Ensure profile picture URL is absolute
      if (userData?.profile_picture) {
        userData.profile_picture = ensureAbsoluteUrl(userData.profile_picture);
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (error) {
      // Token invalid, clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user',
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Validate inputs before sending
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      const response = await api.post('/auth/login', { email, password });

      // Backend wraps response in a 'data' property
      const responseData = response.data.data || response.data;

      // Backend returns access_token, not token
      const newToken = responseData.access_token || responseData.token;
      const userData = responseData.user;

      // Ensure profile picture URL is absolute
      if (userData?.profile_picture) {
        userData.profile_picture = ensureAbsoluteUrl(userData.profile_picture);
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      let message = 'Login failed';

      if (error.response?.status === 422) {
        // Validation errors
        const errors = error.response.data?.errors;
        if (errors) {
          // Get first error message
          const errorKeys = Object.keys(errors);
          if (errorKeys.length > 0) {
            const firstError = errors[errorKeys[0]];
            message = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            message = error.response.data?.message || 'Validation failed';
          }
        } else {
          message = error.response.data?.message || message;
        }
      } else if (error.response?.status === 401) {
        message = 'Invalid email or password';
      } else {
        message = error.response?.data?.message || message;
      }

      console.error('Login error:', error.response?.data || error.message);

      return {
        success: false,
        message: message,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Backend wraps response in a 'data' property
      const responseData = response.data.data || response.data;
      // Backend returns access_token, not token
      const newToken = responseData.access_token || responseData.token;
      const newUser = responseData.user;
      const message = response.data.message;

      // Ensure profile picture URL is absolute
      if (newUser?.profile_picture) {
        newUser.profile_picture = ensureAbsoluteUrl(newUser.profile_picture);
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      return {
        success: true,
        message: message || 'Registration successful! Please check your email to verify your account.'
      };
    } catch (error) {
      let message = 'Registration failed';

      if (error.response?.status === 422) {
        // Validation errors
        const errors = error.response.data?.errors;
        if (errors) {
          const errorKeys = Object.keys(errors);
          if (errorKeys.length > 0) {
            const firstError = errors[errorKeys[0]];
            message = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            message = error.response.data?.message || message;
          }
        } else {
          message = error.response.data?.message || message;
        }
      } else {
        message = error.response?.data?.message || message;
      }

      return {
        success: false,
        message: message,
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Logout error:', error);
      }
    } finally {
      // Clear state first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    // Ensure profile picture URL is absolute before updating
    if (userData?.profile_picture) {
      userData.profile_picture = ensureAbsoluteUrl(userData.profile_picture);
    }
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    setUser,
    setToken,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateUser,
    loading,
    isAuthenticated: !!user && !!token,
    // Coordinators have admin privileges
    isAdmin: user?.role === 'admin' || user?.role === 'coordinator',
    isCoordinator: user?.role === 'coordinator',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

