import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalBookings: 0,
    totalClients: 0,
    pendingBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
  }, []);

  const fetchStats = async () => {
    try {
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

  const StatCard = ({ title, value, link, linkText, icon }) => (
    <div className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium uppercase">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-2">{value}</p>
      {link && (
        <Link
          to={link}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <StatCard
                title="Total Packages"
                value={stats.totalPackages}
                link="/admin/packages"
                linkText="Manage Packages"
                icon="📦"
              />
              <StatCard
                title="Total Bookings"
                value={stats.totalBookings}
                link="/admin/bookings"
                linkText="Manage Bookings"
                icon="📅"
              />
              <StatCard
                title="Total Clients"
                value={stats.totalClients}
                link="/admin/clients"
                linkText="Manage Clients"
                icon="👥"
              />
              <StatCard
                title="Pending Bookings"
                value={stats.pendingBookings}
                icon="⏳"
              />
            </div>

            <section className="bg-white p-6 shadow-md rounded-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activities</h2>
              {recentBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Package
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentBookings.map((booking, index) => (
                        <tr key={booking.booking_id || booking.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.client ? `${booking.client.client_fname} ${booking.client.client_lname}` : (booking.user?.name || 'N/A')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.event_package?.package_name || booking.package?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(booking.event_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                (booking.booking_status || booking.status || '').toLowerCase() === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : (booking.booking_status || booking.status || '').toLowerCase() === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {booking.booking_status || booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{parseFloat(booking.event_package?.package_price || booking.total_price || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent bookings found.</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

