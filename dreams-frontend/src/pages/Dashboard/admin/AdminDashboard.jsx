import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon } from '@heroicons/react/24/outline';
import {
  Package,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Search,
  Filter,
  X,
  Calendar as CalendarIconLucide,
  Download,
  MessageSquare,
  FileText,
  Eye,
  Settings,
  Bell,
  CreditCard,
  CheckSquare,
  Send,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  DollarSign,
  Award,
  Mail
} from 'lucide-react';
import api from '../../../api/axios';
import { LoadingSpinner, StatsCard, Card, DataTable, Tabs, TabsList, TabsTrigger, TabsContent, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';

// Helper function to ensure absolute URL for profile picture
const ensureAbsoluteUrl = (url) => {
  if (!url) return null;
  // If already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  // If relative URL starting with /, prepend API base URL (without /api)
  if (url.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    const baseUrl = apiBase.replace('/api', '');
    return baseUrl + url;
  }
  // If it's a storage path, prepend /storage/
  if (url && !url.includes('://') && !url.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    const baseUrl = apiBase.replace('/api', '');
    return `${baseUrl}/storage/${url}`;
  }
  return url;
};

const AdminDashboard = () => {
  const { user, isCoordinator } = useAuth();
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalBookings: 0,
    totalClients: 0,
    pendingBookings: 0,
    // Coordinator-specific stats
    assignedBookings: 0,
    pendingAssigned: 0,
    upcomingEvents: 0,
    completedEvents: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [analytics, setAnalytics] = useState({
    monthlyRevenue: [],
    popularPackages: [],
    totalRevenue: 0,
    conversionRate: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
    if (!isCoordinator) {
      fetchAnalytics();
    }
  }, []);

  const fetchStats = async () => {
    try {
      if (isCoordinator) {
        // Coordinator-specific stats
        const bookingsRes = await api.get('/bookings');
        const allBookings = bookingsRes.data.data || bookingsRes.data || [];

        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const assignedBookings = allBookings.length;
        const pendingAssigned = allBookings.filter(b =>
          (b.booking_status || b.status || '').toLowerCase() === 'pending'
        ).length;
        const upcomingEvents = allBookings.filter(b => {
          if (!b.event_date) return false;
          const eventDate = new Date(b.event_date);
          return eventDate >= now && eventDate <= nextWeek &&
            (b.booking_status || b.status || '').toLowerCase() !== 'cancelled';
        }).length;
        const completedEvents = allBookings.filter(b => {
          if (!b.event_date) return false;
          const eventDate = new Date(b.event_date);
          return eventDate < now && eventDate >= thisMonthStart &&
            (b.booking_status || b.status || '').toLowerCase() === 'completed';
        }).length;

        setStats({
          assignedBookings,
          pendingAssigned,
          upcomingEvents,
          completedEvents,
        });
      } else {
        // Admin stats
        const packagesRes = await api.get('/packages');
        const bookingsRes = await api.get('/bookings');

        const allBookings = bookingsRes.data.data || bookingsRes.data || [];
        const pendingBookings = allBookings.filter(b => (b.booking_status || b.status || '').toLowerCase() === 'pending').length;

        // Extract unique clients from bookings
        const uniqueClients = new Set(allBookings.map(b => b.client_id || b.user_id)).size;

        setStats({
          totalPackages: packagesRes.data.data?.length || packagesRes.data.length || 0,
          totalBookings: allBookings.length,
          totalClients: uniqueClients,
          pendingBookings: pendingBookings,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const response = await api.get('/bookings');
      const bookings = response.data.data || response.data || [];
      setAllBookings(bookings);

      // Get 5 most recent bookings
      const recent = bookings
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentBookings(recent);

      // Calculate upcoming events (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcoming = bookings
        .filter((b) => {
          if (!b.event_date) return false;
          const eventDate = new Date(b.event_date);
          const status = (b.booking_status || b.status || '').toLowerCase();
          return (
            eventDate >= now &&
            eventDate <= nextWeek &&
            (status === 'approved' || status === 'confirmed')
          );
        })
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 6); // Show up to 6 upcoming events

      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics');
      const data = response.data.data || response.data || {};

      // Calculate conversion rate (approved/confirmed bookings / total bookings)
      const totalBookings = data.overview?.total_bookings || 0;
      const successfulBookings = Object.entries(data.bookings_by_status || {})
        .filter(([status]) => status === 'Approved' || status === 'Confirmed')
        .reduce((sum, [, count]) => sum + count, 0);

      const conversionRate = totalBookings > 0
        ? ((successfulBookings / totalBookings) * 100).toFixed(1)
        : 0;

      setAnalytics({
        monthlyRevenue: data.monthly_revenue || [],
        popularPackages: data.popular_packages || [],
        totalRevenue: data.overview?.total_revenue || 0,
        conversionRate: parseFloat(conversionRate),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };


  // Filter bookings based on search and filters
  const filteredBookings = useMemo(() => {
    let filtered = [...recentBookings];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((booking) => {
        const clientName = booking.client
          ? `${booking.client.client_fname || ''} ${booking.client.client_lname || ''}`.trim().toLowerCase()
          : (booking.client_name || '').toLowerCase();
        const packageName = (booking.eventPackage?.package_name ||
          booking.event_package?.package_name ||
          booking.package?.package_name ||
          booking.package_name || '').toLowerCase();
        const status = (booking.booking_status || booking.status || '').toLowerCase();

        return clientName.includes(query) ||
          packageName.includes(query) ||
          status.includes(query);
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking) => {
        const status = (booking.booking_status || booking.status || '').toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter((booking) => {
          if (!booking.event_date) return false;
          const eventDate = new Date(booking.event_date);
          return eventDate >= startDate;
        });
      }
    }

    return filtered;
  }, [recentBookings, searchQuery, statusFilter, dateFilter]);


  // Calculate trends and percentages for better visualization
  const totalBookingsPercentage = stats.totalBookings > 0
    ? ((stats.totalBookings - stats.pendingBookings) / stats.totalBookings * 100).toFixed(0)
    : 0;
  const pendingPercentage = stats.totalBookings > 0
    ? (stats.pendingBookings / stats.totalBookings * 100).toFixed(0)
    : 0;

  return (
    <div className="relative">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20 w-full">
        {/* Enhanced Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {isCoordinator ? 'Coordinator Dashboard' : 'Admin Dashboard'}
                </h1>
                <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">Live</span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-base font-semibold">
                {isCoordinator ? 'Manage your assigned bookings and events' : 'Overview of your event management system'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <Link to="/admin/packages/create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Package</span>
                <span className="sm:hidden">New</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Link to="/admin/analytics" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Coordinator Profile Section */}
        {isCoordinator && user && (
          <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 dark:from-blue-800 dark:via-blue-900 dark:to-slate-950 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 text-white transition-all duration-300 overflow-hidden group hover:shadow-3xl">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-white/5 blur-xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Picture/Avatar */}
              <div className="relative group/avatar">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-2 border-2 border-white/30 shadow-xl group-hover/avatar:scale-105 transition-transform duration-300">
                  {user.profile_picture ? (
                    <img
                      src={ensureAbsoluteUrl(user.profile_picture)}
                      alt={user.name}
                      className="h-28 w-28 rounded-xl object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="h-28 w-28 rounded-xl bg-white/30 flex items-center justify-center"
                    style={{ display: user.profile_picture ? 'none' : 'flex' }}
                  >
                    <span className="text-4xl font-bold text-white">
                      {user.name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'CO'}
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-400 border-4 border-blue-700 rounded-full h-7 w-7 shadow-lg animate-pulse"></div>
              </div>

              {/* Profile Information */}
              <div className="flex-1 w-full">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h2 className="text-3xl sm:text-4xl font-bold drop-shadow-lg">{user.name}</h2>
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold border border-white/30 shadow-lg">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    Event Coordinator
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <div className="mt-0.5 p-2 bg-white/20 rounded-lg">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 uppercase tracking-wide mb-1 font-semibold">Email</p>
                      <p className="text-white font-medium truncate">{user.email}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <div className="mt-0.5 p-2 bg-white/20 rounded-lg">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 uppercase tracking-wide mb-1 font-semibold">Phone</p>
                        <p className="text-white font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.created_at && (
                    <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <div className="mt-0.5 p-2 bg-white/20 rounded-lg">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 uppercase tracking-wide mb-1 font-semibold">Member Since</p>
                        <p className="text-white font-medium">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <div className="mt-0.5 p-2 bg-white/20 rounded-lg">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 uppercase tracking-wide mb-1 font-semibold">Status</p>
                      <p className="text-white font-medium">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Enhanced Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {isCoordinator ? (
                <>
                  <StatsCard
                    title="My Assigned Bookings"
                    value={stats.assignedBookings}
                    unit="Bookings"
                    status="Ongoing"
                    icon={Calendar}
                    color="blue"
                  />
                  <StatsCard
                    title="Pending Bookings"
                    value={stats.pendingAssigned}
                    unit="Waitlisted"
                    trend="+5%"
                    trendDirection="up"
                    icon={Clock}
                    color="orange"
                  />
                  <StatsCard
                    title="Upcoming Events"
                    value={stats.upcomingEvents}
                    unit="Events"
                    trend="+12%"
                    trendDirection="up"
                    icon={Zap}
                    color="green"
                  />
                  <StatsCard
                    title="Booking Completion Rate"
                    value={`${totalBookingsPercentage}%`}
                    trend="+100%"
                    trendDirection="up"
                    icon={CheckCircle2}
                    color="cyan"
                  />
                </>
              ) : (
                <>
                  <StatsCard
                    title="Total Packages"
                    value={stats.totalPackages}
                    unit="Items"
                    trend="+2"
                    trendDirection="up"
                    icon={Package}
                    color="blue"
                  />
                  <StatsCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    unit="Bookings"
                    trend="+12%"
                    trendDirection="up"
                    icon={Calendar}
                    color="cyan"
                  />
                  <StatsCard
                    title="Total Clients"
                    value={stats.totalClients}
                    unit="Users"
                    trend="+5"
                    trendDirection="up"
                    icon={Users}
                    color="green"
                  />
                  <StatsCard
                    title="Booking Completion Rate"
                    value={`${totalBookingsPercentage}%`}
                    trend="+15%"
                    trendDirection="up"
                    icon={Zap}
                    color="orange"
                  />
                </>
              )}
            </div>

            {/* ===== QUICK ACTIONS PANEL ===== */}
            {!isCoordinator && (
              <div className="mb-8">
                <Card variant="glass" className="p-6">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Common tasks at your fingertips</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                    {/* Review Pending Bookings */}
                    <Link
                      to="/admin/bookings?status=pending"
                      className="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Review Pending</span>
                      {stats.pendingBookings > 0 && (
                        <span className="absolute -top-2 -right-2 px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded-full min-w-[24px] text-center animate-pulse">
                          {stats.pendingBookings}
                        </span>
                      )}
                    </Link>

                    {/* Calendar View */}
                    <Link
                      to="/admin/calendar"
                      className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Calendar View</span>
                    </Link>

                    {/* Contact Inquiries */}
                    <Link
                      to="/admin/inquiries"
                      className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Inquiries</span>
                    </Link>

                    {/* Create New Package */}
                    <Link
                      to="/admin/packages/create"
                      className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">New Package</span>
                    </Link>

                    {/* Analytics / Reports */}
                    <Link
                      to="/admin/analytics"
                      className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 border-2 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-3 bg-cyan-100 dark:bg-cyan-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Analytics</span>
                    </Link>

                    {/* Manage Clients */}
                    <Link
                      to="/admin/clients"
                      className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-2 border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Clients</span>
                    </Link>

                    {/* Portfolio */}
                    <Link
                      to="/admin/portfolio"
                      className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        <Eye className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Portfolio</span>
                    </Link>

                    {/* Audit Logs */}
                    <Link
                      to="/admin/audit-logs"
                      className="group flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-3 bg-slate-100 dark:bg-slate-900/40 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Audit Logs</span>
                    </Link>
                  </div>
                </Card>
              </div>
            )}

            {/* Quick Stats Overview Bar */}
            {!isCoordinator && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black italic text-emerald-400 tracking-tighter">
                      <ArrowUpRight className="w-4 h-4" />
                      +12%
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white mb-1 tracking-tighter scale-110 origin-left">
                    {totalBookingsPercentage}%
                  </p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Booking Completion Rate</p>
                </Card>

                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                      <Activity className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black italic text-blue-400 tracking-tighter">
                      <Sparkles className="w-4 h-4" />
                      Active
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white mb-1 tracking-tighter scale-110 origin-left">
                    {stats.totalBookings - stats.pendingBookings}
                  </p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Active Bookings</p>
                </Card>

                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                      <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black italic text-rose-400 tracking-tighter">
                      <AlertCircle className="w-4 h-4" />
                      Urgent
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white mb-1 tracking-tighter scale-110 origin-left">
                    {stats.pendingBookings}
                  </p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Pending Requests</p>
                </Card>
              </div>
            )}

            {/* ===== UPCOMING EVENTS WIDGET ===== */}
            {!isCoordinator && (
              <div className="mb-8">
                <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-blue-900/30 shadow-lg">
                  {/* Widget Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Events</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Events happening in the next 7 days</p>
                      </div>
                    </div>
                    <Link
                      to="/admin/bookings/calendar"
                      className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      View Calendar
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Events Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingEvents.map((event) => {
                      const eventDate = new Date(event.event_date);
                      const now = new Date();
                      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
                      const isToday = daysUntil === 0 || (daysUntil === 1 && eventDate.getDate() === now.getDate());
                      const isTomorrow = daysUntil === 1;
                      const isUrgent = daysUntil <= 2;

                      const clientName = event.client
                        ? `${event.client.client_fname || ''} ${event.client.client_lname || ''}`.trim()
                        : 'Unknown Client';
                      const packageName = event.eventPackage?.package_name ||
                        event.event_package?.package_name ||
                        event.package?.package_name ||
                        'Event Package';

                      // Determine urgency styling
                      let urgencyBg, urgencyBorder, urgencyText, urgencyLabel;
                      if (isToday) {
                        urgencyBg = 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20';
                        urgencyBorder = 'border-red-300 dark:border-red-700';
                        urgencyText = 'text-red-600 dark:text-red-400';
                        urgencyLabel = 'Today';
                      } else if (isTomorrow) {
                        urgencyBg = 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20';
                        urgencyBorder = 'border-orange-300 dark:border-orange-700';
                        urgencyText = 'text-orange-600 dark:text-orange-400';
                        urgencyLabel = 'Tomorrow';
                      } else if (isUrgent) {
                        urgencyBg = 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20';
                        urgencyBorder = 'border-yellow-300 dark:border-yellow-700';
                        urgencyText = 'text-yellow-600 dark:text-yellow-400';
                        urgencyLabel = `${daysUntil} days`;
                      } else {
                        urgencyBg = 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
                        urgencyBorder = 'border-blue-300 dark:border-blue-700';
                        urgencyText = 'text-blue-600 dark:text-blue-400';
                        urgencyLabel = `${daysUntil} days`;
                      }

                      return (
                        <div
                          key={event.booking_id || event.id}
                          className={`group relative bg-gradient-to-br ${urgencyBg} rounded-xl border-2 ${urgencyBorder} p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                        >
                          {/* Urgency Badge */}
                          <div className={`absolute -top-2 -right-2 px-2 py-1 ${isToday ? 'bg-red-500 animate-pulse' : isTomorrow ? 'bg-orange-500' : isUrgent ? 'bg-yellow-500' : 'bg-blue-500'} text-white text-xs font-bold rounded-full shadow-lg`}>
                            {urgencyLabel}
                          </div>

                          {/* Date Display */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${isToday ? 'bg-red-100 dark:bg-red-900/40' : isTomorrow ? 'bg-orange-100 dark:bg-orange-900/40' : isUrgent ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                              <span className={`text-xs font-bold uppercase ${urgencyText}`}>
                                {eventDate.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                              <span className={`text-lg font-extrabold ${urgencyText}`}>
                                {eventDate.getDate()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {eventDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </p>
                              {event.event_time && (
                                <p className={`text-xs font-semibold ${urgencyText} flex items-center gap-1`}>
                                  <Clock className="w-3 h-3" />
                                  {event.event_time}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Event Details */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {clientName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {packageName}
                              </p>
                            </div>
                          </div>

                          {/* View Link */}
                          <Link
                            to={`/admin/bookings?booking=${event.booking_id || event.id}`}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                          >
                            View Details
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty state when no upcoming events */}
                  {upcomingEvents.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 mb-4">
                        <Calendar className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        No Upcoming Events
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                        There are no approved or confirmed events scheduled in the next 7 days.
                      </p>
                      <Link
                        to="/admin/bookings/calendar"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Calendar className="w-4 h-4" />
                        View Full Calendar
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Metrics Section (Admin Only) */}
            {!isCoordinator && (
              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                      Performance Metrics
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Key insights and analytics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Trends Widget */}
                  <div className="lg:col-span-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 hover:shadow-3xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Trends</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Last 6 months</p>
                        </div>
                      </div>
                    </div>

                    {analytics.monthlyRevenue.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.monthlyRevenue.map((item, index) => {
                          const maxRevenue = Math.max(...analytics.monthlyRevenue.map(d => d.revenue));
                          const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{item.month}</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  ₱{item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No revenue data available</p>
                      </div>
                    )}
                  </div>

                  {/* Key Metrics Card */}
                  <div className="space-y-6">
                    {/* Conversion Rate */}
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 shadow-2xl text-white hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                      <div className="flex items-center justify-between mb-4">
                        <Activity className="w-8 h-8" />
                        <div className="text-4xl font-extrabold">{analytics.conversionRate}%</div>
                      </div>
                      <h3 className="text-lg font-bold mb-1">Conversion Rate</h3>
                      <p className="text-sm text-blue-100">Approved/Confirmed bookings</p>
                    </div>

                    {/* Total Revenue */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-2xl text-white hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                      <div className="flex items-center justify-between mb-4">
                        <DollarSign className="w-8 h-8" />
                        <div className="text-3xl font-extrabold">
                          ₱{(analytics.totalRevenue / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <h3 className="text-lg font-bold mb-1">Total Revenue</h3>
                      <p className="text-sm text-green-100">Last 30 days</p>
                    </div>
                  </div>
                </div>

                {/* Popular Packages Widget */}
                {analytics.popularPackages.length > 0 && (
                  <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 hover:shadow-3xl transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Popular Packages</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Top performers</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {analytics.popularPackages.map((pkg, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 transform hover:scale-105"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                              #{index + 1}
                            </div>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              {pkg.booking_count} {pkg.booking_count === 1 ? 'booking' : 'bookings'}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[2.5rem]">
                            {pkg.package_name}
                          </h4>
                          <div className="text-sm font-bold text-green-600 dark:text-green-400">
                            ₱{pkg.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Recent Activities Section */}
            <section className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-2xl rounded-3xl border border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 hover:shadow-3xl overflow-hidden group">
              {/* Enhanced decorative gradient overlays */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-blue-200/40 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full blur-3xl -mr-48 -mt-48 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-100/30 to-indigo-100/30 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-3xl -ml-40 -mb-40"></div>

              <Tabs defaultValue="recent" className="w-full relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="relative group/icon">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl blur-md opacity-50 group-hover/icon:opacity-75 transition-opacity"></div>
                      <div className="relative flex items-center justify-center p-3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg transform group-hover/icon:scale-110 transition-transform duration-300">
                        <CalendarIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                        {isCoordinator ? 'My Recent Bookings' : 'Recent Activities'}
                      </h2>
                      <p className="text-sm text-gray-700 dark:text-gray-400 font-semibold">
                        {isCoordinator ? 'Latest bookings assigned to you' : 'Overview of recent system activities'}
                      </p>
                    </div>
                  </div>
                  <TabsList className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-1.5 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
                    <TabsTrigger
                      value="recent"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                    >
                      Recent
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                    >
                      All Bookings
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="recent" className="mt-6 space-y-6">
                  {/* Enhanced Search and Filter Bar */}
                  <div className="space-y-4">
                    {/* Main Search Bar */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl blur-xl"></div>
                      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Search Input */}
                          <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <Input
                              type="text"
                              placeholder="Search by client name, package, or status..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-12 pr-4 h-12 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all duration-300"
                            />
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Clear search"
                              >
                                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            )}
                          </div>

                          {/* Filter Toggle Button */}
                          <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="h-12 px-6 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-300"
                          >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                            {(statusFilter !== 'all' || dateFilter !== 'all') && (
                              <span className="ml-2 px-2 py-0.5 bg-indigo-500 text-white text-xs font-semibold rounded-full">
                                {[statusFilter !== 'all' ? 1 : 0, dateFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                              </span>
                            )}
                          </Button>
                        </div>

                        {/* Expandable Filters */}
                        {showFilters && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                            {/* Status Filter */}
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Status
                              </label>
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full h-11 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-xl">
                                  <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Statuses</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Date Filter */}
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                                <CalendarIconLucide className="w-4 h-4" />
                                Event Date
                              </label>
                              <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger className="w-full h-11 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-xl">
                                  <SelectValue placeholder="All Dates" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Dates</SelectItem>
                                  <SelectItem value="today">Today</SelectItem>
                                  <SelectItem value="week">This Week</SelectItem>
                                  <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Clear Filters Button */}
                            {(statusFilter !== 'all' || dateFilter !== 'all' || searchQuery) && (
                              <div className="sm:col-span-2 flex justify-end">
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setStatusFilter('all');
                                    setDateFilter('all');
                                    setSearchQuery('');
                                  }}
                                  className="text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Clear All Filters
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Results Count and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                          Showing <span className="font-extrabold text-gray-900 dark:text-white">{filteredBookings.length}</span> of{' '}
                          <span className="font-extrabold text-gray-900 dark:text-white">{recentBookings.length}</span> recent bookings
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Link to="/admin/bookings" className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          View All
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {filteredBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {filteredBookings.map((booking, index) => {
                        const status = (booking.booking_status || booking.status || '').toLowerCase();
                        const statusColors = {
                          pending: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
                          confirmed: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
                          approved: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
                          completed: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                          cancelled: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
                        };

                        const clientName = booking.client
                          ? `${booking.client.client_fname || ''} ${booking.client.client_lname || ''}`.trim()
                          : booking.client_name || 'N/A';

                        const packageName = booking.eventPackage?.package_name ||
                          booking.event_package?.package_name ||
                          booking.package?.package_name ||
                          booking.package_name ||
                          'N/A';

                        // Price calculation
                        let price = booking?.eventPackage?.package_price ||
                          booking?.event_package?.package_price ||
                          booking?.package?.package_price ||
                          booking?.total_amount ||
                          0;
                        const numericPrice = parseFloat(price);

                        return (
                          <div
                            key={booking.booking_id || index}
                            className="group relative bg-white/50 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:bg-white/80 dark:hover:bg-gray-800/60 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                          >
                            {/* Card Background Accent */}
                            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${status === 'pending' ? 'bg-yellow-500' :
                              status === 'confirmed' || status === 'approved' ? 'bg-green-500' :
                                status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
                              }`}></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                  {clientName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{clientName}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Client</p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                                {status === 'confirmed' ? 'Approved' : status}
                              </span>
                            </div>

                            <div className="space-y-3 mb-4 relative z-10">
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Package className="w-4 h-4 text-indigo-500" />
                                <span className="font-semibold truncate">{packageName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4 text-purple-500" />
                                <span>{booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 relative z-10">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Amount</span>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                  ₱{numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <Link
                                to={`/admin/bookings?search=${encodeURIComponent(clientName)}`}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all duration-300"
                                title="View Details"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : recentBookings.length > 0 ? (
                    <div className="text-center py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings found</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-4">
                        Try adjusting your search or filter criteria
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setDateFilter('all');
                        }}
                        className="mt-2"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <Calendar className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No recent bookings</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                        {isCoordinator ? 'You don\'t have any recent bookings assigned yet.' : 'No recent bookings found in the system.'}
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="all" className="mt-6">
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 mb-4">
                      <Calendar className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">View All Bookings</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Access the complete bookings management page to view and manage all bookings
                    </p>
                    <Link
                      to="/admin/bookings"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 dark:hover:from-blue-600 dark:hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      View all bookings
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </>
        )}
      </div>
    </div >
  );
};

export default AdminDashboard;

