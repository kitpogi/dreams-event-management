import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  HomeIcon,
  CubeIcon,
  CalendarDaysIcon,
  UsersIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    { path: '/admin/packages', label: 'Manage Packages', icon: CubeIcon },
    { path: '/admin/bookings', label: 'Manage Bookings', icon: CalendarDaysIcon },
    { path: '/admin/bookings/calendar', label: 'Bookings Calendar', icon: CalendarDaysIcon },
    { path: '/admin/clients', label: 'Manage Clients', icon: UsersIcon },
    { path: '/admin/contact-inquiries', label: 'Contact Inquiries', icon: EnvelopeIcon },
    { path: '/admin/venues', label: 'Manage Venues', icon: BuildingOfficeIcon },
    { path: '/admin/portfolio', label: 'Portfolio', icon: PhotoIcon },
    { path: '/admin/testimonials', label: 'Testimonials', icon: ChatBubbleLeftRightIcon },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: DocumentTextIcon },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white shadow-md min-h-screen p-6 fixed left-0 top-0 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Panel</h2>
        <p className="text-sm text-gray-500">Dreams Events</p>
      </div>
      <nav className="flex-1" aria-label="Admin navigation">
        <ul className="space-y-2" role="list">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path} role="listitem">
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User info and logout */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="mb-4 px-4">
          <p className="text-sm font-medium text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label="Logout from admin panel"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;

