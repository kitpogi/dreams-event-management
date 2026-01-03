import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import CommandPalette from './CommandPalette';

/**
 * KeyboardShortcuts component for global keyboard shortcuts
 * Handles common shortcuts like Cmd+K for command palette, etc.
 */
export const KeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  const { toggleDarkMode } = useTheme();
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K - Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // Escape - Close modals/command palette
      if (e.key === 'Escape') {
        if (showCommandPalette) {
          setShowCommandPalette(false);
          return;
        }
      }

      // Alt + N - Navigate to home
      if (e.altKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        navigate('/');
        return;
      }

      // Alt + D - Navigate to dashboard (if authenticated)
      if (e.altKey && e.key === 'd' && isAuthenticated) {
        e.preventDefault();
        const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';
        navigate(dashboardPath);
        return;
      }

      // Alt + P - Navigate to packages
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        navigate('/packages');
        return;
      }

      // Alt + S - Navigate to services
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        navigate('/services');
        return;
      }

      // Alt + T - Toggle dark mode
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        toggleDarkMode();
        return;
      }

      // Alt + / - Show keyboard shortcuts help
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        // Could show a help modal here
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, isAuthenticated, isAdmin, showCommandPalette, toggleDarkMode]);

  return (
    <>
      <CommandPalette 
        open={showCommandPalette} 
        onOpenChange={setShowCommandPalette} 
      />
    </>
  );
};

export default KeyboardShortcuts;

