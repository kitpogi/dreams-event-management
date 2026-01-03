import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * SkipLinks component for keyboard navigation accessibility
 * Provides skip links to main content areas
 */
export const SkipLinks = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Show skip links when Tab is pressed
      if (e.key === 'Tab' && !e.shiftKey && !isVisible) {
        setIsVisible(true);
      }
    };

    const handleClick = () => {
      setIsVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [isVisible]);

  const skipLinks = [
    { id: 'main-content', label: 'Skip to main content', href: '#main-content' },
    { id: 'navigation', label: 'Skip to navigation', href: '#main-navigation' },
    { id: 'footer', label: 'Skip to footer', href: '#footer' },
  ];

  // Add admin-specific skip links if on admin pages
  if (location.pathname.startsWith('/admin')) {
    skipLinks.push(
      { id: 'admin-sidebar', label: 'Skip to sidebar', href: '#admin-sidebar' },
      { id: 'admin-content', label: 'Skip to admin content', href: '#admin-content' }
    );
  }

  if (!isVisible) return null;

  return (
    <div className="skip-links-container">
      {skipLinks.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className={cn(
            'skip-link',
            'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
            'z-[100] px-4 py-2 bg-primary text-primary-foreground',
            'rounded-md shadow-lg font-medium',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'transition-all duration-200'
          )}
          onClick={(e) => {
            e.preventDefault();
            const element = document.querySelector(link.href);
            if (element) {
              element.focus();
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setIsVisible(false);
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

export default SkipLinks;

