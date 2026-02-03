import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { LoadingSpinner, Button, FormModal } from '../../../components/ui';
import CoordinatorChecklist from '../../../components/features/CoordinatorChecklist';
import { useAuth } from '../../../context/AuthContext';
import { ClipboardList, CheckSquare, Square, X } from 'lucide-react';

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
        },
      });
      setBookings(response.data.data || response.data || []);
      setMeta(response.data.meta || { total: 0, last_page: 1 });
      setPage(response.data.meta?.current_page || pageToLoad);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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


  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto">
        {/* Header Section with Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {isCoordinator ? 'My Assigned Bookings' : 'Manage Bookings'}
              </h1>
              {isCoordinator && (
                <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
                  View and manage bookings assigned to you
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
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
              className="border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
          </div>
          {/* View Mode Toggle - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">View:</span>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Table
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${viewMode === 'card'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Cards
            </button>
          </div>
        </div>

        {/* Bulk Action Toolbar - Shows when items are selected */}
        {selectedBookings.length > 0 && !isCoordinator && (
          <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl shadow-lg animate-slide-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg font-bold text-lg">
                  {selectedBookings.length}
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                    {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    Select an action to apply to all
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Actions */}
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleBulkStatusUpdate('Confirmed')}
                  disabled={bulkActionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleBulkStatusUpdate('Cancelled')}
                  disabled={bulkActionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel All
                </Button>

                {/* More Status Options */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusUpdate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">More actions...</option>
                  <option value="Pending">Set to Pending</option>
                  <option value="Completed">Mark Completed</option>
                </select>

                {/* Clear Selection */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSelection}
                  disabled={bulkActionLoading}
                  className="border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                >
                  Clear Selection
                </Button>

                {bulkActionLoading && (
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm font-medium">Processing...</span>
                  </div>
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {bookings.map((booking, index) => {
                  const paymentInfo = getPaymentInfo(booking);
                  const isExpanded = expandedPayments[booking.booking_id];
                  const bookingPayments = paymentDetails[booking.booking_id] || booking.payments || [];

                  return (
                    <div
                      key={booking.booking_id || index}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
                    >
                      {/* Card Header */}
                      <div className="p-4 lg:p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-b border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-1">
                              {booking.client ? `${booking.client.client_fname} ${booking.client.client_lname}` : 'N/A'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {booking.eventPackage?.package_name || booking.event_package?.package_name || 'N/A'}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 lg:px-3 lg:py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${booking.booking_status === 'Approved' || booking.booking_status === 'Confirmed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : booking.booking_status === 'Completed'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : booking.booking_status === 'Pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                              }`}
                          >
                            {booking.booking_status === 'Approved' ? 'Approved' : booking.booking_status}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 lg:p-6 space-y-3">
                        {/* Event Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Event Date</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(booking.event_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Guests</span>
                            <p className="font-medium text-gray-900 dark:text-white">{booking.guest_count}</p>
                          </div>
                        </div>

                        {/* Coordinator */}
                        {isAdmin && !isCoordinator ? (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">Coordinator</span>
                            <select
                              value={booking.coordinator_id || ''}
                              onChange={(e) => handleAssignCoordinator(booking.booking_id, e.target.value)}
                              disabled={assigningCoordinator === booking.booking_id}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="">No Coordinator</option>
                              {coordinators.map((coordinator) => (
                                <option key={coordinator.id} value={coordinator.id}>
                                  {coordinator.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : booking.coordinator && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Coordinator</span>
                            <p className="font-medium text-gray-900 dark:text-white">{booking.coordinator.name}</p>
                          </div>
                        )}

                        {/* Payment Status */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-xs block mb-2">Payment Status</span>
                          {getPaymentStatusBadge(paymentInfo.paymentStatus, paymentInfo.remainingBalance, paymentInfo.totalAmount)}
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {formatCurrency(paymentInfo.totalPaid)} / {formatCurrency(paymentInfo.totalAmount)}
                          </div>
                          {paymentInfo.totalAmount > 0 && (
                            <button
                              onClick={() => togglePaymentDetails(booking.booking_id)}
                              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Hide Payment Details
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  View Payment Details
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-xs block mb-2">Update Status</span>
                          <select
                            value={booking.booking_status === 'Approved' ? 'Confirmed' : booking.booking_status}
                            onChange={(e) => handleStatusUpdate(booking.booking_id, e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Notes */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 dark:text-gray-400 text-xs">Notes</span>
                            <button
                              onClick={() => handleEditNotes(booking)}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                            >
                              {editingNotes === booking.booking_id ? 'Cancel' : 'Edit'}
                            </button>
                          </div>
                          {editingNotes === booking.booking_id ? (
                            <div className="space-y-2">
                              <textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Add internal notes..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                rows="3"
                                maxLength={5000}
                              />
                              <button
                                onClick={() => handleSaveNotes(booking.booking_id)}
                                disabled={savingNotes}
                                className="w-full px-3 py-2 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {savingNotes ? 'Saving...' : 'Save Notes'}
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {booking.internal_notes || <span className="italic text-gray-400">No notes</span>}
                            </p>
                          )}
                        </div>

                        {/* Expanded Payment Details */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                            {loadingPayments[booking.booking_id] ? (
                              <div className="flex items-center justify-center py-4">
                                <LoadingSpinner size="sm" />
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Paid: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(paymentInfo.totalPaid)}</span>
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Total: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(paymentInfo.totalAmount)}</span>
                                  </span>
                                  {paymentInfo.remainingBalance > 0 && (
                                    <span className="text-red-600 dark:text-red-400">
                                      Balance: <span className="font-bold">{formatCurrency(paymentInfo.remainingBalance)}</span>
                                    </span>
                                  )}
                                </div>
                                {bookingPayments.length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {bookingPayments.map((payment, idx) => (
                                      <div key={payment.id || idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</span>
                                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${payment.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                            payment.status === 'pending' || payment.status === 'processing' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                            }`}>
                                            {payment.status}
                                          </span>
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400">
                                          {getPaymentMethodIcon(payment.payment_method)} {payment.payment_method || 'N/A'} • {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : new Date(payment.created_at).toLocaleDateString()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">No payment records</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop View - Toggle between Table and Cards */}
            <div className="hidden lg:block">
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {bookings.map((booking, index) => {
                    const paymentInfo = getPaymentInfo(booking);
                    const isExpanded = expandedPayments[booking.booking_id];
                    const bookingPayments = paymentDetails[booking.booking_id] || booking.payments || [];

                    return (
                      <div
                        key={booking.booking_id || index}
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
                      >
                        {/* Card Header */}
                        <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-b border-indigo-200 dark:border-indigo-800">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {booking.client ? `${booking.client.client_fname} ${booking.client.client_lname}` : 'N/A'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {booking.eventPackage?.package_name || booking.event_package?.package_name || 'N/A'}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${booking.booking_status === 'Approved' || booking.booking_status === 'Confirmed'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                : booking.booking_status === 'Completed'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : booking.booking_status === 'Pending'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                }`}
                            >
                              {booking.booking_status === 'Approved' ? 'Approved' : booking.booking_status}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4">
                          {/* Event Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">Event Date</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(booking.event_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">Guests</span>
                              <p className="font-medium text-gray-900 dark:text-white">{booking.guest_count}</p>
                            </div>
                          </div>

                          {/* Coordinator */}
                          {isAdmin && !isCoordinator ? (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">Coordinator</span>
                              <select
                                value={booking.coordinator_id || ''}
                                onChange={(e) => handleAssignCoordinator(booking.booking_id, e.target.value)}
                                disabled={assigningCoordinator === booking.booking_id}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">No Coordinator</option>
                                {coordinators.map((coordinator) => (
                                  <option key={coordinator.id} value={coordinator.id}>
                                    {coordinator.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : booking.coordinator && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">Coordinator</span>
                              <p className="font-medium text-gray-900 dark:text-white">{booking.coordinator.name}</p>
                            </div>
                          )}

                          {/* Payment Status */}
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-2">Payment Status</span>
                            {getPaymentStatusBadge(paymentInfo.paymentStatus, paymentInfo.remainingBalance, paymentInfo.totalAmount)}
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              {formatCurrency(paymentInfo.totalPaid)} / {formatCurrency(paymentInfo.totalAmount)}
                            </div>
                            {paymentInfo.totalAmount > 0 && (
                              <button
                                onClick={() => togglePaymentDetails(booking.booking_id)}
                                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Hide Payment Details
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    View Payment Details
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-2">Actions</span>
                            <div className="flex flex-col gap-2">
                              <select
                                value={booking.booking_status === 'Approved' ? 'Confirmed' : booking.booking_status}
                                onChange={(e) => handleStatusUpdate(booking.booking_id, e.target.value)}
                                className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Approved</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingTasksFor(booking.booking_id)}
                                className="w-full justify-center"
                              >
                                <ClipboardList className="w-4 h-4 mr-2" /> Tasks
                              </Button>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-600 dark:text-gray-400 text-xs">Notes</span>
                              <button
                                onClick={() => handleEditNotes(booking)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                              >
                                {editingNotes === booking.booking_id ? 'Cancel' : 'Edit'}
                              </button>
                            </div>
                            {editingNotes === booking.booking_id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Add internal notes..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  rows="3"
                                  maxLength={5000}
                                />
                                <button
                                  onClick={() => handleSaveNotes(booking.booking_id)}
                                  disabled={savingNotes}
                                  className="w-full px-3 py-2 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  {savingNotes ? 'Saving...' : 'Save Notes'}
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                {booking.internal_notes || <span className="italic text-gray-400">No notes</span>}
                              </p>
                            )}
                          </div>

                          {/* Expanded Payment Details */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                              {loadingPayments[booking.booking_id] ? (
                                <div className="flex items-center justify-center py-4">
                                  <LoadingSpinner size="sm" />
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Paid: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(paymentInfo.totalPaid)}</span>
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Total: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(paymentInfo.totalAmount)}</span>
                                    </span>
                                    {paymentInfo.remainingBalance > 0 && (
                                      <span className="text-red-600 dark:text-red-400">
                                        Balance: <span className="font-bold">{formatCurrency(paymentInfo.remainingBalance)}</span>
                                      </span>
                                    )}
                                  </div>
                                  {bookingPayments.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {bookingPayments.map((payment, idx) => (
                                        <div key={payment.id || idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${payment.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                              payment.status === 'pending' || payment.status === 'processing' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                              }`}>
                                              {payment.status}
                                            </span>
                                          </div>
                                          <div className="text-gray-600 dark:text-gray-400">
                                            {getPaymentMethodIcon(payment.payment_method)} {payment.payment_method || 'N/A'} • {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : new Date(payment.created_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">No payment records</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                      <thead className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        <tr>
                          {/* Checkbox column for bulk selection */}
                          {isAdmin && !isCoordinator && (
                            <th className="px-3 py-3 lg:px-4 lg:py-5 text-center text-xs font-extrabold text-white uppercase tracking-wider w-12">
                              <button
                                onClick={toggleSelectAll}
                                className="flex items-center justify-center w-6 h-6 rounded border-2 border-white/50 bg-white/10 hover:bg-white/20 transition-colors"
                                title={selectedBookings.length === bookings.length ? 'Deselect all' : 'Select all'}
                              >
                                {selectedBookings.length === bookings.length && bookings.length > 0 ? (
                                  <CheckSquare className="w-4 h-4 text-white" />
                                ) : selectedBookings.length > 0 ? (
                                  <div className="w-3 h-3 bg-white/70 rounded-sm"></div>
                                ) : (
                                  <Square className="w-4 h-4 text-white/50" />
                                )}
                              </button>
                            </th>
                          )}
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Client</th>
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider hidden md:table-cell">Package</th>
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Event Date</th>
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider hidden lg:table-cell">Guests</th>
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider hidden xl:table-cell">Coordinator</th>
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Status</th>
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Payment</th>
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Actions</th>
                          <th className="px-3 py-3 lg:px-6 lg:py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider hidden lg:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan={isAdmin && !isCoordinator ? "10" : "9"} className="px-6 py-20 text-center">
                              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 mb-4">
                                <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No bookings found</h3>
                              <p className="text-gray-500 dark:text-gray-400 text-base">
                                {isCoordinator ? 'You don\'t have any bookings assigned yet.' : 'No bookings available.'}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          bookings.map((booking, index) => {
                            const paymentInfo = getPaymentInfo(booking);
                            const isExpanded = expandedPayments[booking.booking_id];
                            const bookingPayments = paymentDetails[booking.booking_id] || booking.payments || [];

                            return (
                              <React.Fragment key={booking.booking_id || index}>
                                <tr className={`hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10 transition-all duration-200 group border-l-4 ${selectedBookings.includes(booking.booking_id) ? 'bg-indigo-50/70 dark:bg-indigo-900/20 border-indigo-500' : 'border-transparent hover:border-indigo-500'}`}>
                                  {/* Checkbox cell for bulk selection */}
                                  {isAdmin && !isCoordinator && (
                                    <td className="px-3 py-3 lg:px-4 lg:py-4 text-center">
                                      <button
                                        onClick={() => toggleBookingSelection(booking.booking_id)}
                                        className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-colors ${selectedBookings.includes(booking.booking_id)
                                          ? 'bg-indigo-600 border-indigo-600'
                                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400'
                                          }`}
                                        title={selectedBookings.includes(booking.booking_id) ? 'Deselect' : 'Select'}
                                      >
                                        {selectedBookings.includes(booking.booking_id) ? (
                                          <CheckSquare className="w-4 h-4 text-white" />
                                        ) : (
                                          <Square className="w-4 h-4 text-gray-400" />
                                        )}
                                      </button>
                                    </td>
                                  )}
                                  <td className="px-3 py-3 lg:px-6 lg:py-4">
                                    <div className="text-xs lg:text-sm font-semibold text-gray-900 dark:text-white">
                                      {booking.client ? `${booking.client.client_fname} ${booking.client.client_lname}` : 'N/A'}
                                    </div>
                                    {/* Show package on mobile */}
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 md:hidden">
                                      {booking.eventPackage?.package_name || booking.event_package?.package_name || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap hidden md:table-cell">
                                    <div className="text-xs lg:text-sm text-gray-900 dark:text-gray-200 font-medium">
                                      {booking.eventPackage?.package_name || booking.event_package?.package_name || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                                    <div className="text-xs lg:text-sm text-gray-900 dark:text-gray-200 font-medium">
                                      {new Date(booking.event_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap hidden lg:table-cell">
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                      {booking.guest_count}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap hidden xl:table-cell">
                                    {isAdmin && !isCoordinator ? (
                                      <select
                                        value={booking.coordinator_id || ''}
                                        onChange={(e) => handleAssignCoordinator(booking.booking_id, e.target.value)}
                                        disabled={assigningCoordinator === booking.booking_id}
                                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                      >
                                        <option value="">No Coordinator</option>
                                        {coordinators.map((coordinator) => (
                                          <option key={coordinator.id} value={coordinator.id}>
                                            {coordinator.name}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div className="text-xs lg:text-sm text-gray-900 dark:text-gray-200 transition-colors duration-300">
                                        {booking.coordinator ? (
                                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium transition-colors duration-300">
                                            {booking.coordinator.name}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 dark:text-gray-500 italic text-xs">Not assigned</span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 lg:px-3 lg:py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${booking.booking_status === 'Approved' || booking.booking_status === 'Confirmed'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                        : booking.booking_status === 'Completed'
                                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                          : booking.booking_status === 'Pending'
                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                        }`}
                                    >
                                      {booking.booking_status === 'Approved' ? 'Approved' : booking.booking_status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 lg:px-6 lg:py-4">
                                    <div className="flex flex-col gap-1 lg:gap-2 min-w-[120px]">
                                      {getPaymentStatusBadge(paymentInfo.paymentStatus, paymentInfo.remainingBalance, paymentInfo.totalAmount)}
                                      <div className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                                        {formatCurrency(paymentInfo.totalPaid)} / {formatCurrency(paymentInfo.totalAmount)}
                                      </div>
                                      {paymentInfo.totalAmount > 0 && (
                                        <button
                                          onClick={() => togglePaymentDetails(booking.booking_id)}
                                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors mt-1"
                                        >
                                          {isExpanded ? (
                                            <>
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                              </svg>
                                              <span className="hidden sm:inline">Hide</span>
                                            </>
                                          ) : (
                                            <>
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                              </svg>
                                              <span className="hidden sm:inline">View</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-xs lg:text-sm font-medium">
                                    <div className="flex flex-col gap-2">
                                      <select
                                        value={booking.booking_status === 'Approved' ? 'Confirmed' : booking.booking_status}
                                        onChange={(e) => handleStatusUpdate(booking.booking_id, e.target.value)}
                                        className="px-2 py-1.5 lg:px-3 lg:py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 font-medium text-xs lg:text-sm"
                                      >
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Approved</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                      </select>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setViewingTasksFor(booking.booking_id)}
                                        className="text-xs h-8"
                                      >
                                        <ClipboardList className="w-3 h-3 mr-1" /> Tasks
                                      </Button>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 lg:px-6 lg:py-4 hidden lg:table-cell">
                                    {editingNotes === booking.booking_id ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={notesText}
                                          onChange={(e) => setNotesText(e.target.value)}
                                          placeholder="Add internal notes..."
                                          className="w-full px-3 py-2 text-xs lg:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                                          rows="2"
                                          maxLength={5000}
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleSaveNotes(booking.booking_id)}
                                            disabled={savingNotes}
                                            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                          >
                                            {savingNotes ? 'Saving...' : 'Save'}
                                          </button>
                                          <button
                                            onClick={handleCancelNotes}
                                            disabled={savingNotes}
                                            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                          {booking.internal_notes ? (
                                            <p className="text-xs lg:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 transition-colors duration-300">
                                              {booking.internal_notes}
                                            </p>
                                          ) : (
                                            <p className="text-xs lg:text-sm text-gray-400 dark:text-gray-500 italic">No notes</p>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => handleEditNotes(booking)}
                                          className="px-2 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors duration-300"
                                          title="Edit notes"
                                        >
                                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    <td colSpan="9" className="px-3 lg:px-6 py-4">
                                      {loadingPayments[booking.booking_id] ? (
                                        <div className="flex items-center justify-center py-4">
                                          <LoadingSpinner size="sm" />
                                        </div>
                                      ) : (
                                        <div className="space-y-3 lg:space-y-4">
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                                            <h4 className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white">Payment History</h4>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs lg:text-sm">
                                              <span className="text-gray-600 dark:text-gray-400">
                                                Paid: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(paymentInfo.totalPaid)}</span>
                                              </span>
                                              <span className="text-gray-600 dark:text-gray-400">
                                                Total: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(paymentInfo.totalAmount)}</span>
                                              </span>
                                              {paymentInfo.remainingBalance > 0 && (
                                                <span className="text-red-600 dark:text-red-400">
                                                  Balance: <span className="font-bold">{formatCurrency(paymentInfo.remainingBalance)}</span>
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {bookingPayments.length > 0 ? (
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-xs lg:text-sm min-w-[600px]">
                                                <thead className="bg-gray-100 dark:bg-gray-700">
                                                  <tr>
                                                    <th className="px-2 lg:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                                    <th className="px-2 lg:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                                    <th className="px-2 lg:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Method</th>
                                                    <th className="px-2 lg:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                                    <th className="px-2 lg:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Transaction ID</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                  {bookingPayments.map((payment, idx) => (
                                                    <tr key={payment.id || idx} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                                      <td className="px-2 lg:px-4 py-2 text-gray-900 dark:text-gray-200">
                                                        {payment.paid_at
                                                          ? new Date(payment.paid_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                          })
                                                          : new Date(payment.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                          })
                                                        }
                                                      </td>
                                                      <td className="px-2 lg:px-4 py-2 font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(payment.amount)}
                                                      </td>
                                                      <td className="px-2 lg:px-4 py-2 hidden sm:table-cell">
                                                        <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                                          <span>{getPaymentMethodIcon(payment.payment_method)}</span>
                                                          <span className="capitalize text-xs">{payment.payment_method || 'N/A'}</span>
                                                        </span>
                                                      </td>
                                                      <td className="px-2 lg:px-4 py-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${payment.status === 'paid'
                                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                          : payment.status === 'pending' || payment.status === 'processing'
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                            : payment.status === 'failed' || payment.status === 'cancelled'
                                                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                          }`}>
                                                          {payment.status}
                                                        </span>
                                                        {/* Show method on mobile */}
                                                        <div className="sm:hidden mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                          {getPaymentMethodIcon(payment.payment_method)} {payment.payment_method || 'N/A'}
                                                        </div>
                                                      </td>
                                                      <td className="px-2 lg:px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono hidden md:table-cell truncate max-w-[150px]">
                                                        {payment.transaction_id || payment.payment_intent_id || 'N/A'}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                              <p>No payment records found for this booking.</p>
                                            </div>
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
            {/* Pagination - Shared between both views */}
            {bookings.length > 0 && (
              <div className="flex items-center justify-between px-4 lg:px-8 py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-t-2 border-indigo-200 dark:border-indigo-800 rounded-b-3xl mt-6">
                <div className="text-base font-bold text-gray-800 dark:text-gray-200">
                  Showing <span className="text-indigo-600 dark:text-indigo-400">{bookings.length}</span> bookings
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-5 py-2.5 text-sm font-bold border-2 border-indigo-300 dark:border-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white hover:border-transparent bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 transition-all duration-300 shadow-md hover:shadow-lg disabled:hover:shadow-md"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => (meta.last_page ? Math.min(meta.last_page, p + 1) : p + 1))}
                    disabled={meta.last_page ? page >= meta.last_page : false}
                    className="px-5 py-2.5 text-sm font-bold border-2 border-indigo-300 dark:border-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white hover:border-transparent bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 transition-all duration-300 shadow-md hover:shadow-lg disabled:hover:shadow-md"
                  >
                    Next
                  </button>
                </div>
              </div>
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
    </div>
  );
};

export default ManageBookings;
