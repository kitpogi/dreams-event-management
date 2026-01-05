import { createContext, useContext, useEffect, useState } from 'react';

// Create context with default values to prevent errors
const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {}
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Safe initialization that won't cause React loading errors
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('darkMode');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  
  // Apply theme to document on mount and changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
    } catch (error) {
      console.warn('Theme update failed:', error);
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

