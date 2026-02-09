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
import { AnimatedBackground, PullToRefresh } from '../../../components/features';
import PaymentForm from '../../../components/features/PaymentForm';
import { getBookingPayments } from '../../../api/services/paymentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge } from '../../../components/ui';
import { useToast } from '../../../hooks/use-toast';
import { Calendar, Package, Settings, TrendingUp, Plus, Sparkles, CreditCard, DollarSign, MessageSquare, Clock, Search } from 'lucide-react';
import EventCountdown from '../../../components/features/EventCountdown';
import BookingActionsDropdown from '../../../components/features/BookingActionsDropdown';

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

  const canShowPayButton = (booking) => {
    const { paymentStatus, remainingBalance, totalAmount } = getPaymentInfo(booking);
    const isCancelled = (booking?.booking_status || booking?.status || '').toLowerCase() === 'cancelled';
    const isCompleted = (booking?.booking_status || booking?.status || '').toLowerCase() === 'completed';
    const bookingStatus = (booking?.booking_status || booking?.status || '').toLowerCase();
    const paymentRequired = booking?.payment_required !== false; // Default to true if not set

    // Don't show if cancelled or completed
    if (isCancelled || isCompleted) return false;

    // Don't show if payment not required
    if (!paymentRequired) return false;

    // Don't show if fully paid
    if (paymentStatus === 'paid') return false;

    // Show button based on booking status:
    // - Pending: Allow deposit or full payment (show if total amount > 0)
    // - Approved/Confirmed: Show if there's remaining balance
    if (bookingStatus === 'pending') {
      // Allow payment for pending bookings (deposit or full)
      return totalAmount > 0;
    } else {
      // For approved/confirmed bookings, show if there's remaining balance
      return remainingBalance > 0;
    }
  };

  const canCancelBooking = (booking) => {
    const status = (booking.booking_status || booking.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'completed') {
      return false;
    }

    // Check if event date is within 7 days
    if (booking.event_date) {
      const eventDate = new Date(booking.event_date);
      const today = new Date();
      const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilEvent >= 0 && daysUntilEvent < 7) {
        return false;
      }
    }

    return true;
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


  const StatCard = ({ title, value, icon, color = 'indigo' }) => {
    const colorClasses = {
      indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 dark:from-indigo-900/40 dark:to-indigo-900/20 dark:text-indigo-400',
      green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 dark:from-green-900/40 dark:to-green-900/20 dark:text-green-400',
      yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600 dark:from-yellow-900/40 dark:to-yellow-900/20 dark:text-yellow-400',
      red: 'bg-gradient-to-br from-red-50 to-red-100 text-red-600 dark:from-red-900/40 dark:to-red-900/20 dark:text-red-400',
    };

    // Ensure value is always a valid number
    const displayValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;

    return (
      <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 border-0 shadow-md">
        <div className="flex items-center justify-between p-6">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 transition-colors duration-300">{title}</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{displayValue}</p>
          </div>
          <div className={`p-4 rounded-xl transition-all duration-300 ${colorClasses[color]} shadow-sm`}>
            <div className="w-8 h-8">
              {icon}
            </div>
          </div>
        </div>
      </Card>
    );
  };

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
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="relative min-h-screen">
        {/* Subtle Animated Background */}
        <AnimatedBackground
          type="dots"
          colors={['#5A45F2', '#7c3aed', '#7ee5ff']}
          speed={0.2}
          className="opacity-5 dark:opacity-10"
        />
        <div className="px-4 py-6 lg:px-8 lg:py-8 relative z-10 max-w-7xl mx-auto">
          {/* Welcome Section - Compact */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-1">
                    {getGreeting().text}, {getUserFirstName()}! {getGreeting().emoji}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              {nextUpcomingEvent && (
                <div className="lg:w-80 lg:flex-shrink-0">
                  <EventCountdown eventDate={nextUpcomingEvent.event_date} />
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel - Compact */}
          <Card className="mb-8 p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Link to="/dashboard/packages">
                <Button variant="outline" className="w-full h-auto py-2.5 px-3 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-700 dark:text-gray-200 transition-all duration-200 text-xs font-medium">
                  <Search className="w-4 h-4 text-purple-600" />
                  <span>Browse Packages</span>
                </Button>
              </Link>
              <Link to="/dashboard/recommendations">
                <Button variant="outline" className="w-full h-auto py-2.5 px-3 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-700 dark:text-gray-200 transition-all duration-200 text-xs font-medium">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>For You</span>
                </Button>
              </Link>
              <Link to="/dashboard/bookings?tab=calendar">
                <Button variant="outline" className="w-full h-auto py-2.5 px-3 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-700 dark:text-gray-200 transition-all duration-200 text-xs font-medium">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Calendar</span>
                </Button>
              </Link>
              <Link to="/profile/settings">
                <Button variant="outline" className="w-full h-auto py-2.5 px-3 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-700 dark:text-gray-200 transition-all duration-200 text-xs font-medium">
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span>Settings</span>
                </Button>
              </Link>
            </div>
          </Card>

          {/* Statistics Cards */}
          <div className="mb-10">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Statistics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overview of your event bookings</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Bookings"
                value={stats.total}
                color="indigo"
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Pending"
                value={stats.pending}
                color="yellow"
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Confirmed"
                value={stats.confirmed}
                color="green"
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Cancelled"
                value={stats.cancelled}
                color="red"
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && (
            <Card className="mb-10 p-8 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upcoming Events</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your upcoming event bookings</p>
                </div>
                <div className="flex gap-3">
                  <Link to="/dashboard/packages">
                    <Button className="text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5">
                      <Plus className="w-4 h-4 mr-2" />
                      Book New Event
                    </Button>
                  </Link>
                  <Link to="/dashboard/bookings">
                    <Button variant="outline" className="text-sm border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5">
                      View All Bookings
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="space-y-5">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.booking_id || booking.id}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:bg-white dark:hover:bg-gray-800/50 transition-all duration-200 bg-white dark:bg-gray-800/30 shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {getPackageName(booking)}
                              </h3>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                #{booking.booking_id || booking.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap mb-3">
                              {getStatusBadge(booking.booking_status || booking.status)}
                              {getPaymentStatusBadge(getPaymentInfo(booking).paymentStatus)}
                            </div>
                            {/* Payment Breakdown */}
                            {(() => {
                              const { totalPaid, totalAmount, remainingBalance } = getPaymentInfo(booking);
                              if (totalAmount > 0) {
                                return (
                                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-400">Total:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      {totalPaid > 0 && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-green-600 dark:text-green-400">Paid:</span>
                                          <span className="font-semibold text-green-700 dark:text-green-300">
                                            ₱{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                      {remainingBalance > 0 && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-orange-600 dark:text-orange-400">Remaining:</span>
                                          <span className="font-semibold text-orange-700 dark:text-orange-300">
                                            ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {/* Coordinator Info */}
                            {booking.coordinator && (
                              <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-gray-900 dark:text-white">Coordinator:</span>{' '}
                                {booking.coordinator.name || booking.coordinator?.name || 'Assigned'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex items-center gap-3">
                            {canShowPayButton(booking) && (
                              <Button
                                variant="default"
                                size="default"
                                onClick={() => handlePayNow(booking)}
                                className="bg-gradient-to-r from-[#a413ec] to-[#8a0fd4] hover:from-[#8a0fd4] hover:to-[#7a0fc4] text-white shadow-md hover:shadow-lg transition-all duration-200 px-5 py-2.5 font-semibold"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Pay Now
                              </Button>
                            )}
                            <BookingActionsDropdown
                              booking={booking}
                              onViewDetails={(b) => navigate(`/dashboard/bookings/${b.booking_id || b.id}`)}
                              onPayNow={handlePayNow}
                              onCancel={handleCancelClick}
                              canShowPayButton={canShowPayButton}
                              canCancelBooking={canCancelBooking}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Event Date</span>
                            <span className="text-base font-medium text-gray-900 dark:text-white">
                              {booking.event_date
                                ? new Date(booking.event_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                                : 'N/A'}
                            </span>
                            {booking.event_time && (
                              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {booking.event_time}
                              </span>
                            )}
                            {booking.event_date && (() => {
                              const eventDate = new Date(booking.event_date);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              eventDate.setHours(0, 0, 0, 0);
                              const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                              if (daysUntil >= 0 && daysUntil <= 30) {
                                return (
                                  <span className={`text-xs mt-1 font-medium ${daysUntil <= 7 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days away`}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Venue</span>
                            <span className="text-base font-medium text-gray-900 dark:text-white">
                              {booking.event_venue || 'TBD'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Guests</span>
                            <span className="text-base font-medium text-gray-900 dark:text-white">
                              {booking.guest_count || booking.number_of_guests || 'N/A'}
                            </span>
                            {(booking.event_type || booking.theme) && (
                              <div className="mt-1 space-y-0.5">
                                {booking.event_type && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                    Type: {booking.event_type}
                                  </span>
                                )}
                                {booking.theme && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                    Theme: {booking.theme}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Price</span>
                            <span className="text-base font-bold text-gray-900 dark:text-white">
                              {getPackagePrice(booking)
                                ? `₱${parseFloat(getPackagePrice(booking)).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                                : 'N/A'}
                            </span>
                            {booking.deposit_amount && parseFloat(booking.deposit_amount) > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Deposit: ₱{parseFloat(booking.deposit_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                            {booking.created_at && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Booked: {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                        {booking.special_requests && (
                          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium text-gray-900 dark:text-white">Special Requests:</span>{' '}
                            <span className="italic">{booking.special_requests}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Submit Testimonial Section */}
          {bookings.filter(b =>
            b.booking_status === 'Completed' ||
            b.booking_status === 'Approved' ||
            b.status === 'completed' ||
            b.status === 'approved'
          ).length > 0 && (
              <Card className="mb-10 p-8 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 transition-colors duration-300 shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Share Your Experience</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Help others by sharing your experience!</p>
                  </div>
                </div>
                <p className="text-base text-gray-700 dark:text-gray-300 mb-6 transition-colors duration-300">
                  Submit a testimonial about your event and help others make informed decisions.
                </p>
                <Button
                  onClick={() => setShowTestimonialModal(true)}
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white transition-all duration-200 shadow-md hover:shadow-lg px-6 py-2.5 font-semibold"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Testimonial
                </Button>
              </Card>
            )}

          {/* Link to Full Bookings Page */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300 shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Manage All Bookings</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">View detailed booking information, calendar, timeline, and analytics</p>
              </div>
              <Link to="/dashboard/bookings">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5">
                  <Package className="w-4 h-4 mr-2" />
                  View All Bookings
                </Button>
              </Link>
            </div>
          </Card>

          {/* Testimonial Modal */}
          <TestimonialFormModal
            isOpen={showTestimonialModal}
            onClose={() => setShowTestimonialModal(false)}
            onSuccess={() => {
              // Optionally refresh bookings or show success message
            }}
          />

          {/* Payment Modal */}
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
      </div>
    </PullToRefresh>
  );
};


export default ClientDashboard;
