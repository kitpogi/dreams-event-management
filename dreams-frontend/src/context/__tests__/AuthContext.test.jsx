import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../api/axios';

// Mock the axios instance
jest.mock('../../api/axios', () => {
  const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockAxios,
  };
});

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe('Initial State', () => {
    it('should have null user and token initially when no localStorage data', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('should load user from localStorage on mount', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'client' };
      const mockToken = 'test-token';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      api.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'client' };
      const mockToken = 'test-token';

      api.post.mockResolvedValueOnce({
        data: { token: mockToken, user: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return error when email or password is missing', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('', 'password123');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.message).toBe('Email and password are required');
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should handle login error with 401 status', async () => {
      api.post.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Invalid credentials' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.message).toBe('Invalid email or password');
    });

    it('should handle login error with 422 validation errors', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: {
              email: ['The email field is required'],
            },
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.message).toBe('The email field is required');
    });
  });

  describe('Register', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = { id: 1, email: 'new@example.com', role: 'client' };
      const mockToken = 'test-token';

      api.post.mockResolvedValueOnce({
        data: { token: mockToken, user: mockUser, message: 'Registration successful' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(registerResult.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle registration error with validation errors', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: {
              email: ['The email has already been taken'],
            },
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register({
          name: 'Test',
          email: 'existing@example.com',
          password: 'password123',
        });
      });

      expect(registerResult.success).toBe(false);
      expect(registerResult.message).toBe('The email has already been taken');
    });
  });

  describe('Logout', () => {
    it('should logout successfully and clear state', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'client' };
      const mockToken = 'test-token';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      api.post.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.getItem('token')).toBe(null);
      expect(localStorage.getItem('user')).toBe(null);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear state even if logout API call fails', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'client' };
      const mockToken = 'test-token';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      api.post.mockRejectedValueOnce({
        response: { status: 500 },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('token')).toBe(null);
      expect(localStorage.getItem('user')).toBe(null);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
    });
  });

  describe('fetchCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'client' };

      api.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let fetchResult;
      await act(async () => {
        fetchResult = await result.current.fetchCurrentUser();
      });

      expect(fetchResult.success).toBe(true);
      expect(fetchResult.user).toEqual(mockUser);
      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle fetch error and clear invalid token', async () => {
      localStorage.setItem('token', 'invalid-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      api.get.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let fetchResult;
      await act(async () => {
        fetchResult = await result.current.fetchCurrentUser();
      });

      expect(fetchResult.success).toBe(false);
      expect(localStorage.getItem('token')).toBe(null);
      expect(localStorage.getItem('user')).toBe(null);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
    });
  });

  describe('Role-based Access', () => {
    it('should identify admin user correctly', async () => {
      const mockUser = { id: 1, email: 'admin@example.com', role: 'admin' };
      const mockToken = 'test-token';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      api.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isCoordinator).toBe(false);
    });

    it('should identify coordinator user correctly', async () => {
      const mockUser = { id: 1, email: 'coordinator@example.com', role: 'coordinator' };
      const mockToken = 'test-token';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      api.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true); // Coordinators have admin privileges
      expect(result.current.isCoordinator).toBe(true);
    });

    it('should identify regular client user correctly', async () => {
      const mockUser = { id: 1, email: 'client@example.com', role: 'client' };
      const mockToken = 'test-token';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      api.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isCoordinator).toBe(false);
    });
  });

  describe('useAuth hook error handling', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});

