import { useEffect, useRef } from 'react';

/**
 * Hook for keyboard navigation support
 * @param {Object} options
 * @param {boolean} options.enabled - Whether keyboard navigation is enabled
 * @param {Array} options.items - Array of refs or selectors for navigable items
 * @param {string} options.orientation - 'horizontal' | 'vertical' | 'both'
 * @returns {Object} - { containerRef, handleKeyDown }
 */
export const useKeyboardNavigation = ({
  enabled = true,
  items = [],
  orientation = 'both',
} = {}) => {
  const containerRef = useRef(null);
  const currentIndexRef = useRef(-1);

  const handleKeyDown = (e) => {
    if (!enabled) return;

    const { key, target } = e;
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
    const isHomeEnd = ['Home', 'End'].includes(key);

    if (!isArrowKey && !isHomeEnd) return;

    // Get all focusable items
    const focusableItems = items.length > 0
      ? items
      : containerRef.current
        ? Array.from(
            containerRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.disabled && el.offsetParent !== null)
        : [];

    if (focusableItems.length === 0) return;

    // Find current index
    const currentIndex = focusableItems.indexOf(target);
    currentIndexRef.current = currentIndex >= 0 ? currentIndex : 0;

    let nextIndex = currentIndexRef.current;

    // Handle navigation
    if (key === 'ArrowDown' && (orientation === 'vertical' || orientation === 'both')) {
      e.preventDefault();
      nextIndex = (currentIndexRef.current + 1) % focusableItems.length;
    } else if (key === 'ArrowUp' && (orientation === 'vertical' || orientation === 'both')) {
      e.preventDefault();
      nextIndex = currentIndexRef.current <= 0
        ? focusableItems.length - 1
        : currentIndexRef.current - 1;
    } else if (key === 'ArrowRight' && (orientation === 'horizontal' || orientation === 'both')) {
      e.preventDefault();
      nextIndex = (currentIndexRef.current + 1) % focusableItems.length;
    } else if (key === 'ArrowLeft' && (orientation === 'horizontal' || orientation === 'both')) {
      e.preventDefault();
      nextIndex = currentIndexRef.current <= 0
        ? focusableItems.length - 1
        : currentIndexRef.current - 1;
    } else if (key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (key === 'End') {
      e.preventDefault();
      nextIndex = focusableItems.length - 1;
    }

    // Focus the next item
    if (focusableItems[nextIndex]) {
      focusableItems[nextIndex].focus();
      currentIndexRef.current = nextIndex;
    }
  };

  return {
    containerRef,
    handleKeyDown,
  };
};

export default useKeyboardNavigation;

