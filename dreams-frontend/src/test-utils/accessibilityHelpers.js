import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Test component for accessibility violations
 * @param {HTMLElement} container - The container element to test
 * @param {Object} options - Axe options
 */
export const testA11y = async (container, options = {}) => {
  const results = await axe(container, {
    rules: {
      // Disable color-contrast rule in tests (handled separately)
      'color-contrast': { enabled: false },
    },
    ...options,
  });
  expect(results).toHaveNoViolations();
  return results;
};

/**
 * Check if element is keyboard accessible
 */
export const isKeyboardAccessible = (element) => {
  const tabIndex = element.getAttribute('tabindex');
  const role = element.getAttribute('role');
  const isButton = element.tagName === 'BUTTON';
  const isLink = element.tagName === 'A' && element.href;
  const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
  
  return (
    tabIndex !== '-1' ||
    isButton ||
    isLink ||
    isInput ||
    role === 'button' ||
    role === 'link' ||
    role === 'tab' ||
    role === 'menuitem'
  );
};

/**
 * Check if element has proper ARIA labels
 */
export const hasAriaLabels = (element) => {
  const hasLabel = element.getAttribute('aria-label');
  const hasLabelledBy = element.getAttribute('aria-labelledby');
  const hasTitle = element.getAttribute('title');
  const hasTextContent = element.textContent?.trim();
  const isLabeledByInput = element.closest('label');
  
  return hasLabel || hasLabelledBy || hasTitle || hasTextContent || isLabeledByInput;
};

/**
 * Check color contrast (basic check)
 */
export const checkColorContrast = (element) => {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;
  
  // This is a simplified check - in production, use a proper contrast checker
  return {
    hasColor: !!color && color !== 'rgba(0, 0, 0, 0)',
    hasBackground: !!backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)',
  };
};

/**
 * Test keyboard navigation
 */
export const testKeyboardNavigation = async (container, userEvent) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const results = [];
  
  for (const element of focusableElements) {
    try {
      await userEvent.tab();
      const isFocused = document.activeElement === element;
      results.push({
        element,
        isFocusable: isFocused,
      });
    } catch (error) {
      results.push({
        element,
        isFocusable: false,
        error: error.message,
      });
    }
  }
  
  return results;
};

/**
 * Test screen reader announcements
 */
export const testScreenReaderSupport = (element) => {
  const ariaLive = element.getAttribute('aria-live');
  const ariaAtomic = element.getAttribute('aria-atomic');
  const ariaRelevant = element.getAttribute('aria-relevant');
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  
  return {
    hasAriaLive: !!ariaLive,
    hasAriaAtomic: !!ariaAtomic,
    hasAriaRelevant: !!ariaRelevant,
    hasRole: !!role,
    hasAriaLabel: !!ariaLabel || !!ariaLabelledBy,
  };
};

