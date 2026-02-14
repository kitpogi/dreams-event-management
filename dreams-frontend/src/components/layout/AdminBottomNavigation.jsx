import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Package, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Bottom navigation for admin dashboard - shown only on mobile
 * Dark blue gradient theme to match admin sidebar
 */
const AdminBottomNavigation = () => {
    const location = useLocation();

    // Key admin navigation items for mobile
    const navItems = [
        { to: '/admin/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
        { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
        { to: '/admin/packages', label: 'Packages', icon: Package },
        { to: '/admin/clients', label: 'Clients', icon: Users },
        { to: '/admin/audit-logs', label: 'System', icon: Settings },
    ];

    const isActive = (path, exact = false) => {
        if (exact) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a1628]/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-blue-900/20 shadow-lg lg:hidden safe-area-bottom px-4"
            role="navigation"
            aria-label="Admin navigation"
        >
            <div className="flex items-center justify-around h-16 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to, item.exact);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 touch-manipulation',
                                active
                                    ? 'text-blue-500 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                            )}
                            aria-label={item.label}
                            aria-current={active ? 'page' : undefined}
                        >
                            <div className={cn(
                                'p-1.5 rounded-lg transition-all duration-200',
                                active && 'bg-blue-100 dark:bg-blue-900/30'
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium',
                                active && 'font-semibold'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default AdminBottomNavigation;
