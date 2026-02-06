import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Get from localStorage or default to false
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Check if we're on mobile (below lg breakpoint - 1024px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  // Sidebar width constants (matching Tailwind: w-20 = 5rem, w-64 = 16rem)
  // On mobile, sidebar is hidden in Sheet, so no margin needed
  // On desktop, apply margin based on collapsed state
  const sidebarWidth = isCollapsed ? '5rem' : '16rem';
  const mainContentMargin = isMobile ? '0' : sidebarWidth;
  const mainContentWidth = isMobile ? '100%' : `calc(100% - ${sidebarWidth})`;

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      toggleSidebar,
      sidebarWidth,
      mainContentMargin,
      mainContentWidth,
      isMobile
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

