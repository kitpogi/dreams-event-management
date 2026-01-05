import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

/**
 * Custom render function that includes all providers
 */
export const renderWithProviders = (
  ui,
  {
    route = '/',
    theme = 'light',
    authState = { isAuthenticated: false, user: null },
    ...renderOptions
  } = {}
) => {
  // Set up router
  window.history.pushState({}, 'Test page', route);

  // Set up localStorage for theme
  if (theme === 'dark') {
    localStorage.setItem('darkMode', 'true');
  } else {
    localStorage.setItem('darkMode', 'false');
  }

  // Set up localStorage for auth if user is provided
  if (authState.user) {
    localStorage.setItem('user', JSON.stringify(authState.user));
  } else {
    localStorage.removeItem('user');
  }

  if (authState.token) {
    localStorage.setItem('token', authState.token);
  } else {
    localStorage.removeItem('token');
  }

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Render component in dark mode
 */
export const renderDarkMode = (ui, options = {}) => {
  return renderWithProviders(ui, { ...options, theme: 'dark' });
};

/**
 * Render component in light mode
 */
export const renderLightMode = (ui, options = {}) => {
  return renderWithProviders(ui, { ...options, theme: 'light' });
};

/**
 * Mock window.matchMedia for responsive testing
 */
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

/**
 * Set viewport size for responsive testing
 */
export const setViewport = (width, height = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

/**
 * Common viewport sizes
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  largeDesktop: { width: 2560, height: 1440 },
};

/**
 * Wait for async updates
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock IntersectionObserver for scroll-based components
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
    };
  });
};

/**
 * Mock ResizeObserver for responsive components
 */
export const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

/**
 * Create a mock user for testing
 */
export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'client',
  ...overrides,
});

/**
 * Create mock booking for testing
 */
export const createMockBooking = (overrides = {}) => ({
  id: 1,
  booking_id: 1,
  booking_status: 'pending',
  event_date: '2024-12-25',
  event_venue: 'Test Venue',
  guest_count: 50,
  created_at: '2024-01-01T00:00:00Z',
  eventPackage: {
    package_id: 1,
    package_name: 'Test Package',
    package_price: 10000,
  },
  ...overrides,
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

