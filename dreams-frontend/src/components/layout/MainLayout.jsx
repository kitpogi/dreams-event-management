import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';
import { CommandPalette, PageTransition, SkipLinks, KeyboardShortcuts, ScreenReaderAnnouncements } from '../features';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isHome ? 'bg-[#0a0a1a]' : 'bg-white dark:bg-gray-900'}`}>
      <SkipLinks />
      <KeyboardShortcuts />
      <ScreenReaderAnnouncements />
      <Header />
      <CommandPalette />
      <main id="main-content" className="flex-grow pb-16 lg:pb-0" tabIndex={-1}>
        <PageTransition variant="fade">
          {children}
        </PageTransition>
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default MainLayout;

