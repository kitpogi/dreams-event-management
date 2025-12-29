import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CubeIcon,
  CalendarDaysIcon,
  UsersIcon,
  ClockIcon,
  UserCircleIcon,
  CheckCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Package, Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import { LoadingSpinner, StatsCard, DataTable, Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
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
      const allBookings = response.data.data || response.data || [];
      // Get 5 most recent bookings
      const recent = allBookings
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentBookings(recent);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };


  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-10 bg-gray-50 min-h-screen">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
          {isCoordinator ? 'Coordinator Dashboard' : 'Admin Dashboard'}
        </h1>

        {/* Coordinator Profile Section */}
        {isCoordinator && user && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Picture/Avatar */}
              <div className="relative">
                <div className="bg-white/20 rounded-full p-1 border-4 border-white/30">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-white/30 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {user.name
                          ?.split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2) || 'CO'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-400 border-4 border-indigo-500 rounded-full h-6 w-6"></div>
              </div>

              {/* Profile Information */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold">{user.name}</h2>
                  <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    Event Coordinator
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <svg className="h-5 w-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-indigo-200 uppercase tracking-wide mb-1">Email</p>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        <svg className="h-5 w-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-indigo-200 uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-white font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.created_at && (
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        <svg className="h-5 w-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-indigo-200 uppercase tracking-wide mb-1">Member Since</p>
                        <p className="text-white font-medium">
                          {new Date(user.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <svg className="h-5 w-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-indigo-200 uppercase tracking-wide mb-1">Status</p>
                      <p className="text-white font-medium">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {isCoordinator ? (
                <>
                  <StatsCard
                    title="My Assigned Bookings"
                    value={stats.assignedBookings}
                    link="/admin/bookings"
                    linkText="View Bookings"
                    icon={Calendar}
                    variant="primary"
                  />
                  <StatsCard
                    title="Pending Bookings"
                    value={stats.pendingAssigned}
                    link="/admin/bookings"
                    linkText="View Pending"
                    icon={Clock}
                    variant="warning"
                  />
                  <StatsCard
                    title="Upcoming Events"
                    value={stats.upcomingEvents}
                    link="/admin/bookings"
                    linkText="View Upcoming"
                    icon={Calendar}
                    variant="success"
                  />
                  <StatsCard
                    title="Completed This Month"
                    value={stats.completedEvents}
                    icon={CheckCircleIcon}
                    variant="default"
                  />
                </>
              ) : (
                <>
                  <StatsCard
                    title="Total Packages"
                    value={stats.totalPackages}
                    link="/admin/packages"
                    linkText="Manage Packages"
                    icon={Package}
                    variant="primary"
                  />
                  <StatsCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    link="/admin/bookings"
                    linkText="Manage Bookings"
                    icon={Calendar}
                    variant="success"
                  />
                  <StatsCard
                    title="Total Clients"
                    value={stats.totalClients}
                    link="/admin/clients"
                    linkText="Manage Clients"
                    icon={Users}
                    variant="default"
                  />
                  <StatsCard
                    title="Pending Bookings"
                    value={stats.pendingBookings}
                    icon={Clock}
                    variant="warning"
                  />
                </>
              )}
            </div>

            <section className="bg-white p-6 shadow-md rounded-xl">
              <Tabs defaultValue="recent" className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {isCoordinator ? 'My Recent Bookings' : 'Recent Activities'}
                  </h2>
                  <TabsList>
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                    <TabsTrigger value="all">All Bookings</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="recent" className="mt-6">
                  {recentBookings.length > 0 ? (
                    <DataTable
                      data={recentBookings}
                      columns={[
                        {
                          accessor: 'client_name',
                          header: 'Client',
                          sortable: true,
                          render: (row) => row.client?.name || row.client_name || 'N/A',
                        },
                        {
                          accessor: 'package_name',
                          header: 'Package',
                          sortable: true,
                          render: (row) => row.package?.package_name || row.package_name || 'N/A',
                        },
                        {
                          accessor: 'event_date',
                          header: 'Event Date',
                          sortable: true,
                          render: (row) => row.event_date 
                            ? new Date(row.event_date).toLocaleDateString()
                            : 'N/A',
                        },
                        {
                          accessor: 'status',
                          header: 'Status',
                          sortable: true,
                          render: (row) => {
                            const status = (row.booking_status || row.status || '').toLowerCase();
                            const colors = {
                              pending: 'bg-yellow-100 text-yellow-800',
                              confirmed: 'bg-green-100 text-green-800',
                              completed: 'bg-blue-100 text-blue-800',
                              cancelled: 'bg-red-100 text-red-800',
                            };
                            return (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                colors[status] || 'bg-gray-100 text-gray-800'
                              }`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            );
                          },
                        },
                        {
                          accessor: 'total_amount',
                          header: 'Amount',
                          sortable: true,
                          render: (row) => row.total_amount 
                            ? `₱${parseFloat(row.total_amount).toLocaleString()}`
                            : 'N/A',
                        },
                      ]}
                      searchable
                      pagination={false}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No recent bookings found.
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="all" className="mt-6">
                  <div className="text-center py-12 text-gray-500">
                    <Link to="/admin/bookings" className="text-indigo-600 hover:text-indigo-700">
                      View all bookings →
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

