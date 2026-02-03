import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import { Card, LoadingSpinner, Button } from '../../../components/ui';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Grid3x3, List, Clock, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const statusColors = {
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
};

// Availability status colors for calendar cells
const availabilityColors = {
  blocked: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
  pending: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
  available: 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600',
};

const AdminBookingsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState({ start_date: '', end_date: '', status_counts: {} });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
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

  // Get availability status for a day
  const getAvailabilityStatus = (dayEvents) => {
    if (!dayEvents || dayEvents.length === 0) return 'available';

    const hasApproved = dayEvents.some(e =>
      ['approved', 'confirmed'].includes((e.status || '').toLowerCase())
    );
    const hasPending = dayEvents.some(e =>
      (e.status || '').toLowerCase() === 'pending'
    );

    if (hasApproved) return 'blocked';
    if (hasPending) return 'pending';
    return 'available';
  };

  // Calendar grid calculations with availability
  const calendarData = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

    const days = [];
    const currentDate = new Date(startDate);
    const today = new Date().toISOString().split('T')[0];

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === m - 1;
      const isToday = dateStr === today;
      const isPast = dateStr < today;
      const dayEvents = eventsByDate[dateStr] || [];
      const availabilityStatus = getAvailabilityStatus(dayEvents);

      days.push({
        date: new Date(currentDate),
        dateStr,
        isCurrentMonth,
        isToday,
        isPast,
        events: dayEvents,
        dayNumber: currentDate.getDate(),
        availabilityStatus,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      days,
      monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [month, eventsByDate]);

  // Navigation functions
  const goToPreviousMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const newDate = new Date(y, m - 2, 1);
    setMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const newDate = new Date(y, m, 1);
    setMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToToday = () => {
    const now = new Date();
    setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300/20 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Bookings Calendar
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-base font-semibold">
                View bookings by date with status breakdown
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-1.5 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${viewMode === 'grid'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <Grid3x3 className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${viewMode === 'list'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium transition-all duration-300"
            />
            <Button
              variant="outline"
              onClick={() => fetchEvents(month)}
              disabled={loading}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Enhanced Status Summary Cards */}
            <Card className="p-6 sm:p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {['pending', 'approved', 'confirmed', 'completed', 'cancelled'].map((key) => {
                  const colorMap = {
                    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
                    approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                    confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                    completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                  };
                  return (
                    <div
                      key={key}
                      className="group p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                        {key}
                      </p>
                      <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white transition-colors duration-300 tracking-tight">
                        {meta.status_counts?.[key] ?? 0}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Calendar Grid View */}
            {viewMode === 'grid' ? (
              <Card className="p-6 sm:p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-2xl">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {calendarData.monthName}
                  </h2>

                  {/* Availability Legend */}
                  {showLegend && (
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md bg-white border-2 border-green-400 flex items-center justify-center">
                          <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center">
                          <AlertTriangle className="w-2.5 h-2.5 text-yellow-600" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Pending Request</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md bg-red-100 border-2 border-red-400 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-red-500" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Blocked (Approved)</span>
                      </div>
                      <button
                        onClick={() => setShowLegend(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {!showLegend && (
                    <button
                      onClick={() => setShowLegend(true)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Show Legend
                    </button>
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Calendar Days with Availability Indicators */}
                  {calendarData.days.map((day, index) => {
                    const statusCounts = day.events.reduce((acc, event) => {
                      const status = (event.status || '').toLowerCase();
                      acc[status] = (acc[status] || 0) + 1;
                      return acc;
                    }, {});

                    // Determine cell styling based on availability
                    const getAvailabilityClasses = () => {
                      if (!day.isCurrentMonth) {
                        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-50';
                      }
                      if (day.isToday) {
                        return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-600 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-500';
                      }
                      if (selectedDate === day.dateStr) {
                        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600 shadow-lg';
                      }
                      if (day.isPast) {
                        return 'bg-gray-100 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 opacity-60';
                      }
                      // Future dates with availability status
                      switch (day.availabilityStatus) {
                        case 'blocked':
                          return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600';
                        case 'pending':
                          return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-600';
                        default:
                          return 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10';
                      }
                    };

                    return (
                      <div
                        key={index}
                        onClick={() => {
                          if (day.isCurrentMonth && day.events.length > 0) {
                            setSelectedDate(selectedDate === day.dateStr ? null : day.dateStr);
                          }
                        }}
                        className={`min-h-[80px] sm:min-h-[100px] p-2 border-2 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-md ${getAvailabilityClasses()}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-sm font-bold ${day.isToday
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : day.isCurrentMonth
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
                              {day.dayNumber}
                            </span>
                            {/* Availability icon */}
                            {day.isCurrentMonth && !day.isPast && (
                              <>
                                {day.availabilityStatus === 'blocked' && (
                                  <Lock className="w-3 h-3 text-red-500" title="Date blocked (approved booking)" />
                                )}
                                {day.availabilityStatus === 'pending' && (
                                  <AlertTriangle className="w-3 h-3 text-yellow-600" title="Pending request" />
                                )}
                              </>
                            )}
                          </div>
                          {day.events.length > 0 && (
                            <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded-full ${day.availabilityStatus === 'blocked'
                                ? 'text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-800/50'
                                : day.availabilityStatus === 'pending'
                                  ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-200 dark:bg-yellow-800/50'
                                  : 'text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600'
                              }`}>
                              {day.events.length}
                            </span>
                          )}
                        </div>

                        {/* Status Indicators */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(statusCounts).slice(0, 3).map(([status, count]) => {
                            const statusColorMap = {
                              pending: 'bg-yellow-500',
                              approved: 'bg-green-500',
                              confirmed: 'bg-green-600',
                              completed: 'bg-blue-500',
                              cancelled: 'bg-red-500',
                            };
                            return (
                              <div
                                key={status}
                                className={`w-2 h-2 rounded-full ${statusColorMap[status] || 'bg-gray-400'}`}
                                title={`${status}: ${count}`}
                              />
                            );
                          })}
                          {Object.keys(statusCounts).length > 3 && (
                            <div className="w-2 h-2 rounded-full bg-gray-400" title="More statuses" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Date Details */}
                {selectedDate && eventsByDate[selectedDate] && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {formatDisplayDate(selectedDate)}
                      </h3>
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-3">
                      {eventsByDate[selectedDate].map((event) => {
                        const statusKey = (event.status || '').toLowerCase();
                        return (
                          <div
                            key={event.id}
                            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                  {event.package || 'Event Package'}
                                </p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {event.client || 'Unknown client'} • Guests: {event.guest_count ?? 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {event.venue || 'Venue TBD'}{event.time ? ` • ${event.time}` : ''}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1.5 text-xs font-bold rounded-full border ${statusColors[statusKey] ||
                                  'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-500'
                                  }`}
                              >
                                {event.status || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              /* Enhanced List View */
              sortedDates.length === 0 ? (
                <Card className="text-center py-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-2xl">
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    No bookings in this range.
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {sortedDates.map((date) => (
                    <Card
                      key={date}
                      className="p-6 sm:p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                          {formatDisplayDate(date)}
                        </h3>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                          {eventsByDate[date].length} booking{eventsByDate[date].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {eventsByDate[date].map((event) => {
                          const statusKey = (event.status || '').toLowerCase();
                          return (
                            <div
                              key={event.id}
                              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-700/50 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-300 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600"
                            >
                              <div className="flex-1">
                                <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                  {event.package || 'Event Package'}
                                </p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {event.client || 'Unknown client'} • Guests: {event.guest_count ?? 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {event.venue || 'Venue TBD'}{event.time ? ` • ${event.time}` : ''}
                                </p>
                              </div>
                              <span
                                className={`px-4 py-2 text-xs font-bold rounded-full border ${statusColors[statusKey] ||
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
                  ))}
                </div>
              )
            )}

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
                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors duration-300 ${statusColors[statusKey] ||
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
    </div>
  );
};

export default AdminBookingsCalendar;

