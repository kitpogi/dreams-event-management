import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminNavbar from '../../../components/layout/AdminNavbar';
import { Card, LoadingSpinner, Button } from '../../../components/ui';
import { useSidebar } from '../../../context/SidebarContext';

const statusColors = {
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
};

const AdminBookingsCalendar = () => {
  const { isCollapsed } = useSidebar();
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState({ start_date: '', end_date: '', status_counts: {} });
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchEvents(month);
  }, [month]);

  const fetchEvents = async (monthValue) => {
    try {
      setLoading(true);
      const [y, m] = monthValue.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);

      const response = await api.get('/bookings/calendar', {
        params: {
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
        },
      });
      setEvents(response.data.data || []);
      setMeta(response.data.meta || {});
    } catch (error) {
      console.error('Error loading calendar events', error);
    } finally {
      setLoading(false);
    }
  };

  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!event.date) return acc;
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [events]);

  const sortedDates = useMemo(() => Object.keys(eventsByDate).sort(), [eventsByDate]);

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <AdminNavbar />
      <main
        className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300 pt-16"
        style={{
          marginLeft: isCollapsed ? '5rem' : '16rem',
          width: isCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 16rem)',
        }}
      >
        <div className="p-4 sm:p-6 lg:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
                Bookings Calendar
              </h1>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                View bookings by date with status breakdown.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
              />
              <Button variant="outline" onClick={() => fetchEvents(month)} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['pending', 'approved', 'confirmed', 'completed', 'cancelled'].map((key) => (
                  <div
                    key={key}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize transition-colors duration-300">
                      {key}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      {meta.status_counts?.[key] ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {sortedDates.length === 0 ? (
              <Card className="text-center py-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  No bookings in this range.
                </p>
              </Card>
            ) : (
              sortedDates.map((date) => (
                <Card
                  key={date}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      {formatDisplayDate(date)}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      {eventsByDate[date].length} booking(s)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {eventsByDate[date].map((event) => {
                      const statusKey = (event.status || '').toLowerCase();
                      return (
                        <div
                          key={event.id}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2 transition-colors duration-300"
                        >
                          <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                              {event.package || 'Event Package'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                              {event.client || 'Unknown client'} • Guests: {event.guest_count ?? 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 transition-colors duration-300">
                              {event.venue || 'Venue TBD'}{event.time ? ` • ${event.time}` : ''}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors duration-300 ${
                              statusColors[statusKey] ||
                              'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-500'
                            }`}
                          >
                            {event.status || 'Unknown'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default AdminBookingsCalendar;

