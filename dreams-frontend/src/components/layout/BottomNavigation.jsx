import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Image, Star, Calendar, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@/lib/utils';

const BottomNavigation = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  // Get the correct dashboard path based on user role
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/services', label: 'Services', icon: Package },
    { to: '/portfolio', label: 'Portfolio', icon: Image },
    { to: '/reviews', label: 'Reviews', icon: Star },
    ...(isAuthenticated
      ? [{ to: dashboardPath, label: 'Dashboard', icon: LayoutDashboard }]
      : [{ to: '/set-an-event', label: 'Set Event', icon: Calendar }]),
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg lg:hidden"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] min-w-[44px] rounded-lg transition-colors touch-manipulation',
                active
                  ? 'text-primary bg-primary/10 dark:bg-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;

