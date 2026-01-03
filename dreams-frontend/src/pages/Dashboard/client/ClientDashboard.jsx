import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { 
  Card, 
  Button, 
  LoadingSpinner, 
  SkeletonStatCard, 
  SkeletonList,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DataTable,
  Timeline
} from '../../../components/ui';
import { TestimonialFormModal } from '../../../components/modals';
import { AnalyticsCharts } from '../../../components/features';
import { Calendar, Clock, Package, Users, Search, Settings, Bell, TrendingUp, Plus, BarChart3, Sparkles } from 'lucide-react';

const ClientDashboard = () => {
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
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [meta, setMeta] = useState({ total: 0, last_page: 1, status_counts: {} });
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, setSearchParams]);

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
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
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
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors duration-300 ${
          statusStyles[statusKey] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
        }`}
      >
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
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

  const StatCard = ({ title, value, icon, color = 'indigo' }) => {
    const colorClasses = {
      indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
      green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };

    // Ensure value is always a valid number
    const displayValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;

    return (
      <Card className="hover:shadow-lg transition-all duration-300 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{displayValue}</p>
          </div>
          <div className={`p-3 rounded-full transition-colors duration-300 ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
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
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
          <SkeletonList items={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              {getGreeting().text}, {getUserFirstName()}! {getGreeting().emoji}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300 ml-16">
          Ready to manage your event bookings and discover amazing packages?
        </p>
      </div>

      {/* Quick Actions Panel */}
      <Card className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Quick Actions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Access frequently used features</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/packages">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
              <Search className="w-4 h-4" />
              <span className="text-sm">Browse Packages</span>
          </Button>
        </Link>
        <Link to="/recommendations">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Get Recommendations</span>
            </Button>
          </Link>
          <Link to="/dashboard?tab=calendar">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">View Calendar</span>
            </Button>
          </Link>
          <Link to="/profile/settings">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
          </Button>
        </Link>
      </div>
      </Card>

      {/* Statistics Cards */}
      <Card className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Booking Statistics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overview of your event bookings</p>
          </div>
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
      </Card>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <Card className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Upcoming Events</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your upcoming event bookings</p>
            </div>
            <Link to="/packages">
              <Button className="text-sm bg-blue-600 hover:bg-blue-700 text-white border-0">
                Book New Event
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.booking_id || booking.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors bg-white/50 dark:bg-gray-800/30"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getPackageName(booking)}
                      </h3>
                      {getStatusBadge(booking.booking_status || booking.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Date:</span>{' '}
                        {booking.event_date 
                          ? new Date(booking.event_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Venue:</span>{' '}
                        {booking.event_venue || 'TBD'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Guests:</span>{' '}
                        {booking.guest_count || booking.number_of_guests || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Price:</span>{' '}
                        {getPackagePrice(booking)
                          ? `₱${parseFloat(getPackagePrice(booking)).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : 'N/A'}
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
        <Card className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">Share Your Experience</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Help others by sharing your experience!</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">
            Submit a testimonial about your event and help others make informed decisions.
          </p>
          <Button 
            onClick={() => setShowTestimonialModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white transition-colors duration-300"
          >
            Submit Testimonial
          </Button>
        </Card>
      )}

      {/* All Bookings with Tabs */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">All Bookings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all your event bookings</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start by exploring our event packages and make your first booking!
            </p>
            <Link to="/packages">
              <Button className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">Browse Packages</Button>
            </Link>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* List View Tab */}
            <TabsContent value="list" className="mt-0">
              <DataTable
                data={bookings.sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))}
                columns={[
                  {
                    accessor: 'package_name',
                    header: 'Package',
                    sortable: true,
                    render: (row) => (
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getPackageName(row)}
                        </div>
                    ),
                  },
                  {
                    accessor: 'event_date',
                    header: 'Event Date',
                    sortable: true,
                    render: (row) => (
                        <div className="text-sm text-gray-900 dark:text-gray-200">
                        {row.event_date 
                          ? new Date(row.event_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </div>
                    ),
                  },
                  {
                    accessor: 'event_venue',
                    header: 'Venue',
                    sortable: true,
                    render: (row) => (
                      <div className="text-sm text-gray-900 dark:text-gray-200">
                        {row.event_venue || 'TBD'}
                      </div>
                    ),
                  },
                  {
                    accessor: 'guest_count',
                    header: 'Guests',
                    sortable: true,
                    render: (row) => (
                        <div className="text-sm text-gray-900 dark:text-gray-200">
                        {row.guest_count || row.number_of_guests || 'N/A'}
                        </div>
                    ),
                  },
                  {
                    accessor: 'status',
                    header: 'Status',
                    sortable: true,
                    render: (row) => getStatusBadge(row.booking_status || row.status),
                  },
                  {
                    accessor: 'price',
                    header: 'Total Price',
                    sortable: true,
                    render: (row) => (
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getPackagePrice(row)
                          ? `₱${parseFloat(getPackagePrice(row)).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : 'N/A'}
                      </div>
                    ),
                  },
                ]}
                searchable
                searchPlaceholder="Search bookings..."
                pagination
                pageSize={perPage}
              />
            </TabsContent>

            {/* Calendar View Tab */}
            <TabsContent value="calendar" className="mt-0">
              <BookingCalendarView 
                bookings={bookings} 
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
              />
            </TabsContent>

            {/* Timeline View Tab */}
            <TabsContent value="timeline" className="mt-0">
              <BookingTimelineView bookings={bookings} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <AnalyticsCharts bookings={bookings} />
            </TabsContent>
          </Tabs>
        )}
      </Card>

      {/* Testimonial Modal */}
      <TestimonialFormModal
        isOpen={showTestimonialModal}
        onClose={() => setShowTestimonialModal(false)}
        onSuccess={() => {
          // Optionally refresh bookings or show success message
        }}
      />
    </div>
  );
};

