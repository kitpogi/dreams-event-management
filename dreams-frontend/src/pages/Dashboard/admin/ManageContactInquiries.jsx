import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminNavbar from '../../../components/layout/AdminNavbar';
import { LoadingSpinner, Button } from '../../../components/ui';
import { useSidebar } from '../../../context/SidebarContext';

const ManageContactInquiries = () => {
  const { isCollapsed } = useSidebar();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await api.get('/contact-inquiries');
      setInquiries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to fetch contact inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/contact-inquiries/${id}/status`, { status });
      toast.success('Inquiry status updated successfully');
      fetchInquiries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update inquiry status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      new: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      contacted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      converted: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      closed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600',
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors duration-300 ${
          statusStyles[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
    return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredInquiries = filterStatus === 'all' 
    ? inquiries 
    : inquiries.filter(inq => inq.status === filterStatus);

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <AdminNavbar />
        <main
          className="flex-1 bg-gradient-to-b from-[#FFF7F0] to-white dark:from-gray-900 dark:to-gray-800 min-h-screen transition-all duration-300 pt-16"
          style={{
            marginLeft: isCollapsed ? '5rem' : '16rem',
            width: isCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 16rem)',
          }}
        >
          <div className="p-4 sm:p-6 lg:p-10">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 transition-colors duration-300">
              Contact Inquiries
            </h1>
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <AdminNavbar />
      <main
        className="flex-1 bg-gradient-to-b from-[#FFF7F0] to-white dark:from-gray-900 dark:to-gray-800 min-h-screen transition-all duration-300 pt-16"
        style={{
          marginLeft: isCollapsed ? '5rem' : '16rem',
          width: isCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 16rem)',
        }}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                Contact Inquiries
              </h1>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                Manage and respond to customer inquiries
              </p>
            </div>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await api.get('/contact-inquiries/export', {
                  responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'contact_inquiries.csv');
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (error) {
                toast.error('Failed to export inquiries');
              }
            }}
          >
            Export CSV
          </Button>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
            Filter by Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
          >
            <option value="all">All Inquiries</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Showing {filteredInquiries.length} of {inquiries.length} inquiries
          </span>
        </div>

        {/* Inquiries List */}
        {filteredInquiries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
              No inquiries found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                        {inquiry.name || `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim()}
                      </h3>
                      {getStatusBadge(inquiry.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      <div>
                        <span className="font-medium">Email:</span> {inquiry.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {inquiry.mobile_number || inquiry.phone_number || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Event Type:</span> {inquiry.event_type || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {formatDate(inquiry.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      Event Date:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {inquiry.date_of_event || inquiry.event_date
                        ? formatDate(inquiry.date_of_event || inquiry.event_date)
                        : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      Preferred Venue:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {inquiry.preferred_venue || inquiry.venue || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      Budget:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{formatCurrency(inquiry.budget)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      Estimated Guests:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {inquiry.estimated_guests || inquiry.guests || 'Not specified'}
                    </span>
                  </div>
                </div>

                {inquiry.motifs && (
                  <div className="mb-4 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      Motifs/Theme:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{inquiry.motifs}</span>
                  </div>
                )}

                <div className="mb-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300 block mb-1 transition-colors duration-300">
                    Message:
                  </span>
                  <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg transition-colors duration-300">
                    {inquiry.message || 'No message provided'}
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    Update Status:
                  </span>
                  <select
                    value={inquiry.status}
                    onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                    disabled={updatingId === inquiry.id}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                  {updatingId === inquiry.id && (
                    <div className="inline-flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                    </div>
                  )}
                  <a
                    href={`mailto:${inquiry.email}?subject=Re: Your Event Inquiry - ${inquiry.event_type || 'Event'}`}
                    className="ml-auto px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm font-medium transition-colors duration-300"
                  >
                    Reply via Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default ManageContactInquiries;

