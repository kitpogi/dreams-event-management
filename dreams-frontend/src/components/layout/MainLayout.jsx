import Navbar from './Navbar';
import Footer from './Footer';
import { CommandPalette } from '../features';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <CommandPalette />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

