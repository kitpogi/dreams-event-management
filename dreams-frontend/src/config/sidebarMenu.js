import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Package,
  Building2,
  Image,
  MessageSquare,
  Users,
  Mail,
  FileText,
  Layout,
} from 'lucide-react';

/**
 * Main navigation items (always visible at the top of the sidebar)
 * These items are displayed without being grouped in accordions
 */
export const mainMenuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/bookings/calendar', label: 'Calendar View', icon: Calendar },
];

/**
 * Organized menu groups (displayed in accordions when sidebar is expanded)
 * Each group contains related menu items
 */
export const menuGroups = [
  {
    id: 'bookings',
    label: 'Bookings',
    icon: Calendar,
    items: [
      { path: '/admin/bookings', label: 'All Bookings', icon: Calendar },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: Package,
    items: [
      { path: '/admin/packages', label: 'Packages', icon: Package },
      { path: '/admin/services', label: 'Services', icon: Layout },
      { path: '/admin/venues', label: 'Venues', icon: Building2 },
      { path: '/admin/portfolio', label: 'Portfolio', icon: Image },
      { path: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
      { path: '/admin/team', label: 'Our Team', icon: Users },
    ],
  },
  {
    id: 'users',
    label: 'Users & Clients',
    icon: Users,
    items: [
      { path: '/admin/clients', label: 'Clients', icon: Users },
      { path: '/admin/contact-inquiries', label: 'Inquiries', icon: Mail },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: FileText,
    items: [
      { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    ],
  },
];

/**
 * Get all menu items (main items + all group items) as a flat array
 * Useful for searching or iterating through all items
 */
export const getAllMenuItems = () => {
  const allItems = [...mainMenuItems];
  menuGroups.forEach((group) => {
    allItems.push(...group.items);
  });
  return allItems;
};

/**
 * Find a menu item by path
 * @param {string} path - The route path to find
 * @returns {object|null} - The menu item object or null if not found
 */
export const findMenuItemByPath = (path) => {
  const allItems = getAllMenuItems();
  return allItems.find((item) => item.path === path) || null;
};

/**
 * Get the parent group for a given menu item path
 * @param {string} path - The route path
 * @returns {object|null} - The parent group object or null if not found
 */
export const getParentGroup = (path) => {
  return menuGroups.find((group) =>
    group.items.some((item) => item.path === path)
  ) || null;
};

