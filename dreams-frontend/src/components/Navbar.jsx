import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import Button from './Button';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-white hover:text-gray-200">
            Dreams Events
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-gray-200 transition-colors">
              Home
            </Link>
            <Link to="/packages" className="text-white hover:text-gray-200 transition-colors">
              Packages
            </Link>
            <Link to="/recommendations" className="text-white hover:text-gray-200 transition-colors">
              Recommendations
            </Link>
            
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <>
                    <Link to="/admin/dashboard" className="text-white hover:text-gray-200 transition-colors">
                      Admin Dashboard
                    </Link>
                    <Link to="/admin/packages" className="text-white hover:text-gray-200 transition-colors">
                      Manage Packages
                    </Link>
                    <Link to="/admin/bookings" className="text-white hover:text-gray-200 transition-colors">
                      Manage Bookings
                    </Link>
                  </>
                ) : (
                  <Link to="/dashboard" className="text-white hover:text-gray-200 transition-colors">
                    Dashboard
                  </Link>
                )}
                <span className="text-gray-200">Welcome, {user?.name}</span>
                <Button variant="outline" className="text-white border-white hover:bg-white hover:text-primary" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-gray-200 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="text-white hover:text-gray-200 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link to="/" className="block text-white hover:text-gray-200 py-2">Home</Link>
            <Link to="/packages" className="block text-white hover:text-gray-200 py-2">Packages</Link>
            <Link to="/recommendations" className="block text-white hover:text-gray-200 py-2">Recommendations</Link>
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <>
                    <Link to="/admin/dashboard" className="block text-white hover:text-gray-200 py-2">Admin Dashboard</Link>
                    <Link to="/admin/packages" className="block text-white hover:text-gray-200 py-2">Manage Packages</Link>
                    <Link to="/admin/bookings" className="block text-white hover:text-gray-200 py-2">Manage Bookings</Link>
                  </>
                ) : (
                  <Link to="/dashboard" className="block text-white hover:text-gray-200 py-2">Dashboard</Link>
                )}
                <span className="block text-gray-200 py-2">Welcome, {user?.name}</span>
                <Button variant="outline" className="w-full text-white border-white" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-white hover:text-gray-200 py-2">Login</Link>
                <Link to="/register" className="block text-white hover:text-gray-200 py-2">Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

