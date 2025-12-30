import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { AuthModal } from '../modals';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, Sparkles, Package, Image, Star, Calendar, Home, Moon, Sun, Heart } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Get the correct dashboard path based on user role
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-menu')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/services', label: 'Services', icon: Package },
    { to: '/portfolio', label: 'Portfolio', icon: Image },
    { to: '/reviews', label: 'Reviews', icon: Star },
    { to: '/set-an-event', label: 'Set An Event', icon: Calendar },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? darkMode
              ? 'bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-800'
              : 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
            : darkMode
              ? 'bg-gray-900 border-b border-gray-800'
              : 'bg-[#FFF7F0] border-b border-[#e7dbcf]'
        }`}
        role="navigation" 
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Navbar */}
          <div className="flex items-center justify-between h-20">
            {/* Logo/Brand */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 rounded-lg p-2 -ml-2"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className={`font-serif text-xl md:text-2xl font-bold group-hover:text-[#5A45F2] transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  D&apos;Dreams Events
                </h1>
                <p className={`text-[10px] md:text-xs italic -mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  "We make your dream events happen."
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'text-[#5A45F2] bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20'
                        : darkMode
                          ? 'text-gray-300 hover:text-[#5A45F2] hover:bg-gray-800'
                          : 'text-gray-700 hover:text-[#5A45F2] hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#5A45F2] rounded-full"></span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Side - Dark Mode Toggle, Auth/User Menu */}
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-warning-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>

              {isAuthenticated ? (
                <div className="relative user-menu">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-gray-100'
                    }`}
                    aria-expanded={showDropdown}
                    aria-haspopup="true"
                    aria-label={`User menu for ${user?.name || 'user'}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className={`hidden md:inline text-sm font-medium max-w-[120px] truncate ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {user?.name}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      } ${showDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Enhanced Dropdown Menu */}
                  {showDropdown && (
                    <div 
                      className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border overflow-hidden z-50 animate-fade-in ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="p-2">
                        <div className={`px-3 py-2 mb-2 border-b ${
                          darkMode ? 'border-gray-700' : 'border-gray-100'
                        }`}>
                          <p className={`text-sm font-semibold truncate ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {user?.name}
                          </p>
                          <p className={`text-xs truncate ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {user?.email}
                          </p>
                        </div>
                        <Link
                          to={dashboardPath}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group ${
                            darkMode
                              ? 'text-gray-200 hover:bg-gradient-to-r hover:from-[#5A45F2]/20 hover:to-[#7c3aed]/20'
                              : 'text-gray-700 hover:bg-gradient-to-r hover:from-[#5A45F2]/10 hover:to-[#7c3aed]/10'
                          }`}
                          onClick={() => setShowDropdown(false)}
                          role="menuitem"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#5A45F2] group-hover:scale-110 transition-transform" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/favorites"
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group ${
                            darkMode
                              ? 'text-gray-200 hover:bg-gradient-to-r hover:from-[#5A45F2]/20 hover:to-[#7c3aed]/20'
                              : 'text-gray-700 hover:bg-gradient-to-r hover:from-[#5A45F2]/10 hover:to-[#7c3aed]/10'
                          }`}
                          onClick={() => setShowDropdown(false)}
                          role="menuitem"
                        >
                          <Heart className="w-4 h-4 text-[#5A45F2] group-hover:scale-110 transition-transform" />
                          <span>My Favorites</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group ${
                            darkMode
                              ? 'text-error-400 hover:bg-error-900/20'
                              : 'text-error-600 hover:bg-error-50'
                          }`}
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className={`group flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 ${
                      darkMode
                        ? 'text-[#7ee5ff] border-2 border-[#7ee5ff] hover:bg-[#7ee5ff]/10 hover:shadow-lg hover:shadow-[#7ee5ff]/20'
                        : 'text-[#5A45F2] border-2 border-[#5A45F2] hover:bg-[#5A45F2]/10 hover:shadow-lg hover:shadow-[#5A45F2]/20'
                    }`}
                    aria-label="Open login modal"
                  >
                    <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Login</span>
                  </button>
                  <button 
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                    className="group flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg hover:from-[#4a37d8] hover:to-[#6d28d9] transition-all shadow-lg hover:shadow-xl hover:shadow-[#5A45F2]/30 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2"
                    aria-label="Open sign up modal"
                  >
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}

              {/* Mobile Menu Button with Sheet */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`lg:hidden p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Toggle mobile menu"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className={`w-[300px] sm:w-[400px] ${
                    darkMode
                      ? 'bg-gray-900 border-gray-800'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <SheetHeader>
                    <SheetTitle className={`text-left ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Menu
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-1">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.to);
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                            active
                              ? 'text-[#5A45F2] bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20 border-l-4 border-[#5A45F2]'
                              : darkMode
                                ? 'text-gray-300 hover:text-[#5A45F2] hover:bg-gray-800'
                                : 'text-gray-700 hover:text-[#5A45F2] hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                    
                    {!isAuthenticated && (
                      <div className={`pt-4 mt-4 border-t space-y-2 ${
                        darkMode ? 'border-gray-800' : 'border-gray-200'
                      }`}>
                        <button 
                          onClick={() => {
                            setAuthMode('login');
                            setShowAuthModal(true);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full group flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold border-2 rounded-lg transition-all ${
                            darkMode
                              ? 'text-[#7ee5ff] border-[#7ee5ff] hover:bg-[#7ee5ff]/10 hover:shadow-lg hover:shadow-[#7ee5ff]/20'
                              : 'text-[#5A45F2] border-[#5A45F2] hover:bg-[#5A45F2]/10 hover:shadow-lg hover:shadow-[#5A45F2]/20'
                          }`}
                        >
                          <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span>Login</span>
                        </button>
                        <button 
                          onClick={() => {
                            setAuthMode('register');
                            setShowAuthModal(true);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full group flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg hover:from-[#4a37d8] hover:to-[#6d28d9] transition-all shadow-lg hover:shadow-xl hover:shadow-[#5A45F2]/30 transform hover:scale-105"
                        >
                          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                          <span>Sign Up</span>
                        </button>
                      </div>
                    )}

                    {isAuthenticated && (
                      <div className={`pt-4 mt-4 border-t space-y-2 ${
                        darkMode ? 'border-gray-800' : 'border-gray-200'
                      }`}>
                        <Link
                          to={dashboardPath}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                            darkMode
                              ? 'text-gray-300 hover:text-[#5A45F2] hover:bg-gray-800'
                              : 'text-gray-700 hover:text-[#5A45F2] hover:bg-gray-50'
                          }`}
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                            darkMode
                              ? 'text-gray-300 hover:text-[#5A45F2] hover:bg-gray-800'
                              : 'text-gray-700 hover:text-[#5A45F2] hover:bg-gray-50'
                          }`}
                        >
                          <Heart className="w-5 h-5" />
                          <span>My Favorites</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                            darkMode
                              ? 'text-error-400 hover:bg-error-900/20'
                              : 'text-error-600 hover:bg-error-50'
                          }`}
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20"></div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSuccess={() => {
          setShowAuthModal(false);
          setMobileMenuOpen(false);
          // Determine dashboard path based on newly authenticated user
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const path = (userData.role === 'admin' || userData.role === 'coordinator') 
            ? '/admin/dashboard' 
            : '/dashboard';
          navigate(path);
        }}
      />
    </>
  );
};

export default Navbar;
