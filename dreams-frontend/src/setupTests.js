import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers for accessibility
expect.extend(toHaveNoViolations);

// Mock imageUtils to avoid import.meta.env issues in Jest
jest.mock('./utils/imageUtils', () => {
  const actualModule = jest.requireActual('./utils/__mocks__/imageUtils');
  return actualModule;
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Polyfill for Pointer Capture API (required by Radix UI components in jsdom)
// This is needed because jsdom doesn't fully implement the Pointer Events API
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || function() {
    return false;
  };
  
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || function() {
    // No-op in test environment
  };
  
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || function() {
    // No-op in test environment
  };
  
  // Polyfill for scrollIntoView (required by Radix UI Select and other components)
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function() {
    // No-op in test environment
  };
}

