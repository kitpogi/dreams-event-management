import { useEffect, useRef } from 'react';

/**
 * Hook for managing focus in modals, dialogs, and dynamic content
 * @param {Object} options
 * @param {boolean} options.isOpen - Whether the element is open/visible
 * @param {boolean} options.autoFocus - Whether to auto-focus on open
 * @param {React.RefObject} options.initialFocusRef - Ref to element to focus initially
 * @param {React.RefObject} options.finalFocusRef - Ref to element to return focus to on close
 * @param {boolean} options.trapFocus - Whether to trap focus within the element
 */
export const useFocusManagement = ({
  isOpen,
  autoFocus = true,
  initialFocusRef,
  finalFocusRef,
  trapFocus = true,
} = {}) => {
  const containerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement;

    // Auto-focus on open
    if (autoFocus) {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        const firstFocusable = containerRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }

    // Focus trap
    if (trapFocus && containerRef.current) {
      const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      };

      containerRef.current.addEventListener('keydown', handleTabKey);

      return () => {
        containerRef.current?.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen, autoFocus, initialFocusRef, trapFocus]);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      if (finalFocusRef?.current) {
        finalFocusRef.current.focus();
      } else if (previousActiveElementRef.current instanceof HTMLElement) {
        previousActiveElementRef.current.focus();
      }
    }
  }, [isOpen, finalFocusRef]);

  return {
    containerRef,
  };
};

export default useFocusManagement;

