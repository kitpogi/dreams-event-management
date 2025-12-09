import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/packages', label: 'Manage Packages', icon: '📦' },
    { path: '/admin/bookings', label: 'Manage Bookings', icon: '📅' },
    { path: '/admin/clients', label: 'Manage Clients', icon: '👥' },
    { path: '/admin/contact-inquiries', label: 'Contact Inquiries', icon: '📧' },
    { path: '/admin/venues', label: 'Manage Venues', icon: '🏢' },
    { path: '/admin/portfolio', label: 'Portfolio', icon: '📸' },
    { path: '/admin/testimonials', label: 'Testimonials', icon: '💬' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <aside className="w-64 bg-white shadow-md min-h-screen p-6 fixed left-0 top-0 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Panel</h2>
        <p className="text-sm text-gray-500">Dreams Events</p>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
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
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

