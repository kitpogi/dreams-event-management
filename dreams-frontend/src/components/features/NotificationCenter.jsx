import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  X,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  UserPlus,
  Users,
  Filter,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../ui/popover';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const NotificationCenter = () => {
  const { user, isAdmin, isCoordinator, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const isAdminUser = isAdmin || isCoordinator;

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (isAuthenticated) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      // Clear notifications if user is not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAdminUser, isAuthenticated]);

  const fetchNotifications = async () => {
    // Don't fetch if user is not authenticated
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const allNotifications = [];

      // Fetch bookings
      try {
        const bookingsResponse = await api.get('/bookings');
        const bookings = bookingsResponse.data.data || bookingsResponse.data || [];

        if (isAdminUser) {
          // Admin-specific notifications
          const adminNotifications = generateAdminNotifications(bookings);
          allNotifications.push(...adminNotifications);

          // Fetch contact inquiries for admins
          try {
            const inquiriesResponse = await api.get('/contact-inquiries');
            const inquiries = inquiriesResponse.data.data || inquiriesResponse.data || [];
            const inquiryNotifications = generateInquiryNotifications(inquiries);
            allNotifications.push(...inquiryNotifications);
          } catch (error) {
            // Silently handle 401 errors (user might have logged out)
            if (error.response?.status !== 401) {
              console.error('Error fetching contact inquiries:', error);
            }
          }
        } else {
          // Client-specific notifications
          const clientNotifications = generateClientNotifications(bookings);
          allNotifications.push(...clientNotifications);
        }
      } catch (error) {
        // Silently handle 401 errors (user might have logged out)
        if (error.response?.status === 401) {
          // Token expired or invalid, clear notifications
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        console.error('Error fetching bookings:', error);
      }

      // Sort by date (newest first)
      const sortedNotifications = allNotifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter((n) => !n.read).length);
    } catch (error) {
      // Silently handle 401 errors (user might have logged out)
      if (error.response?.status !== 401) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAdminNotifications = (bookings) => {
    const notifications = [];
    const now = new Date();

    // Pending bookings that need approval
    const pendingBookings = bookings.filter(
      (b) => (b.booking_status || b.status || '').toLowerCase() === 'pending'
    );
    if (pendingBookings.length > 0) {
      notifications.push({
        id: 'pending-bookings-summary',
        type: 'warning',
        title: `${pendingBookings.length} Booking${pendingBookings.length !== 1 ? 's' : ''} Pending Approval`,
        message: `${pendingBookings.length} booking${pendingBookings.length !== 1 ? 's' : ''} need${pendingBookings.length === 1 ? 's' : ''} your review`,
        icon: Clock,
        read: false,
        createdAt: pendingBookings[0]?.created_at || now.toISOString(),
        action: {
          type: 'navigate',
          path: '/admin/bookings',
          params: { status: 'pending' },
        },
        category: 'bookings',
      });
    }

    // Bookings without coordinators
    const unassignedBookings = bookings.filter(
      (b) =>
        !b.coordinator_id &&
        (b.booking_status || b.status || '').toLowerCase() !== 'cancelled' &&
        (b.booking_status || b.status || '').toLowerCase() !== 'pending'
    );
    if (unassignedBookings.length > 0) {
      notifications.push({
        id: 'unassigned-coordinators',
        type: 'info',
        title: `${unassignedBookings.length} Booking${unassignedBookings.length !== 1 ? 's' : ''} Need Coordinator`,
        message: `${unassignedBookings.length} booking${unassignedBookings.length !== 1 ? 's' : ''} ${unassignedBookings.length === 1 ? 'needs' : 'need'} a coordinator assigned`,
        icon: UserPlus,
        read: false,
        createdAt: unassignedBookings[0]?.created_at || now.toISOString(),
        action: {
          type: 'navigate',
          path: '/admin/bookings',
        },
        category: 'bookings',
      });
    }

    // Upcoming events (within 7 days)
    const upcomingEvents = bookings.filter((b) => {
      if (!b.event_date) return false;
      const eventDate = new Date(b.event_date);
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      return daysUntilEvent > 0 && daysUntilEvent <= 7 && (b.booking_status || b.status || '').toLowerCase() !== 'cancelled';
    });
    if (upcomingEvents.length > 0) {
      notifications.push({
        id: 'upcoming-events',
        type: 'info',
        title: `${upcomingEvents.length} Upcoming Event${upcomingEvents.length !== 1 ? 's' : ''}`,
        message: `${upcomingEvents.length} event${upcomingEvents.length !== 1 ? 's' : ''} ${upcomingEvents.length === 1 ? 'is' : 'are'} happening in the next 7 days`,
        icon: Calendar,
        read: false,
        createdAt: now.toISOString(),
        action: {
          type: 'navigate',
          path: '/admin/bookings/calendar',
        },
        category: 'events',
      });
    }

    return notifications;
  };

  const generateInquiryNotifications = (inquiries) => {
    const notifications = [];
    const newInquiries = inquiries.filter((inq) => (inq.status || '').toLowerCase() === 'new');

    if (newInquiries.length > 0) {
      notifications.push({
        id: 'new-inquiries',
        type: 'info',
        title: `${newInquiries.length} New Contact Inquiry${newInquiries.length !== 1 ? 'ies' : ''}`,
        message: `${newInquiries.length} new contact inquiry${newInquiries.length !== 1 ? 'ies' : ''} need${newInquiries.length === 1 ? 's' : ''} your attention`,
        icon: Mail,
        read: false,
        createdAt: newInquiries[0]?.created_at || new Date().toISOString(),
        action: {
          type: 'navigate',
          path: '/admin/contact-inquiries',
        },
        category: 'inquiries',
      });
    }

    return notifications;
  };

  const generateClientNotifications = (bookings) => {
    const notifications = [];
    const now = new Date();

    // Group bookings by status for summary notifications
    const pendingBookings = bookings.filter(
      (b) => (b.booking_status || b.status || '').toLowerCase() === 'pending'
    );
    const confirmedBookings = bookings.filter(
      (b) => (b.booking_status || b.status || '').toLowerCase() === 'approved' ||
             (b.booking_status || b.status || '').toLowerCase() === 'confirmed'
    );
    const cancelledBookings = bookings.filter(
      (b) => (b.booking_status || b.status || '').toLowerCase() === 'cancelled'
    );

    // Summary notification for pending bookings
    if (pendingBookings.length > 0) {
      notifications.push({
        id: 'pending-bookings-summary',
        type: 'info',
        title: `${pendingBookings.length} Booking${pendingBookings.length !== 1 ? 's' : ''} Pending`,
        message: `Your ${pendingBookings.length === 1 ? 'booking is' : 'bookings are'} awaiting approval`,
        icon: Clock,
        read: false,
        createdAt: pendingBookings[0]?.created_at || now.toISOString(),
        action: {
          type: 'navigate',
          path: '/dashboard',
          params: { tab: 'list', status: 'pending' },
        },
        category: 'bookings',
      });
    }

    // Summary notification for confirmed bookings (recent ones)
    const recentConfirmed = confirmedBookings.filter((b) => {
      const updatedAt = new Date(b.updated_at || b.created_at);
      const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate <= 7; // Only show if confirmed in last 7 days
    });
    if (recentConfirmed.length > 0) {
      notifications.push({
        id: 'confirmed-bookings-summary',
        type: 'success',
        title: `${recentConfirmed.length} Booking${recentConfirmed.length !== 1 ? 's' : ''} Confirmed`,
        message: `${recentConfirmed.length} of your booking${recentConfirmed.length !== 1 ? 's have' : ' has'} been confirmed!`,
        icon: CheckCircle,
        read: false,
        createdAt: recentConfirmed[0]?.updated_at || recentConfirmed[0]?.created_at || now.toISOString(),
        action: {
          type: 'navigate',
          path: '/dashboard',
          params: { tab: 'list', status: 'confirmed' },
        },
        category: 'bookings',
      });
    }

    // Individual notifications for cancelled bookings
    cancelledBookings.forEach((booking) => {
      const cancelledAt = new Date(booking.updated_at || booking.created_at);
      const daysSinceCancelled = Math.floor((now - cancelledAt) / (1000 * 60 * 60 * 24));
      
      // Only show if cancelled in last 7 days
      if (daysSinceCancelled <= 7) {
        notifications.push({
          id: `cancelled-${booking.booking_id || booking.id}`,
          type: 'error',
          title: 'Booking Cancelled',
          message: `Your booking for ${getPackageName(booking)} has been cancelled.`,
          icon: XCircle,
          read: false,
          createdAt: booking.updated_at || booking.created_at,
          bookingId: booking.booking_id || booking.id,
          action: {
            type: 'navigate',
            path: '/dashboard',
            params: { tab: 'list' },
          },
          category: 'bookings',
        });
      }
    });

    // Upcoming events (within 7 days) - grouped by urgency
    const upcomingEvents = bookings.filter((b) => {
      if (!b.event_date) return false;
      const eventDate = new Date(b.event_date);
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      return (
        daysUntilEvent > 0 &&
        daysUntilEvent <= 7 &&
        (b.booking_status || b.status || '').toLowerCase() !== 'cancelled'
      );
    });

    if (upcomingEvents.length > 0) {
      // Group by urgency
      const urgentEvents = upcomingEvents.filter((b) => {
        const eventDate = new Date(b.event_date);
        const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
        return daysUntilEvent <= 3;
      });

      if (urgentEvents.length > 0) {
        notifications.push({
          id: 'urgent-events',
          type: 'warning',
          title: `${urgentEvents.length} Event${urgentEvents.length !== 1 ? 's' : ''} This Week`,
          message: `You have ${urgentEvents.length} event${urgentEvents.length !== 1 ? 's' : ''} happening in the next 3 days`,
          icon: Calendar,
          read: false,
          createdAt: now.toISOString(),
          action: {
            type: 'navigate',
            path: '/dashboard',
            params: { tab: 'calendar' },
          },
          category: 'events',
        });
      } else {
        notifications.push({
          id: 'upcoming-events',
          type: 'info',
          title: `${upcomingEvents.length} Upcoming Event${upcomingEvents.length !== 1 ? 's' : ''}`,
          message: `You have ${upcomingEvents.length} event${upcomingEvents.length !== 1 ? 's' : ''} coming up in the next week`,
          icon: Calendar,
          read: false,
          createdAt: now.toISOString(),
          action: {
            type: 'navigate',
            path: '/dashboard',
            params: { tab: 'calendar' },
          },
          category: 'events',
        });
      }
    }

    return notifications;
  };

  const getPackageName = (booking) => {
    return (
      booking?.eventPackage?.package_name ||
      booking?.event_package?.package_name ||
      booking?.package?.name ||
      booking?.package?.package_name ||
      'Event'
    );
  };

  const handleNotificationClick = (notification) => {
    if (notification.action) {
      setOpen(false);
      if (notification.action.type === 'navigate') {
        const path = notification.action.path;
        const params = notification.action.params;
        
        // Build query string if params exist
        if (params) {
          const queryString = new URLSearchParams(params).toString();
          navigate(`${path}?${queryString}`);
        } else {
          navigate(path);
        }
      }
    } else if (notification.bookingId) {
      setOpen(false);
      navigate('/dashboard?tab=list');
    }
  };

  const markAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  };

  const getNotificationIcon = (type, Icon) => {
    const iconClass = 'w-4 h-4';
    const colorClasses = {
      success: 'text-green-600 dark:text-green-400',
      error: 'text-red-600 dark:text-red-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      info: 'text-blue-600 dark:text-blue-400',
    };

    if (Icon) {
      return <Icon className={`${iconClass} ${colorClasses[type] || colorClasses.info}`} />;
    }

    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} ${colorClasses.success}`} />;
      case 'error':
        return <XCircle className={`${iconClass} ${colorClasses.error}`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} ${colorClasses.warning}`} />;
      default:
        return <Bell className={`${iconClass} ${colorClasses.info}`} />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.category === activeFilter);

  const categories = isAdminUser
    ? [
        { id: 'all', label: 'All', count: notifications.length },
        {
          id: 'bookings',
          label: 'Bookings',
          count: notifications.filter((n) => n.category === 'bookings').length,
        },
        {
          id: 'inquiries',
          label: 'Inquiries',
          count: notifications.filter((n) => n.category === 'inquiries').length,
        },
        {
          id: 'events',
          label: 'Events',
          count: notifications.filter((n) => n.category === 'events').length,
        },
      ]
    : [
        { id: 'all', label: 'All', count: notifications.length },
        {
          id: 'bookings',
          label: 'Bookings',
          count: notifications.filter((n) => n.category === 'bookings').length,
        },
        {
          id: 'events',
          label: 'Events',
          count: notifications.filter((n) => n.category === 'events').length,
        },
      ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {isAdminUser ? 'Admin Notifications' : 'Notifications'}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Category Filters */}
        {notifications.length > 0 && (
          <div className="px-4 pt-2 border-b dark:border-gray-700">
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
              <TabsList
                className={`grid w-full h-8 ${
                  isAdminUser ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="text-xs data-[state=active]:bg-indigo-100 dark:data-[state=active]:bg-indigo-900/30"
                  >
                    {cat.label}
                    {cat.count > 0 && (
                      <Badge className="ml-1 h-4 px-1 text-[10px]">{cat.count}</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeFilter === 'all' ? 'No notifications' : `No ${activeFilter} notifications`}
              </p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    !notification.read
                      ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-blue-500'
                      : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notification.type, notification.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              aria-label="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            aria-label="Delete notification"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredNotifications.length > 0 && (
          <div className="p-2 border-t dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
