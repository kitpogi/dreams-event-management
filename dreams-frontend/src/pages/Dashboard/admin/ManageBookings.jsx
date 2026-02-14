import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { LoadingSpinner, Button, FormModal, Pagination } from '../../../components/ui';
import CoordinatorChecklist from '../../../components/features/CoordinatorChecklist';
import { useAuth } from '../../../context/AuthContext';
import { ClipboardList, CheckSquare, Square, X, Search, Filter, Download, LayoutGrid, List, Calendar, Users, DollarSign, Clock, ChevronLeft, ChevronRight, CreditCard, FileText, ChevronUp } from 'lucide-react';

const ManageBookings = () => {
  const { isAdmin, isCoordinator } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [assigningCoordinator, setAssigningCoordinator] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [expandedPayments, setExpandedPayments] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});
  const [loadingPayments, setLoadingPayments] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [viewingTasksFor, setViewingTasksFor] = useState(null);

  // Bulk selection state
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings(page);
    // Only admins (not coordinators) can assign coordinators, so fetch list
    if (isAdmin && !isCoordinator) {
      fetchCoordinators();
    }
  }, [page, isAdmin, isCoordinator]);

  const fetchBookings = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/bookings', {
        params: {
          page: pageToLoad,
          per_page: perPage,
          search: searchQuery,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      setBookings(response.data.data || response.data || []);
      setMeta(response.data.meta || { total: 0, last_page: 1 });
      setPage(response.data.meta?.current_page || pageToLoad);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinators = async () => {
    try {
      setLoadingCoordinators(true);
      const response = await api.get('/coordinators');
      setCoordinators(response.data.data || []);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast.error('Failed to load coordinators list');
    } finally {
      setLoadingCoordinators(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/bookings/status/${id}`, { status });
      toast.success('Booking status updated successfully!');
      // Refresh the bookings list
      await fetchBookings(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleEditNotes = (booking) => {
    setEditingNotes(booking.booking_id);
    setNotesText(booking.internal_notes || '');
  };

  const handleSaveNotes = async (bookingId) => {
    try {
      setSavingNotes(true);
      await api.patch(`/bookings/${bookingId}/notes`, {
        notes: notesText,
      });
      toast.success('Notes saved successfully!');
      setEditingNotes(null);
      await fetchBookings(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  const handleAssignCoordinator = async (bookingId, coordinatorId) => {
    if (!coordinatorId) {
      // Unassign coordinator
      try {
        setAssigningCoordinator(bookingId);
        await api.delete(`/bookings/${bookingId}/unassign-coordinator`);
        toast.success('Coordinator unassigned successfully!');
        await fetchBookings(page);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to unassign coordinator');
      } finally {
        setAssigningCoordinator(null);
      }
      return;
    }

    try {
      setAssigningCoordinator(bookingId);
      await api.post(`/bookings/${bookingId}/assign-coordinator`, {
        coordinator_id: coordinatorId,
      });
      toast.success('Coordinator assigned successfully!');
      await fetchBookings(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign coordinator');
    } finally {
      setAssigningCoordinator(null);
    }
  };

  // Payment helper functions
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPaymentInfo = (booking) => {
    const payments = booking.payments || [];
    const totalPaid = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalAmount = parseFloat(booking?.total_amount || booking?.eventPackage?.package_price || booking?.event_package?.package_price || 0);
    const remainingBalance = Math.max(0, totalAmount - totalPaid);
    const paymentStatus = booking?.payment_status || 'unpaid';

    return { totalPaid, totalAmount, remainingBalance, paymentStatus, payments };
  };

  const getPaymentStatusBadge = (status, remainingBalance, totalAmount) => {
    const statusConfig = {
      unpaid: {
        label: 'Unpaid',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
        icon: '⚠️'
      },
      partial: {
        label: 'Partial',
        className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
        icon: '💰'
      },
      paid: {
        label: 'Paid',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
        icon: '✅'
      },
      refunded: {
        label: 'Refunded',
        className: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800',
        icon: '↩️'
      },
    };
    const config = statusConfig[status] || statusConfig.unpaid;

    return (
      <div className="flex flex-col gap-0.5 lg:gap-1">
        <span className={`inline-flex items-center px-2 py-1 lg:px-3 lg:py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${config.className}`}>
          {config.label}
        </span>
        {status === 'partial' && (
          <div className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
            {formatCurrency(remainingBalance)} remaining
          </div>
        )}
        {status === 'unpaid' && totalAmount > 0 && (
          <div className="text-xs text-red-600 dark:text-red-400 font-medium hidden sm:block">
            {formatCurrency(totalAmount)} due
          </div>
        )}
      </div>
    );
  };

  const fetchPaymentDetails = async (bookingId) => {
    if (paymentDetails[bookingId]) {
      // Already fetched, just toggle
      setExpandedPayments(prev => ({
        ...prev,
        [bookingId]: !prev[bookingId]
      }));
      return;
    }

    try {
      setLoadingPayments(prev => ({ ...prev, [bookingId]: true }));
      const response = await api.get(`/bookings/${bookingId}/payments`);
      setPaymentDetails(prev => ({
        ...prev,
        [bookingId]: response.data.data || []
      }));
      setExpandedPayments(prev => ({
        ...prev,
        [bookingId]: true
      }));
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to load payment details');
    } finally {
      setLoadingPayments(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const togglePaymentDetails = (bookingId) => {
    if (!paymentDetails[bookingId]) {
      fetchPaymentDetails(bookingId);
    } else {
      setExpandedPayments(prev => ({
        ...prev,
        [bookingId]: !prev[bookingId]
      }));
    }
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      card: '💳',
      gcash: '📱',
      maya: '📱',
      qr_ph: '📲',
      bank_transfer: '🏦',
      otc: '💵',
    };
    return icons[method] || '💰';
  };

  // Bulk selection functions
  const toggleBookingSelection = (bookingId) => {
    setSelectedBookings((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map((b) => b.booking_id));
    }
  };

  const clearSelection = () => {
    setSelectedBookings([]);
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedBookings.length === 0) {
      toast.warning('Please select at least one booking');
      return;
    }

    try {
      setBulkActionLoading(true);
      const response = await api.post('/bookings/bulk-status', {
        booking_ids: selectedBookings,
        status: status,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedBookings([]);
        await fetchBookings(page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bookings');
    } finally {
      setBulkActionLoading(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const stats = React.useMemo(() => {
    return {
      total: meta.total || 0,
      confirmed: bookings.filter(b => b.booking_status === 'Confirmed' || b.booking_status === 'Approved').length,
      pending: bookings.filter(b => b.booking_status === 'Pending').length,
      completed: bookings.filter(b => b.booking_status === 'Completed').length,
    };
  }, [bookings, meta.total]);


  return (
    <div className="relative pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transform transition-transform hover:scale-105">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">
                Reservation Control
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Coordinate and track all event bookings</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="glass"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={async () => {
                try {
                  const response = await api.get('/bookings/export', {
                    responseType: 'blob',
                  });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'bookings_export.csv');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (error) {
                  toast.error('Failed to export bookings');
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Volume', value: stats.total, icon: Calendar, color: 'indigo' },
            { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'amber' },
            { label: 'Confirmed', value: stats.confirmed, icon: CheckSquare, color: 'emerald' },
            { label: 'Successful Events', value: stats.completed, icon: Users, color: 'blue' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-2xl group hover:border-indigo-500/50 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-5 h-5 text-indigo-400`} />
                </div>
                <span className="text-3xl font-black text-white">{stat.value}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Control Bar */}
        <div className="bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl mb-10">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Find client or package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 border border-white/10 rounded-2xl">
                <Filter className="w-4 h-4 text-indigo-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-sm font-black uppercase tracking-widest text-white focus:outline-none"
                >
                  <option value="all" className="bg-slate-900">All Status</option>
                  <option value="Pending" className="bg-slate-900">Pending</option>
                  <option value="Confirmed" className="bg-slate-900">Confirmed</option>
                  <option value="Completed" className="bg-slate-900">Completed</option>
                  <option value="Cancelled" className="bg-slate-900">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-black/20 p-1.5 rounded-2xl border border-white/5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-gray-500 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'card' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-gray-500 hover:text-white'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedBookings.length > 0 && !isCoordinator && (
          <div className="mb-8 p-6 bg-indigo-600/20 backdrop-blur-3xl border border-indigo-500/30 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-indigo-500/40">
                  {selectedBookings.length}
                </div>
                <div>
                  <p className="text-lg font-black text-white">Selection Active</p>
                  <p className="text-sm text-indigo-300 font-medium">Batch process selected reservations</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="glass"
                  onClick={() => handleBulkStatusUpdate('Confirmed')}
                  disabled={bulkActionLoading}
                  className="bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="glass"
                  onClick={() => handleBulkStatusUpdate('Cancelled')}
                  disabled={bulkActionLoading}
                  className="bg-rose-500 text-white hover:bg-rose-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>

                <select
                  onChange={(e) => e.target.value && handleBulkStatusUpdate(e.target.value)}
                  disabled={bulkActionLoading}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  <option value="" className="bg-slate-900">More Actions...</option>
                  <option value="Pending" className="bg-slate-900">Move to Pending</option>
                  <option value="Completed" className="bg-slate-900">Mark Completed</option>
                </select>

                <button
                  onClick={clearSelection}
                  className="px-4 py-2 text-indigo-400 hover:text-indigo-300 text-sm font-black uppercase tracking-widest transition-colors"
                >
                  Reset
                </button>
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
            {/* Card View - Mobile/Tablet */}
            <div className="lg:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.map((booking, index) => {
                  const paymentInfo = getPaymentInfo(booking);
                  const isExpanded = expandedPayments[booking.booking_id];
                  const bookingPayments = paymentDetails[booking.booking_id] || booking.payments || [];

                  return (
                    <div key={booking.booking_id || index} className="bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 group">
                      <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-14 h-14 bg-indigo-600/20 rounded-2xl border border-indigo-500/20">
                              <span className="text-xl font-black text-indigo-400">
                                {(booking.client?.client_fname || 'C').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">
                                {booking.client ? `${booking.client.client_fname} ${booking.client.client_lname}` : 'N/A'}
                              </h3>
                              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1">
                                {booking.eventPackage?.package_name || booking.event_package?.package_name || 'Custom Package'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all duration-300 ${booking.booking_status === 'Approved' || booking.booking_status === 'Confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : booking.booking_status === 'Completed'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : booking.booking_status === 'Pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                          >
                            {booking.booking_status === 'Approved' ? 'Approved' : booking.booking_status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Event Date</span>
                            <p className="text-sm font-bold text-white uppercase">
                              {new Date(booking.event_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 text-right">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Attendance</span>
                            <p className="text-sm font-bold text-white uppercase">{booking.guest_count} Guests</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Coordinator</span>
                            {isAdmin && !isCoordinator ? (
                              <select
                                value={booking.coordinator_id || ''}
                                onChange={(e) => handleAssignCoordinator(booking.booking_id, e.target.value)}
                                disabled={assigningCoordinator === booking.booking_id}
                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none pr-8 relative"
                                style={{ backgroundImage: 'url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                              >
                                <option value="" className="bg-slate-900">No Coordinator</option>
                                {coordinators.map((coordinator) => (
                                  <option key={coordinator.id} value={coordinator.id} className="bg-slate-900">
                                    {coordinator.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-sm font-bold text-gray-300 mt-1">{booking.coordinator ? booking.coordinator.name : 'Not Assigned'}</p>
                            )}
                          </div>

                          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Finance Overview</span>
                              {getPaymentStatusBadge(paymentInfo.paymentStatus, paymentInfo.remainingBalance, paymentInfo.totalAmount)}
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-2xl font-black text-white">{formatCurrency(paymentInfo.totalPaid)}</span>
                              <span className="text-xs text-gray-500">of {formatCurrency(paymentInfo.totalAmount)}</span>
                            </div>
                            {paymentInfo.totalAmount > 0 && (
                              <button
                                onClick={() => togglePaymentDetails(booking.booking_id)}
                                className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-all group/btn"
                              >
                                {isExpanded ? 'Hide Transactions' : 'Show Transactions'}
                                <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            )}
                          </div>

                          <div className="pt-4 space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Management</span>
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={booking.booking_status === 'Approved' ? 'Confirmed' : booking.booking_status}
                                onChange={(e) => handleStatusUpdate(booking.booking_id, e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none pr-8 relative"
                                style={{ backgroundImage: 'url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                              >
                                <option value="Pending" className="bg-slate-900">Pending</option>
                                <option value="Confirmed" className="bg-slate-900">Approved</option>
                                <option value="Completed" className="bg-slate-900">Completed</option>
                                <option value="Cancelled" className="bg-slate-900">Cancelled</option>
                              </select>
                              <button
                                onClick={() => setViewingTasksFor(booking.booking_id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                              >
                                Roadmap
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment History Sub-card */}
                      {isExpanded && (
                        <div className="mt-8 pt-8 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Transaction History</h4>
                          {loadingPayments[booking.booking_id] ? (
                            <div className="flex justify-center p-4"><LoadingSpinner size="sm" /></div>
                          ) : (
                            <div className="space-y-3">
                              {(paymentDetails[booking.booking_id] || booking.payments || []).map((payment, idx) => (
                                <div key={payment.id || idx} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-bold text-white uppercase">{formatCurrency(payment.amount)}</p>
                                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">{payment.paid_at ? formatDate(payment.paid_at) : 'Processing'}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {payment.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop View - Toggle between Table and Cards */}
            <div className="hidden lg:block">
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                  {bookings.map((booking, index) => {
                    const paymentInfo = getPaymentInfo(booking);
                    const isExpanded = expandedPayments[booking.booking_id];
                    const bookingPayments = paymentDetails[booking.booking_id] || booking.payments || [];

                    return (
                      <div
                        key={booking.booking_id || index}
                        className="bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 group overflow-hidden"
                      >
                        <div className="p-8">
                          <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-14 h-14 bg-indigo-600/20 rounded-2xl border border-indigo-500/20 shadow-inner">
                                <span className="text-xl font-black text-indigo-400">
                                  {(booking.client?.client_fname || 'C').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">
                                  {booking.client ? `${booking.client.client_fname} ${booking.client.client_lname}` : 'N/A'}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mt-1">
                                  {booking.eventPackage?.package_name || booking.event_package?.package_name || 'Custom Package'}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all duration-300 ${booking.booking_status === 'Approved' || booking.booking_status === 'Confirmed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : booking.booking_status === 'Completed'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : booking.booking_status === 'Pending'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}
                            >
                              {booking.booking_status === 'Approved' ? 'Approved' : booking.booking_status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Event Date</span>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                <p className="text-sm font-bold text-white uppercase">
                                  {new Date(booking.event_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Attendance</span>
                              <div className="flex items-center gap-2 justify-end">
                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                <p className="text-sm font-bold text-white uppercase">{booking.guest_count} Guests</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Coordinator</span>
                                {isAdmin && !isCoordinator ? (
                                  <select
                                    value={booking.coordinator_id || ''}
                                    onChange={(e) => handleAssignCoordinator(booking.booking_id, e.target.value)}
                                    disabled={assigningCoordinator === booking.booking_id}
                                    className="block mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none pr-8"
                                    style={{ backgroundImage: 'url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                                  >
                                    <option value="" className="bg-slate-900">No Coordinator</option>
                                    {coordinators.map((coordinator) => (
                                      <option key={coordinator.id} value={coordinator.id} className="bg-slate-900">
                                        {coordinator.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className="text-sm font-bold text-gray-300 mt-1 uppercase text-xs">{booking.coordinator ? booking.coordinator.name : 'Unassigned'}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status Control</span>
                                <select
                                  value={booking.booking_status === 'Approved' ? 'Confirmed' : booking.booking_status}
                                  onChange={(e) => handleStatusUpdate(booking.booking_id, e.target.value)}
                                  className="block mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none pr-8"
                                  style={{ backgroundImage: 'url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                                >
                                  <option value="Pending" className="bg-slate-900">Pending</option>
                                  <option value="Confirmed" className="bg-slate-900">Approved</option>
                                  <option value="Completed" className="bg-slate-900">Completed</option>
                                  <option value="Cancelled" className="bg-slate-900">Cancelled</option>
                                </select>
                              </div>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full -mr-16 -mt-16"></div>
                              <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Finance Status</span>
                                {getPaymentStatusBadge(paymentInfo.paymentStatus, paymentInfo.remainingBalance, paymentInfo.totalAmount)}
                              </div>
                              <div className="flex justify-between items-baseline mb-4">
                                <span className="text-3xl font-black text-white">{formatCurrency(paymentInfo.totalPaid)}</span>
                                <span className="text-sm font-bold text-gray-500">Total: {formatCurrency(paymentInfo.totalAmount)}</span>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <button
                                  onClick={() => togglePaymentDetails(booking.booking_id)}
                                  className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-all hover:translate-x-1"
                                >
                                  {isExpanded ? 'Hide History' : 'View History'}
                                  <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                <button
                                  onClick={() => setViewingTasksFor(booking.booking_id)}
                                  className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                >
                                  Execution Plan
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 px-2">Transactions</h4>
                                {loadingPayments[booking.booking_id] ? (
                                  <div className="flex justify-center p-8"><LoadingSpinner size="sm" /></div>
                                ) : (
                                  <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {bookingPayments.map((payment, idx) => (
                                      <div key={payment.id || idx} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                                        <div>
                                          <p className="text-sm font-bold text-white uppercase">{formatCurrency(payment.amount)}</p>
                                          <p className="text-[10px] font-medium text-gray-500 mt-1">{payment.paid_at ? formatDate(payment.paid_at) : 'Processing'}</p>
                                        </div>
                                        <div className="text-right">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{payment.status}</span>
                                          <p className="text-[10px] text-gray-600 mt-1">{payment.payment_method}</p>
                                        </div>
                                      </div>
                                    ))}
                                    {bookingPayments.length === 0 && (
                                      <p className="text-center py-4 text-gray-500 text-xs italic">No transaction records found</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          {isAdmin && !isCoordinator && (
                            <th className="px-8 py-6 text-center w-20">
                              <button
                                onClick={toggleSelectAll}
                                className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all duration-300 ${selectedBookings.length === bookings.length && bookings.length > 0 ? 'bg-indigo-600 border-indigo-600' : 'border-white/20 bg-white/5'}`}
                              >
                                {selectedBookings.length === bookings.length && bookings.length > 0 ? <CheckSquare className="w-4 h-4 text-white" /> : selectedBookings.length > 0 ? <div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm"></div> : null}
                              </button>
                            </th>
                          )}
                          <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Client Narrative</th>
                          <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Session Date</th>
                          <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Assignment</th>
                          <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Metrics</th>
                          <th className="px-8 py-6 text-left text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Finance Status</th>
                          <th className="px-8 py-6 text-right text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan={isAdmin && !isCoordinator ? "7" : "6"} className="px-8 py-32 text-center">
                              <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                                  <Calendar className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Registry Empty</h3>
                                <p className="text-gray-500 font-medium">No reservations match your current filter</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          bookings.map((booking, index) => {
                            const paymentInfo = getPaymentInfo(booking);
                            const isExpanded = expandedPayments[booking.booking_id];
                            const bookingPayments = paymentDetails[booking.booking_id] || booking.payments || [];

                            return (
                              <React.Fragment key={booking.booking_id || index}>
                                <tr className={`group hover:bg-white/5 transition-all duration-300 ${selectedBookings.includes(booking.booking_id) ? 'bg-indigo-600/10' : ''}`}>
                                  {isAdmin && !isCoordinator && (
                                    <td className="px-8 py-6 text-center">
                                      <button
                                        onClick={() => toggleBookingSelection(booking.booking_id)}
                                        className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all duration-300 ${selectedBookings.includes(booking.booking_id) ? 'bg-indigo-600 border-indigo-600' : 'border-white/10 bg-white/5 group-hover:border-indigo-500/50'}`}
                                      >
                                        {selectedBookings.includes(booking.booking_id) && <CheckSquare className="w-4 h-4 text-white" />}
                                      </button>
                                    </td>
                                  )}
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-indigo-600/20 rounded-xl border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">
                                        {(booking.client?.client_fname || 'C').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase">
                                          {booking.client ? `${booking.client.client_fname} ${booking.client.client_lname}` : 'N/A'}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">
                                          {booking.eventPackage?.package_name || booking.event_package?.package_name || 'Standard'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <p className="text-sm font-bold text-white uppercase">
                                      {new Date(booking.event_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{booking.guest_count} Attendance</p>
                                  </td>
                                  <td className="px-8 py-6">
                                    {isAdmin && !isCoordinator ? (
                                      <select
                                        value={booking.coordinator_id || ''}
                                        onChange={(e) => handleAssignCoordinator(booking.booking_id, e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs font-bold focus:outline-none appearance-none pr-6"
                                        style={{ backgroundImage: 'url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem top 50%', backgroundSize: '0.5rem auto' }}
                                      >
                                        <option value="" className="bg-slate-900">Unassigned</option>
                                        {coordinators.map((c) => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                                      </select>
                                    ) : (
                                      <p className="text-xs font-bold text-gray-300 uppercase">{booking.coordinator ? booking.coordinator.name : 'Unassigned'}</p>
                                    )}
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${booking.booking_status === 'Approved' || booking.booking_status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400' : booking.booking_status === 'Completed' ? 'bg-blue-500/10 text-blue-400' : booking.booking_status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                      {booking.booking_status === 'Approved' ? 'Approved' : booking.booking_status}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                      {getPaymentStatusBadge(paymentInfo.paymentStatus, paymentInfo.remainingBalance, paymentInfo.totalAmount)}
                                      <div className="h-4 w-px bg-white/5"></div>
                                      <p className="text-xs font-black text-white">{formatCurrency(paymentInfo.totalPaid)}</p>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => togglePaymentDetails(booking.booking_id)}
                                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all"
                                        title="Payment History"
                                      >
                                        <CreditCard className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setViewingTasksFor(booking.booking_id)}
                                        className="p-2.5 bg-indigo-600 rounded-xl text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                        title="Manage Workflow"
                                      >
                                        <LayoutGrid className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleEditNotes(booking)}
                                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all"
                                        title="Internal Notes"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-black/20">
                                    <td colSpan={isAdmin && !isCoordinator ? "7" : "6"} className="px-8 py-8">
                                      {loadingPayments[booking.booking_id] ? (
                                        <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
                                      ) : (
                                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                          <div className="flex items-center gap-4 mb-6">
                                            <div className="w-8 h-px bg-indigo-500/30"></div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Ledger Artifacts</h4>
                                          </div>
                                          {bookingPayments.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-6">
                                              {bookingPayments.map((p, i) => (
                                                <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 transition-all">
                                                  <p className="text-sm font-black text-white mb-1">{formatCurrency(p.amount)}</p>
                                                  <p className="text-[10px] font-bold text-gray-500 uppercase">{p.payment_method}</p>
                                                  <div className="flex items-center justify-between mt-4">
                                                    <span className="text-[9px] font-medium text-gray-600">{p.paid_at ? formatDate(p.paid_at) : 'Pending'}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{p.status}</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-center py-4 text-gray-500 text-xs italic">No transaction records found</p>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Premium Pagination */}
            {meta.total > 0 && (
              <Pagination
                currentPage={page}
                lastPage={meta.last_page}
                total={meta.total}
                perPage={perPage}
                from={((page - 1) * perPage) + 1}
                to={Math.min(page * perPage, meta.total)}
                onPageChange={(p) => setPage(p)}
                onPerPageChange={() => { }} // perPage is not adjustable here yet
              />
            )}
          </>
        )}
      </div>

      <FormModal
        isOpen={!!viewingTasksFor}
        onClose={() => setViewingTasksFor(null)}
        title="Manage Tasks"
        maxWidth="max-w-2xl"
      >
        {viewingTasksFor && <CoordinatorChecklist bookingId={viewingTasksFor} />}
      </FormModal>

      <FormModal
        isOpen={!!editingNotes}
        onClose={handleCancelNotes}
        title="Internal Registry Notes"
        maxWidth="max-w-lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <p className="text-xs text-indigo-300 font-medium">These notes are strictly for administrative and coordinator reference only. Clients will not see this information.</p>
          </div>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Document coordination details, client preferences, or internal flags..."
            className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none font-medium text-sm"
          />
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px]"
              onClick={handleCancelNotes}
            >
              Discard Changes
            </Button>
            <Button
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20"
              onClick={() => handleSaveNotes(editingNotes)}
              disabled={savingNotes}
            >
              {savingNotes ? 'Committing...' : 'Commit Notes'}
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default ManageBookings;
