import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import {
  Card,
  Button,
  SkeletonStatCard,
  SkeletonList
} from '../../../components/ui';
import { TestimonialFormModal } from '../../../components/modals';
import BookingCancellationModal from '../../../components/modals/BookingCancellationModal';
import { PullToRefresh } from '../../../components/features';
import { cn } from '../../../lib/utils';
import PaymentForm from '../../../components/features/PaymentForm';
import { getBookingPayments } from '../../../api/services/paymentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge } from '../../../components/ui';
import { useToast } from '../../../hooks/use-toast';
import { Calendar, Package, Settings, TrendingUp, Plus, Sparkles, CreditCard, MessageSquare, Clock, Search, Zap, Eye } from 'lucide-react';
import EventCountdown from '../../../components/features/EventCountdown';

const ClientDashboard = () => {
  const { user, isAdmin } = useAuth();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '🌅' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
    return { text: 'Good evening', emoji: '🌙' };
  };

  // Get user's first name
  const getUserFirstName = () => {
    if (!user?.name) return 'there';
    const firstName = user.name.split(' ')[0];
    return firstName;
  };
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [bookingPayments, setBookingPayments] = useState({});
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [meta, setMeta] = useState({ total: 0, last_page: 1, status_counts: {} });
  // Determine initial tab from URL params
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    const view = searchParams.get('view');

    // Handle view=bookings (defaults to list view)
    if (view === 'bookings') return 'list';

    // Handle tab=payments (show list view filtered by payments)
    if (tab === 'payments') return 'list';

    // Default to tab param or 'list'
    return tab || 'list';
  };


  // Redirect admins to admin dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  const fetchBookings = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/bookings', {
        params: {
          page: pageToLoad,
          per_page: perPage,
        },
      });
      const bookingsData = response.data.data || response.data || [];
      setBookings(bookingsData);
      setMeta(response.data.meta || { total: 0, last_page: 1, status_counts: {} });
      setPage(response.data.meta?.current_page || pageToLoad);
    } catch (error) {
      // Handle 401 errors gracefully (token expired/invalid)
      if (error.response?.status === 401) {
        // The axios interceptor will handle redirecting to login
        setBookings([]);
        setMeta({ total: 0, last_page: 1, status_counts: {} });
      } else {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleCancelSuccess = () => {
    fetchBookings(page);
  };

  const handleRefresh = async () => {
    await fetchBookings(page);
  };

  // Payment functions
  const fetchBookingPayments = async (bookingId) => {
    if (bookingPayments[bookingId]) return bookingPayments[bookingId];
    try {
      const response = await getBookingPayments(bookingId);
      const payments = response.data || response || [];
      setBookingPayments(prev => ({ ...prev, [bookingId]: payments }));
      return payments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  };

  const getPaymentInfo = (booking) => {
    const payments = bookingPayments[booking.booking_id || booking.id];

    let totalPaid = 0;
    if (payments) {
      totalPaid = payments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    } else {
      // Use pre-calculated value from API
      totalPaid = parseFloat(booking?.total_paid || 0);
    }

    // Try multiple possible paths for package price
    const packagePrice = getPackagePrice(booking);

    // Use total_amount first, then package price, then 0
    const totalAmount = parseFloat(booking?.total_amount || packagePrice || 0);

    // Use remaining_balance from API or calculate it
    const remainingBalance = payments
      ? Math.max(0, totalAmount - totalPaid)
      : parseFloat(booking?.remaining_balance ?? Math.max(0, totalAmount - totalPaid));

    const paymentStatus = booking?.payment_status || 'unpaid';

    return { totalPaid, totalAmount, remainingBalance, paymentStatus };
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      partial: { label: 'Partial', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handlePayNow = async (booking) => {
    const bookingId = booking.booking_id || booking.id;
    await fetchBookingPayments(bookingId);
    setSelectedBookingForPayment(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setSelectedBookingForPayment(null);
    toast({
      title: 'Payment Successful!',
      description: 'Your payment has been processed successfully.',
    });
    // Refresh bookings and clear payment cache
    setBookingPayments({});
    await fetchBookings(page);
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedBookingForPayment(null);
  };


  const getStatusBadge = (status) => {
    // Normalize status: booking_status might be "Pending", "Approved", etc., or status might be lowercase
    const normalizedStatus = (status || '').toLowerCase();
    const statusStyles = {
      confirmed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
      cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      completed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    };

    const displayStatus = status || 'Unknown';
    const statusKey = normalizedStatus in statusStyles ? normalizedStatus : 'default';

    return (
      <Badge
        className={`${statusStyles[statusKey] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}`}
      >
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </Badge>
    );
  };

  // Helper function to get package price from booking
  const getPackagePrice = (booking) => {
    if (!booking) return null;

    // Try multiple possible paths for package price
    // Laravel may serialize relationships as snake_case (event_package) or camelCase (eventPackage)
    const price = booking?.eventPackage?.package_price ||
      booking?.event_package?.package_price ||
      booking?.eventPackage?.price ||
      booking?.event_package?.price ||
      booking?.package?.package_price ||
      booking?.package?.price ||
      booking?.package_price ||
      booking?.price ||
      null;

    // Return null if price is 0, undefined, null, empty string, or NaN
    if (price === null || price === undefined || price === '' || price === 0 || isNaN(parseFloat(price))) {
      return null;
    }

    // Convert to number to ensure it's a valid numeric value
    const numericPrice = parseFloat(price);
    return isNaN(numericPrice) ? null : numericPrice;
  };

  // Helper function to get package name from booking
  const getPackageName = (booking) => {
    return booking?.eventPackage?.package_name ||
      booking?.event_package?.package_name ||
      booking?.package?.name ||
      booking?.package?.package_name ||
      'N/A';
  };

  const statusCounts = meta.status_counts || {};
  const confirmedCount = (statusCounts.approved ?? 0) + (statusCounts.confirmed ?? 0);
  const stats = {
    total: meta.total ?? bookings.length,
    pending: statusCounts.pending ?? bookings.filter((b) => (b.booking_status || b.status || '').toLowerCase() === 'pending').length,
    confirmed: confirmedCount !== 0
      ? confirmedCount
      : bookings.filter((b) => {
        const status = (b.booking_status || b.status || '').toLowerCase();
        return status === 'confirmed' || status === 'approved';
      }).length,
    cancelled: statusCounts.cancelled ?? bookings.filter((b) => (b.booking_status || b.status || '').toLowerCase() === 'cancelled').length,
  };


  const upcomingBookings = bookings
    .filter((b) => {
      const status = (b.booking_status || b.status || '').toLowerCase();
      return status !== 'cancelled' && b.event_date && new Date(b.event_date) >= new Date();
    })
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5);

  const nextUpcomingEvent = upcomingBookings.length > 0 ? upcomingBookings[0] : null;



  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-6">
        {/* Welcome Section Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        {/* Bookings List Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
          <SkeletonList items={5} />
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="relative min-h-screen">

        <div className="px-4 py-8 lg:px-12 lg:py-12 relative z-10 w-full max-w-[1600px] mx-auto">
          {/* Welcome Section - Premium Heading */}
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-500/20 transition-transform duration-500">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {getGreeting().text}, <span className="text-blue-600 dark:text-blue-400">{getUserFirstName()}</span> {getGreeting().emoji}
                  </h1>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              {nextUpcomingEvent && (
                <div className="lg:w-96">
                  <EventCountdown eventDate={nextUpcomingEvent.event_date} />
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl mb-10 p-6 sm:p-8 rounded-2xl border-none shadow-xl relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your event details quickly</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              <Link to="/dashboard/packages" className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Book New Event</span>
              </Link>
              <Link to="/dashboard/recommendations" className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">AI Recommendations</span>
              </Link>
              <Link to="/dashboard/bookings?tab=calendar" className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Event Calendar</span>
              </Link>
              <Link to="/profile/settings" className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 bg-slate-100 dark:bg-slate-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Settings</span>
              </Link>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">Overview</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tracking your event journey</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                    <Package className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">{stats.total || 0}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Bookings</p>
              </div>
              <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">{stats.pending || 0}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Requests</p>
              </div>
              <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">{stats.confirmed || stats.approved || 0}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmed Events</p>
              </div>
              <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">{stats.completed || 0}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Successful Events</p>
              </div>
            </div>
          </div>

          {/* Upcoming Events Section - Admin Style */}
          {upcomingBookings.length > 0 && (
            <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl mb-12 p-6 sm:p-8 rounded-2xl border-none shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Events</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your scheduled events for the next 7 days</p>
                  </div>
                </div>
                <Link to="/dashboard/bookings" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1">
                  View All Events
                  <Plus className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBookings.map((booking) => {
                  const eventDate = new Date(booking.event_date);
                  const now = new Date();
                  const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={booking.booking_id || booking.id} className="group p-4 rounded-xl border border-gray-200 dark:border-blue-900/30 bg-gray-50/50 dark:bg-blue-900/10 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <Package className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          diffDays <= 2 ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        )}>
                          In {diffDays} {diffDays === 1 ? 'day' : 'days'}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{getPackageName(booking)}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        {booking.event_time || 'Check confirmation'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Bookings Section - Admin Style */}
          <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl border-none shadow-xl overflow-hidden mb-12">
            <div className="p-6 border-b border-gray-200 dark:border-blue-900/30 flex items-center justify-between bg-white/50 dark:bg-blue-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                  <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Bookings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage your bookings</p>
                </div>
              </div>
              <Link to="/dashboard/bookings" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">Manage All</Link>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-blue-900/30 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Package</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Payment</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-blue-900/20">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.booking_id || booking.id} className="hover:bg-gray-50 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono opacity-50">#{booking.booking_id || booking.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{getPackageName(booking)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.booking_status || booking.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPaymentStatusBadge(getPaymentInfo(booking).paymentStatus)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link to={`/dashboard/bookings/${booking.booking_id || booking.id}`} className="p-2 inline-flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">No recent bookings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feedback Widget */}
            <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl p-8 rounded-2xl border-none shadow-xl relative overflow-hidden group">
              <div className="flex flex-col gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-3 uppercase tracking-widest text-[10px] font-black text-amber-600 dark:text-amber-400">
                    <MessageSquare className="w-3 h-3" />
                    <span>Community</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">Share Your Experience</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                    &quot;Your feedback fuels our passion for creating dream events.&quot;
                  </p>
                </div>
                <Button
                  onClick={() => setShowTestimonialModal(true)}
                  className="h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20 px-8 font-bold transition-all hover:-translate-y-0.5"
                >
                  Write a Testimonial
                </Button>
              </div>
            </div>

            {/* Portal Widget */}
            <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl p-8 rounded-2xl border-none shadow-xl relative overflow-hidden group">
              <div className="flex flex-col gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-3 uppercase tracking-widest text-[10px] font-black text-blue-500 dark:text-blue-400">
                    <Package className="w-3 h-3" />
                    <span>Control Center</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">Manage Full History</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Deep dive into your past events, financial history, and detailed timelines.
                  </p>
                </div>
                <Link to="/dashboard/bookings">
                  <Button className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 px-8 font-bold transition-all hover:-translate-y-0.5">
                    Enter Bookings Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <TestimonialFormModal
          isOpen={showTestimonialModal}
          onClose={() => setShowTestimonialModal(false)}
          onSuccess={() => { }}
        />

        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {selectedBookingForPayment && (() => {
                const { remainingBalance, totalAmount } = getPaymentInfo(selectedBookingForPayment);
                const bookingId = selectedBookingForPayment.booking_id || selectedBookingForPayment.id;
                return (
                  <PaymentForm
                    bookingId={bookingId}
                    amount={remainingBalance || totalAmount}
                    booking={selectedBookingForPayment}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                  />
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        <BookingCancellationModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onSuccess={handleCancelSuccess}
        />
      </div>
    </PullToRefresh>
  );
};

export default ClientDashboard;
