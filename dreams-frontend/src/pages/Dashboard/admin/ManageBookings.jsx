import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminNavbar from '../../../components/layout/AdminNavbar';
import { LoadingSpinner, Button } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useSidebar } from '../../../context/SidebarContext';

const ManageBookings = () => {
  const { isAdmin, isCoordinator } = useAuth();
  const { isCollapsed } = useSidebar();
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
                {isCoordinator ? 'My Assigned Bookings' : 'Manage Bookings'}
              </h1>
              {isCoordinator && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">
                  View and manage bookings assigned to you
                </p>
              )}
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
            >
              Export CSV
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Event Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Coordinator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {bookings.map((booking, index) => (
                    <tr key={booking.booking_id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                          {booking.client ? `${booking.client.client_fname} ${booking.client.client_lname}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200 transition-colors duration-300">
                          {booking.eventPackage?.package_name || booking.event_package?.package_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200 transition-colors duration-300">
                          {new Date(booking.event_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 transition-colors duration-300">
                        {booking.guest_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAdmin && !isCoordinator ? (
                          <select
                            value={booking.coordinator_id || ''}
                            onChange={(e) => handleAssignCoordinator(booking.booking_id, e.target.value)}
                            disabled={assigningCoordinator === booking.booking_id}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                          >
                            <option value="">No Coordinator</option>
                            {coordinators.map((coordinator) => (
                              <option key={coordinator.id} value={coordinator.id}>
                                {coordinator.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-gray-200 transition-colors duration-300">
                            {booking.coordinator ? (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium transition-colors duration-300">
                                {booking.coordinator.name}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic">Not assigned</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors duration-300 ${
                            booking.booking_status === 'Approved' || booking.booking_status === 'Confirmed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : booking.booking_status === 'Completed'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : booking.booking_status === 'Pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {booking.booking_status === 'Approved' ? 'Approved' : booking.booking_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={booking.booking_status === 'Approved' ? 'Confirmed' : booking.booking_status}
                          onChange={(e) => handleStatusUpdate(booking.booking_id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {editingNotes === booking.booking_id ? (
                          <div className="space-y-2">
                            <textarea
                              value={notesText}
                              onChange={(e) => setNotesText(e.target.value)}
                              placeholder="Add internal notes..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
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
                                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              {booking.internal_notes ? (
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 transition-colors duration-300">
                                  {booking.internal_notes}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No notes</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditNotes(booking)}
                              className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded"
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
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 transition-colors duration-300">
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                Page {page} of {meta.last_page || 1} • {meta.total || 0} total
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => (meta.last_page ? Math.min(meta.last_page, p + 1) : p + 1))}
                  disabled={meta.last_page ? page >= meta.last_page : false}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default ManageBookings;

