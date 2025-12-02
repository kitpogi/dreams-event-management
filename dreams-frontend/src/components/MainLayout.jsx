import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow min-h-screen px-4 py-10 bg-gray-50">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

