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
import { Menu, X, User, LogOut, LayoutDashboard, Sparkles, Package, Image, Star, Calendar, Home, Moon, Sun, Heart, MessageCircle } from 'lucide-react';
import { NotificationCenter } from '../features';
import { ensureAbsoluteUrl } from '../../utils/imageUtils';
import logo from '../../assets/logo.png';

const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  // Get the correct dashboard path based on user role
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

  const [activeSection, setActiveSection] = useState('main-header');

  // Unified scroll handler for transparency and scroll spy
  useEffect(() => {
    const handleScroll = () => {
      // transparency effect
      setScrolled(window.scrollY > 20);

      // scroll spy effect for home page
      if (location.pathname === '/') {
        const sections = navLinks.map(link => link.sectionId);
        const currentSection = sections.find(id => {
          const element = document.getElementById(id);
          if (element) {
            const rect = element.getBoundingClientRect();
            // Buffer of 150px for better detection
            return rect.top <= 150 && rect.bottom >= 150;
          }
          return false;
        });

        if (currentSection) {
          setActiveSection(currentSection);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

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

  const scrollToSection = (sectionId) => {
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
        setMobileMenuOpen(false);
      }
    } else {
      navigate('/#' + sectionId);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home, sectionId: 'hero' },
    { to: '/services', label: 'Services', icon: Package, sectionId: 'services' },
    { to: '/packages', label: 'Packages', icon: Sparkles, sectionId: 'packages' },
    { to: '/portfolio', label: 'Portfolio', icon: Image, sectionId: 'portfolio' },
    { to: '/reviews', label: 'Reviews', icon: Star, sectionId: 'reviews' },
    { to: '/set-an-event', label: 'Set An Event', icon: Calendar },
    { to: '/#contact', label: 'Contact', icon: MessageCircle, sectionId: 'contact' },
  ];

  return (
    <>
      <header
        id="main-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-white/5 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border-b border-white/5 py-0'
          : 'bg-transparent border-transparent py-2'
          }`}
      >
        <div className="w-full px-4 md:px-6 xl:px-20">
          {/* Main Header Content */}
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo/Brand */}
            <Link
              to="/"
              className="flex items-center gap-1.5 xl:gap-2 group focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 rounded-2xl p-1.5 -ml-2 transition-all duration-300 relative"
            >
              <div className="relative">
                <div className="relative w-10 h-10 xl:w-14 xl:h-14 flex items-center justify-center group-hover:scale-110 transition-all duration-500 rounded-xl xl:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#5A45F2]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img
                    src={logo}
                    alt="D'Dreams Events Logo"
                    className="w-7 h-7 xl:w-10 xl:h-10 object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)] brightness-110 contrast-110 transition-all group-hover:rotate-6"
                  />
                </div>
                {/* Floating Glow Orb behind logo */}
                <div className="absolute -inset-2 bg-[#5A45F2]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              </div>
              <div className="hidden sm:block">
                <div className="flex flex-col">
                  <h1 className="font-serif text-base xl:text-2xl font-black tracking-tight text-white group-hover:text-[#7ee5ff] transition-colors uppercase leading-none">
                    D&apos;Dreams
                  </h1>
                  <div className="hidden xl:flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-[#7ee5ff] uppercase tracking-[0.3em] transition-all group-hover:tracking-[0.4em]">
                      Events & Styles
                    </span>
                    <div className="h-px w-4 bg-white/20 group-hover:w-8 transition-all" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links - Tightened for standard laptops */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5" aria-label="Desktop navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive('/')
                  ? activeSection === link.sectionId
                  : isActive(link.to);

                return (
                  <button
                    key={link.to}
                    onClick={() => {
                      // If on Home page and clicking a link that has an ID
                      if (isActive('/') && link.sectionId) {
                        // If we're already looking at this section, navigate to full page
                        // Exception for Home/Hero which should just stay/scroll to top
                        if (activeSection === link.sectionId && link.to !== '/') {
                          navigate(link.to);
                        } else {
                          scrollToSection(link.sectionId);
                        }
                      } else {
                        navigate(link.to);
                      }
                    }}
                    className={`relative flex items-center gap-1.5 px-2 py-2 xl:px-4 xl:py-2.5 rounded-xl xl:rounded-2xl text-[9px] xl:text-[10px] font-black uppercase tracking-tight xl:tracking-[0.2em] transition-all duration-500 group border overflow-hidden ${active
                      ? 'text-[#7ee5ff] bg-white/5 border-white/20 shadow-[0_0_25px_rgba(90,69,242,0.15)] backdrop-blur-md'
                      : 'text-white/50 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
                      }`}
                  >
                    {/* Hover Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className={`relative p-1 xl:p-1.5 rounded-lg transition-all duration-500 ${active ? 'bg-[#5A45F2]/20 scale-110' : 'bg-transparent group-hover:bg-white/5 group-hover:scale-110'}`}>
                      <Icon className={`w-3 h-3 xl:w-3.5 xl:h-3.5 transition-all duration-500 ${active ? 'text-[#7ee5ff] drop-shadow-[0_0_8px_#7ee5ff]' : 'text-current group-hover:text-[#5A45F2]'}`} />
                    </div>
                    <span className="whitespace-nowrap uppercase tracking-widest leading-none">
                      {link.label}
                    </span>

                    {/* Active Underline Glow */}
                    {active && (
                      <span className="absolute -bottom-px left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#7ee5ff] to-transparent shadow-[0_0_10px_#7ee5ff]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Side - Dark Mode Toggle, Auth/User Menu */}
            <div className="flex items-center gap-2 xl:gap-3">


              {isAuthenticated ? (
                <>
                  <NotificationCenter />
                  <div className="relative user-menu">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className={`group relative p-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 ${darkMode
                        ? 'hover:bg-gray-800/50'
                        : 'hover:bg-gray-100/80'
                        }`}
                      aria-expanded={showDropdown}
                      aria-haspopup="true"
                      aria-label={`User menu for ${user?.name || 'user'}`}
                    >
                      <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-white/20 dark:ring-gray-700/30 overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#5A45F2]/20">
                        {user?.profile_picture ? (
                          <img
                            src={ensureAbsoluteUrl(user.profile_picture)}
                            alt={user?.name || 'Profile'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              // Fallback to initials if image fails
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span style={{ display: user?.profile_picture ? 'none' : 'block' }} className="transition-transform duration-300 group-hover:scale-110">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      {/* Active Status Indicator with pulse animation - positioned outside avatar */}
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-lg z-10">
                        <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></span>
                      </span>
                    </button>

                    {/* Enhanced Dropdown Menu */}
                    {showDropdown && (
                      <div
                        className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border overflow-hidden z-50 animate-fade-in ${darkMode
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-200'
                          }`}
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <div className="p-2">
                          <div className={`px-3 py-2 mb-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'
                            }`}>
                            <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                              {user?.name}
                            </p>
                            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              {user?.email}
                            </p>
                          </div>
                          <Link
                            to={dashboardPath}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group ${darkMode
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
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group ${darkMode
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
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group ${darkMode
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
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-4">
                  <button
                    onMouseEnter={() => setHoveredBtn('login')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none ${hoveredBtn === 'login'
                      ? 'bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white shadow-lg shadow-[#5A45F2]/20'
                      : isActive('/') || darkMode
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-gray-600 hover:text-[#5A45F2] hover:bg-[#5A45F2]/10'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    onMouseEnter={() => setHoveredBtn('register')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                    className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 ${hoveredBtn === 'login'
                      ? isActive('/') || darkMode
                        ? 'text-white/90 hover:bg-white/10'
                        : 'text-gray-600 hover:bg-[#5A45F2]/10'
                      : 'bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white shadow-lg shadow-[#5A45F2]/20'
                      }`}
                  >
                    Get Started
                  </button>
                </div>
              )}

              {/* Mobile Menu Button with Sheet */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`lg:hidden p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2 ${darkMode
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
                  className={`w-[300px] sm:w-[400px] ${darkMode
                    ? 'bg-gray-900 border-gray-800'
                    : 'bg-white border-gray-200'
                    }`}
                >
                  <SheetHeader>
                    <SheetTitle className={`text-left ${darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                      Menu
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-1" aria-label="Mobile navigation">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const active = isActive('/')
                        ? activeSection === link.sectionId
                        : isActive(link.to);

                      return (
                        <button
                          key={link.to}
                          onClick={() => {
                            if (isActive('/') && link.sectionId) {
                              if (activeSection === link.sectionId && link.to !== '/') {
                                navigate(link.to);
                                setMobileMenuOpen(false);
                              } else {
                                scrollToSection(link.sectionId);
                              }
                            } else {
                              navigate(link.to);
                              setMobileMenuOpen(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${active
                            ? 'text-[#5A45F2] bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20 border-l-4 border-[#5A45F2]'
                            : darkMode
                              ? 'text-gray-300 hover:text-[#5A45F2] hover:bg-gray-800'
                              : 'text-gray-700 hover:text-[#5A45F2] hover:bg-gray-50'
                            }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{link.label}</span>
                        </button>
                      );
                    })}

                    {!isAuthenticated && (
                      <div className={`pt-4 mt-4 border-t space-y-2 ${darkMode ? 'border-gray-800' : 'border-gray-200'
                        }`}>
                        <button
                          onClick={() => {
                            setAuthMode('login');
                            setShowAuthModal(true);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full group flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold border-2 rounded-lg transition-all ${darkMode
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
                      <div className={`pt-4 mt-4 border-t space-y-2 ${darkMode ? 'border-gray-800' : 'border-gray-200'
                        }`}>
                        <Link
                          to={dashboardPath}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${darkMode
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
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${darkMode
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
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${darkMode
                            ? 'text-error-400 hover:bg-error-900/20'
                            : 'text-error-600 hover:bg-error-50'
                            }`}
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

      </header>

      {/* Spacer to prevent content from going under fixed navbar - Hidden on Home for immersion */}
      {/* Spacer removed to allow blending with page backgrounds */}

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
          // Small delay to allow React state to update before navigating
          setTimeout(() => navigate(path), 100);
        }}
      />
    </>
  );
};

export default Header;
