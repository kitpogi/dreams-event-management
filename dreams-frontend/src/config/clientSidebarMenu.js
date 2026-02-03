import {
    LayoutDashboard,
    Calendar,
    Package,
    Sparkles,
    CreditCard,
    MessageSquare,
    Settings,
    LogOut,
    BookOpen,
    Star,
} from 'lucide-react';

/**
 * Client sidebar menu sections with grouped items
 * This provides better organization and visual hierarchy
 */
export const clientMenuSections = [
    {
        id: 'main',
        label: 'Main',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/dashboard/bookings', label: 'My Bookings', icon: BookOpen },
            { path: '/dashboard/packages', label: 'Packages', icon: Package },
            { path: '/dashboard/recommendations', label: 'For You', icon: Sparkles },
        ],
    },
    {
        id: 'account',
        label: 'Account',
        items: [
            { path: '/dashboard/payments', label: 'Payments', icon: CreditCard },
            { path: '/dashboard/reviews', label: 'My Reviews', icon: Star },
            { path: '/profile/settings', label: 'Settings', icon: Settings },
        ],
    },
];

/**
 * Client sidebar menu items (flat array for backwards compatibility)
 * These items are displayed in the client dashboard sidebar
 */
export const clientMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/bookings', label: 'My Bookings', icon: BookOpen },
    { path: '/dashboard/packages', label: 'Packages', icon: Package },
    { path: '/dashboard/recommendations', label: 'For You', icon: Sparkles },
    { path: '/dashboard/payments', label: 'Payments', icon: CreditCard },
    { path: '/dashboard/reviews', label: 'My Reviews', icon: Star },
    { path: '/profile/settings', label: 'Settings', icon: Settings },
];

/**
 * Check if a menu item path matches the current location
 * Handles query params for tabs/views
 * @param {string} itemPath - The menu item path
 * @param {string} currentPath - The current location pathname
 * @param {string} currentSearch - The current location search (query params)
 * @returns {boolean}
 */
export const isMenuItemActive = (itemPath, currentPath, currentSearch = '') => {
    // Split path and query
    const [path, query] = itemPath.split('?');

    // Check if path matches
    if (path !== currentPath) return false;

    // If no query in item path, it matches any query on current path
    if (!query) return true;

    // Parse query params
    const itemParams = new URLSearchParams(query);
    const currentParams = new URLSearchParams(currentSearch);

    // Check if all item params match current params
    for (const [key, value] of itemParams.entries()) {
        if (currentParams.get(key) !== value) {
            return false;
        }
    }

    return true;
};

/**
 * Get all menu items as a flat array
 * @returns {Array}
 */
export const getAllClientMenuItems = () => {
    return [...clientMenuItems];
};

/**
 * Find a menu item by path
 * @param {string} path - The route path to find
 * @returns {object|null} - The menu item object or null if not found
 */
export const findClientMenuItemByPath = (path) => {
    return clientMenuItems.find((item) => {
        const [itemPath] = item.path.split('?');
        return itemPath === path;
    }) || null;
};
