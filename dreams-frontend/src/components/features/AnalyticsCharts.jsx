import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, TrendingUp, Package, DollarSign, Filter } from 'lucide-react';
import { Button } from '../ui/Button';

const AnalyticsCharts = ({ bookings = [] }) => {
  const [dateRange, setDateRange] = useState('all'); // 'all', '7days', '30days', '3months', '6months', '1year'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'confirmed', 'cancelled', 'completed'

  // Filter bookings based on selected filters
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      switch (dateRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6months':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      if (startDate) {
        filtered = filtered.filter(b => {
          const bookingDate = b.created_at ? new Date(b.created_at) : null;
          return bookingDate && bookingDate >= startDate;
        });
      }
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => {
        const status = (b.booking_status || b.status || '').toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }

    return filtered;
  }, [bookings, dateRange, statusFilter]);

  // Calculate statistics from filtered bookings
  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter bookings by date
    const recentBookings = filteredBookings.filter(b => {
      const bookingDate = b.created_at ? new Date(b.created_at) : null;
      return bookingDate && bookingDate >= last30Days;
    });

    const last7DaysBookings = filteredBookings.filter(b => {
      const bookingDate = b.created_at ? new Date(b.created_at) : null;
      return bookingDate && bookingDate >= last7Days;
    });

    // Group by status
    const statusCounts = bookings.reduce((acc, booking) => {
      const status = (booking.booking_status || booking.status || 'unknown').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Group by month for trend
    const monthlyData = filteredBookings.reduce((acc, booking) => {
      if (!booking.created_at) return acc;
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, revenue: 0 };
      }
      acc[monthKey].count += 1;
      const price = booking?.eventPackage?.package_price || 
                   booking?.event_package?.package_price || 
                   booking?.package?.price || 
                   booking?.package?.package_price || 0;
      acc[monthKey].revenue += parseFloat(price) || 0;
      return acc;
    }, {});

    // Calculate total revenue
    const totalRevenue = filteredBookings.reduce((sum, booking) => {
      const price = booking?.eventPackage?.package_price || 
                   booking?.event_package?.package_price || 
                   booking?.package?.price || 
                   booking?.package?.package_price || 0;
      return sum + (parseFloat(price) || 0);
    }, 0);

    return {
      total: filteredBookings.length,
      recent: recentBookings.length,
      last7Days: last7DaysBookings.length,
      statusCounts,
      monthlyData: Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6), // Last 6 months
      totalRevenue,
    };
  }, [filteredBookings]);

  const maxCount = Math.max(...stats.monthlyData.map(([, data]) => data.count), 1);
  const maxRevenue = Math.max(...stats.monthlyData.map(([, data]) => data.revenue), 1);

  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filter Analytics</CardTitle>
          </div>
          <CardDescription>Filter bookings by date range and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full min-h-[44px] touch-manipulation">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full min-h-[44px] touch-manipulation">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDateRange('all');
                  setStatusFilter('all');
                }}
                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last 30 Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.recent}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ₱{stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last 7 Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.last7Days}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Trends (Last 6 Months)</CardTitle>
          <CardDescription>Number of bookings per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.monthlyData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No booking data available</p>
              </div>
            ) : (
              stats.monthlyData.map(([month, data]) => (
                <div key={month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatMonth(month)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{data.count} bookings</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-3 rounded-full transition-all"
                      style={{ width: `${(data.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends (Last 6 Months)</CardTitle>
          <CardDescription>Total revenue per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.monthlyData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No revenue data available</p>
              </div>
            ) : (
              stats.monthlyData.map(([month, data]) => (
                <div key={month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatMonth(month)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ₱{data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Status Distribution</CardTitle>
          <CardDescription>Breakdown of bookings by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.keys(stats.statusCounts).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No status data available</p>
              </div>
            ) : (
              Object.entries(stats.statusCounts).map(([status, count]) => {
                const percentage = (count / stats.total) * 100;
                const statusColors = {
                  pending: 'bg-yellow-500',
                  approved: 'bg-green-500',
                  confirmed: 'bg-green-500',
                  cancelled: 'bg-red-500',
                  completed: 'bg-blue-500',
                };
                const color = statusColors[status] || 'bg-gray-500';

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {status}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`${color} h-3 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;

