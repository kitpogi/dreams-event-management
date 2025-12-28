import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { AuthModal } from '../modals';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Get the correct dashboard path based on user role
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <nav className="bg-[#FFF7F0] border-b border-[#e7dbcf]" role="navigation" aria-label="Main navigation">
      {/* Brand + quote, centered */}
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex-1"></div>
          
          {/* Center: Brand */}
          <div className="flex-1 text-center">
            <Link to="/" className="focus:outline-none focus:ring-0">
              <h1 className="font-serif text-xl md:text-2xl text-gray-900 hover:text-[#5A45F2] transition-colors">
                D&apos;Dreams Events and Styles
              </h1>
            </Link>
            <p className="text-[11px] md:text-xs text-gray-600 italic mt-0.5">
              "We make your dream events happen."
            </p>
          </div>

          {/* Right: Auth buttons */}
          <div className="flex-1 flex justify-end items-center gap-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#e7dbcf] transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2"
                  aria-expanded={showDropdown}
                  aria-haspopup="true"
                  aria-label={`User menu for ${user?.name || 'user'}`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#5A45F2] flex items-center justify-center text-white text-xs font-bold" aria-hidden="true">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:inline text-sm text-gray-700">{user?.name}</span>
                  <span className="material-symbols-outlined text-gray-700 text-lg" aria-hidden="true">
                    {showDropdown ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-[#e7dbcf] z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="py-1">
                      <Link
                        to={dashboardPath}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f7f6f8] focus:outline-none focus:bg-[#f7f6f8]"
                        onClick={() => setShowDropdown(false)}
                        role="menuitem"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-[#f7f6f8] focus:outline-none focus:bg-[#f7f6f8]"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-1.5 text-xs md:text-sm font-medium text-[#5A45F2] hover:text-[#4a37d8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 rounded"
                  aria-label="Open login modal"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-1.5 text-xs md:text-sm font-medium bg-[#5A45F2] text-white rounded-md hover:bg-[#4a37d8] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A45F2]"
                  aria-label="Open sign up modal"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nav strip */}
      <div className="border-t border-[#e7dbcf]">
        <div className="max-w-5xl mx-auto px-4 py-1.5 flex justify-center">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-[11px] md:text-xs font-medium tracking-[0.12em] uppercase text-gray-700" role="list">
            <Link 
              className="hover:text-[#5A45F2] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 rounded px-1" 
              to="/"
              role="listitem"
            >
              Home
            </Link>
            <Link 
              className="hover:text-[#5A45F2] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 rounded px-1" 
              to="/services"
              role="listitem"
            >
              Services
            </Link>
            <Link 
              className="hover:text-[#5A45F2] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 rounded px-1" 
              to="/portfolio"
              role="listitem"
            >
              Portfolio
            </Link>
            <Link 
              className="hover:text-[#5A45F2] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 rounded px-1" 
              to="/reviews"
              role="listitem"
            >
              Reviews
            </Link>
            <Link 
              className="hover:text-[#5A45F2] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 rounded px-1" 
              to="/set-an-event"
              role="listitem"
            >
              Set An Event
            </Link>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSuccess={() => {
          setShowAuthModal(false);
          // Determine dashboard path based on newly authenticated user
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const path = (userData.role === 'admin' || userData.role === 'coordinator') 
            ? '/admin/dashboard' 
            : '/dashboard';
          navigate(path);
        }}
      />
    </nav>
  );
};

export default Navbar;
