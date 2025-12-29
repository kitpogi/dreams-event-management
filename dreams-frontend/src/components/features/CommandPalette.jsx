import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '../ui/command';
import { Home, Package, Image, Star, Calendar, LayoutDashboard, Users, Settings, LogOut, FileText, Building, Mail, BarChart3, ClipboardList } from 'lucide-react';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const publicRoutes = [
    { path: '/', label: 'Home', icon: Home, shortcut: 'H' },
    { path: '/services', label: 'Services', icon: Package, shortcut: 'S' },
    { path: '/portfolio', label: 'Portfolio', icon: Image, shortcut: 'P' },
    { path: '/reviews', label: 'Reviews', icon: Star, shortcut: 'R' },
    { path: '/packages', label: 'Packages', icon: Package, shortcut: 'PK' },
    { path: '/set-an-event', label: 'Set An Event', icon: Calendar, shortcut: 'E' },
    { path: '/contact-us', label: 'Contact Us', icon: Mail, shortcut: 'C' },
  ];

  const clientRoutes = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'D' },
  ];

  const adminRoutes = [
    { path: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, shortcut: 'AD' },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, shortcut: 'AN' },
    { path: '/admin/packages', label: 'Manage Packages', icon: Package, shortcut: 'MP' },
    { path: '/admin/bookings', label: 'Manage Bookings', icon: Calendar, shortcut: 'MB' },
    { path: '/admin/bookings/calendar', label: 'Bookings Calendar', icon: Calendar, shortcut: 'BC' },
    { path: '/admin/clients', label: 'Manage Clients', icon: Users, shortcut: 'MC' },
    { path: '/admin/contact-inquiries', label: 'Contact Inquiries', icon: Mail, shortcut: 'CI' },
    { path: '/admin/venues', label: 'Manage Venues', icon: Building, shortcut: 'MV' },
    { path: '/admin/portfolio', label: 'Portfolio', icon: Image, shortcut: 'PF' },
    { path: '/admin/testimonials', label: 'Testimonials', icon: FileText, shortcut: 'TM' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList, shortcut: 'AL' },
  ];

  const handleSelect = (path) => {
    if (path === 'logout') {
      logout();
      navigate('/');
    } else {
      navigate(path);
    }
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Public Routes */}
        <CommandGroup heading="Navigation">
          {publicRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <CommandItem
                key={route.path}
                onSelect={() => handleSelect(route.path)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{route.label}</span>
                {route.shortcut && (
                  <CommandShortcut>⌘{route.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Client Routes */}
        {isAuthenticated && !isAdmin && (
          <CommandGroup heading="Dashboard">
            {clientRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <CommandItem
                  key={route.path}
                  onSelect={() => handleSelect(route.path)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{route.label}</span>
                  {route.shortcut && (
                    <CommandShortcut>⌘{route.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Admin Routes */}
        {isAdmin && (
          <CommandGroup heading="Admin">
            {adminRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <CommandItem
                  key={route.path}
                  onSelect={() => handleSelect(route.path)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{route.label}</span>
                  {route.shortcut && (
                    <CommandShortcut>⌘{route.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Actions */}
        {isAuthenticated && (
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => handleSelect('logout')}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;

