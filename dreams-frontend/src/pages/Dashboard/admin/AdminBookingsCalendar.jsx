import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import { Card, LoadingSpinner, Button } from '../../../components/ui';

const statusColors = {
  approved: 'bg-green-100 text-green-800 border-green-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const AdminBookingsCalendar = () => {
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
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-10 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bookings Calendar</h1>
            <p className="text-gray-600">View bookings by date with status breakdown.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <Card>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['pending', 'approved', 'confirmed', 'completed', 'cancelled'].map((key) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 capitalize">{key}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {meta.status_counts?.[key] ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {sortedDates.length === 0 ? (
              <Card className="text-center py-10">
                <p className="text-gray-600">No bookings in this range.</p>
              </Card>
            ) : (
              sortedDates.map((date) => (
                <Card key={date} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{formatDisplayDate(date)}</h3>
                    <span className="text-sm text-gray-500">{eventsByDate[date].length} booking(s)</span>
                  </div>
                  <div className="space-y-3">
                    {eventsByDate[date].map((event) => {
                      const statusKey = (event.status || '').toLowerCase();
                      return (
                        <div
                          key={event.id}
                          className="p-3 border rounded-lg bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                        >
                          <div>
                            <p className="text-base font-semibold text-gray-900">
                              {event.package || 'Event Package'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {event.client || 'Unknown client'} • Guests: {event.guest_count ?? 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {event.venue || 'Venue TBD'}{event.time ? ` • ${event.time}` : ''}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                              statusColors[statusKey] || 'bg-gray-100 text-gray-800 border-gray-200'
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
      </main>
    </div>
  );
};

export default AdminBookingsCalendar;