// Calendar View Component
const BookingCalendarView = ({ bookings, month, onMonthChange }) => {
  const eventsByDate = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      if (!booking.event_date) return acc;
      const dateStr = new Date(booking.event_date).toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(booking);
      return acc;
    }, {});
  }, [bookings]);

  const sortedDates = useMemo(() => Object.keys(eventsByDate).sort(), [eventsByDate]);

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    const statusStyles = {
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    const statusKey = normalizedStatus in statusStyles ? normalizedStatus : 'default';
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusStyles[statusKey] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {(status || 'Unknown').charAt(0).toUpperCase() + (status || 'Unknown').slice(1)}
      </span>
    );
  };

  const getPackageName = (booking) => {
    return booking?.eventPackage?.package_name || 
           booking?.event_package?.package_name || 
           booking?.package?.name || 
           booking?.package?.package_name || 
           'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors duration-300"
        />
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="transition-colors duration-300">No bookings in this month.</p>
        </div>
      ) : (
        sortedDates.map((date) => (
          <Card key={date} className="p-4 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">{formatDisplayDate(date)}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{eventsByDate[date].length} booking(s)</span>
            </div>
            <div className="space-y-3">
              {eventsByDate[date].map((booking) => (
                <div
                  key={booking.booking_id || booking.id}
                  className="p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2 transition-colors duration-300"
                >
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      {getPackageName(booking)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                      {booking.event_venue || 'Venue TBD'} • {booking.guest_count || booking.number_of_guests || 'N/A'} guests
                    </p>
                    {booking.event_time && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {booking.event_time}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(booking.booking_status || booking.status)}
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

// Timeline View Component
const BookingTimelineView = ({ bookings }) => {
  const timelineItems = useMemo(() => {
    return bookings
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
      .map((booking) => {
        const getPackageName = (b) => {
          return b?.eventPackage?.package_name || 
                 b?.event_package?.package_name || 
                 b?.package?.name || 
                 b?.package?.package_name || 
                 'N/A';
        };

        return {
          id: booking.booking_id || booking.id,
          title: getPackageName(booking),
          subtitle: `Booking #${booking.booking_id || booking.id}`,
          description: booking.special_requests || `Event scheduled for ${booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'TBD'}`,
          date: booking.created_at || booking.updated_at,
          status: booking.booking_status || booking.status,
          venue: booking.event_venue,
          guests: booking.guest_count || booking.number_of_guests,
        };
      });
  }, [bookings]);

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <p className="transition-colors duration-300">No booking history available.</p>
      </div>
    );
  }

  return <Timeline items={timelineItems} orientation="vertical" />;
};

export default ClientDashboard;
