import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <nav className="bg-[#FFF7F0] border-b border-[#e7dbcf]">
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#e7dbcf] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#5A45F2] flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:inline text-sm text-gray-700">{user?.name}</span>
                  <span className="material-symbols-outlined text-gray-700 text-lg">
                    {showDropdown ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-[#e7dbcf] z-50">
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f7f6f8]"
                        onClick={() => setShowDropdown(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-[#f7f6f8]"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <button className="px-4 py-1.5 text-xs md:text-sm font-medium text-[#5A45F2] hover:text-[#4a37d8] transition-colors">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-4 py-1.5 text-xs md:text-sm font-medium bg-[#5A45F2] text-white rounded-md hover:bg-[#4a37d8] transition-colors">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nav strip */}
      <div className="border-t border-[#e7dbcf]">
        <div className="max-w-5xl mx-auto px-4 py-1.5 flex justify-center">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-[11px] md:text-xs font-medium tracking-[0.12em] uppercase text-gray-700">
            <Link className="hover:text-[#5A45F2] transition-colors duration-200" to="/">
              Home
            </Link>
            <Link className="hover:text-[#5A45F2] transition-colors duration-200" to="/services">
              Services
            </Link>
            <Link className="hover:text-[#5A45F2] transition-colors duration-200" to="/portfolio">
              Portfolio
            </Link>
            <Link className="hover:text-[#5A45F2] transition-colors duration-200" to="/reviews">
              Reviews
            </Link>
            <Link className="hover:text-[#5A45F2] transition-colors duration-200" to="/set-an-event">
              Set An Event
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
