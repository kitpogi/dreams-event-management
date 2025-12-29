// Mock axios before any imports
jest.mock('../../../api/axios', () => {
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

// Mock the auth context
const mockUseAuthReturn = {
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
};

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(() => mockUseAuthReturn),
  AuthProvider: ({ children }) => children,
}));

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import * as authContext from '../../../context/AuthContext';

describe('ProtectedRoute Component', () => {
  const TestComponent = () => <div>Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders loading state when auth is loading', () => {
    Object.assign(mockUseAuthReturn, {
      isAuthenticated: false,
      isAdmin: false,
      loading: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    Object.assign(mockUseAuthReturn, {
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    Object.assign(mockUseAuthReturn, {
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user is authenticated and admin route is not required', () => {
    Object.assign(mockUseAuthReturn, {
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin={false}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user is authenticated admin and admin route is required', () => {
    Object.assign(mockUseAuthReturn, {
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin={true}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects non-admin users when admin route is required', () => {
    Object.assign(mockUseAuthReturn, {
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute requireAdmin={true}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows coordinator users to access admin routes', () => {
    Object.assign(mockUseAuthReturn, {
      isAuthenticated: true,
      isAdmin: true, // Coordinators have admin privileges
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin={true}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
