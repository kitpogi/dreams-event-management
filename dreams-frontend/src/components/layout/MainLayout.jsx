import Navbar from './Navbar';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';
import { CommandPalette, PageTransition, SkipLinks, KeyboardShortcuts, ScreenReaderAnnouncements } from '../features';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      <SkipLinks />
      <KeyboardShortcuts />
      <ScreenReaderAnnouncements />
      <Navbar />
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

