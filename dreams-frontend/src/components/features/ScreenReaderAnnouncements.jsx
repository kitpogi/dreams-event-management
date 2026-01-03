import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScreenReaderAnnouncements component for live region announcements
 * Provides accessible announcements for screen readers
 */
export const ScreenReaderAnnouncements = () => {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');

  // Announce route changes
  useEffect(() => {
    const pageTitle = document.title || 'Page';
    setAnnouncement(`Navigated to ${pageTitle}`);
    
    // Clear announcement after screen reader has time to read it
    const timer = setTimeout(() => {
      setAnnouncement('');
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  /**
   * Function to announce a message to screen readers
   * Can be called from anywhere in the app
   */
  const announce = (message, priority = 'polite') => {
    setAnnouncement(message);
    
    // Clear after announcement
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  };

  // Expose announce function globally for use throughout the app
  useEffect(() => {
    window.announceToScreenReader = announce;
    return () => {
      delete window.announceToScreenReader;
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

/**
 * Hook to announce messages to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' | 'assertive'
 */
export const useScreenReaderAnnouncement = () => {
  const announce = (message, priority = 'polite') => {
    if (window.announceToScreenReader) {
      window.announceToScreenReader(message, priority);
    } else {
      // Fallback: create a temporary live region
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = message;
      document.body.appendChild(liveRegion);

      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
    }
  };

  return { announce };
};

export default ScreenReaderAnnouncements;

