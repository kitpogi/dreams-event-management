import { authService } from '../authService';
import api from '../../axios';

// Mock the axios instance
jest.mock('../../axios', () => {
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

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call POST /auth/login with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: 1, email, role: 'client' },
        },
      };

      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login(email, password);

      expect(api.post).toHaveBeenCalledWith('/auth/login', { email, password });
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle login errors', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };

      api.post.mockRejectedValueOnce(mockError);

      await expect(authService.login(email, password)).rejects.toEqual(mockError);
      expect(api.post).toHaveBeenCalledWith('/auth/login', { email, password });
    });
  });

  describe('register', () => {
    it('should call POST /auth/register with user data', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: 1, ...userData },
          message: 'Registration successful',
        },
      };

      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.register(userData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration errors', async () => {
      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
      };
      const mockError = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['The email has already been taken'],
            },
          },
        },
      };

      api.post.mockRejectedValueOnce(mockError);

      await expect(authService.register(userData)).rejects.toEqual(mockError);
      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
    });
  });

  describe('logout', () => {
    it('should call POST /auth/logout', async () => {
      const mockResponse = { data: { message: 'Logged out successfully' } };

      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle logout errors gracefully', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      };

      api.post.mockRejectedValueOnce(mockError);

      await expect(authService.logout()).rejects.toEqual(mockError);
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getCurrentUser', () => {
    it('should call GET /auth/me', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'test@example.com',
          role: 'client',
        },
      };

      api.get.mockResolvedValueOnce(mockResponse);

      const result = await authService.getCurrentUser();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle getCurrentUser errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      api.get.mockRejectedValueOnce(mockError);

      await expect(authService.getCurrentUser()).rejects.toEqual(mockError);
      expect(api.get).toHaveBeenCalledWith('/auth/me');
    });
  });
});

