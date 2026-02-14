import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { LoadingSpinner, Card, Button, StatsCard } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp, Download, FileText, FileSpreadsheet, BarChart3, Sparkles, Users, Mail } from 'lucide-react';
import { UserActivityChart } from '../../../components/features';

const COLORS = ['#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

const AnalyticsDashboard = () => {
  const { isAdmin, isCoordinator } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics', {
        params: dateRange,
      });
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (format = 'pdf') => {
    try {
      const response = await api.get(`/analytics/report`, {
        params: { ...dateRange, format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Report downloaded successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/20 dark:from-[#0b1121] dark:via-[#0d1529] dark:to-[#0b1121]">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center py-20">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No analytics data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const statusChartData = Object.entries(analytics.bookings_by_status || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const revenueChartData = analytics.monthly_revenue?.map((month) => ({
    month: month.month,
    revenue: parseFloat(month.revenue) || 0,
  })) || [];

  const packageChartData = analytics.popular_packages?.slice(0, 5).map((pkg) => ({
    name: pkg.package_name,
    bookings: pkg.booking_count,
    revenue: parseFloat(pkg.total_revenue) || 0,
  })) || [];

  return (
    <div className="relative pb-20">
      <div className="relative p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl">
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
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-base font-semibold">Business insights and performance metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateReport('pdf')}
              className="flex items-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <FileText className="h-4 w-4" />
              PDF Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateReport('xlsx')}
              className="flex items-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel Report
            </Button>
          </div>
        </div>

        {/* Enhanced Date Range Filter */}
        <Card variant="glass" className="mb-8 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-bold transition-all duration-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-bold transition-all duration-300"
              />
            </div>
            <Button
              onClick={fetchAnalytics}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all duration-300 h-[48px] px-8 font-black rounded-xl"
            >
              <Calendar className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </Card>

        {/* Enhanced Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatsCard
            title="Total Bookings"
            value={analytics.overview?.total_bookings || 0}
            unit="Events"
            trend="+12%"
            color="blue"
            icon={Calendar}
          />
          <StatsCard
            title="Total Revenue"
            value={`₱${((analytics.overview?.total_revenue || 0) / 1000).toFixed(0)}k`}
            unit="Revenue"
            trend="+8.5%"
            color="green"
            icon={TrendingUp}
          />
          <StatsCard
            title="Total Clients"
            value={analytics.overview?.total_clients || 0}
            unit="Users"
            trend="+24"
            color="cyan"
            icon={Users}
          />
          <StatsCard
            title="Contact Inquiries"
            value={analytics.overview?.total_inquiries || 0}
            unit="Messages"
            trend="+15%"
            color="orange"
            icon={Mail}
          />
        </div>

        {/* Enhanced Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Revenue Trend Line Chart */}
          <Card variant="glass" className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Monthly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="month"
                  stroke="#374151"
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 600, className: 'dark:fill-gray-300' }}
                />
                <YAxis
                  stroke="#374151"
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 600, className: 'dark:fill-gray-300' }}
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                  formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#111827', fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontWeight: 600, fontSize: '14px' }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Revenue"
                  dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Bookings by Status Pie Chart */}
          <Card variant="glass" className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Bookings by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Popular Packages Bar Chart */}
        {packageChartData.length > 0 && (
          <Card variant="glass" className="p-6 sm:p-8 mb-10">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Top 5 Popular Packages</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={packageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="name"
                  stroke="#374151"
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#374151', fontSize: 11, fontWeight: 600, className: 'dark:fill-gray-300' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  stroke="#374151"
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 600, className: 'dark:fill-gray-300' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontWeight: 600, fontSize: '14px' }} />
                <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" fill="#06b6d4" name="Revenue (₱)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* User Activity Chart */}
        <div className="mb-10">
          <UserActivityChart />
        </div>

        {/* Enhanced Popular Packages Table */}
        <Card variant="glass" className="p-6 sm:p-8 mb-10">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Popular Packages</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase dark:text-gray-200 tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase dark:text-gray-200 tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase dark:text-gray-200 tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.popular_packages?.map((pkg, index) => (
                  <tr
                    key={pkg.package_id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {pkg.package_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{pkg.booking_count}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                      ₱{pkg.total_revenue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Enhanced Recent Bookings */}
        <Card variant="glass" className="p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase dark:text-gray-200 tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase dark:text-gray-200 tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase dark:text-gray-200 tracking-wider">
                    Event Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase dark:text-gray-200 tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.recent_bookings?.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {booking.client_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {booking.package_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {new Date(booking.event_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1.5 text-xs font-bold rounded-full ${booking.status === 'Approved' || booking.status === 'Completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700'
                          : booking.status === 'Pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
                          }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
