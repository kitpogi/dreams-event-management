import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminNavbar from '../../../components/layout/AdminNavbar';
import { LoadingSpinner, Button } from '../../../components/ui';
import { PullToRefresh } from '../../../components/features';
import { useSidebar } from '../../../context/SidebarContext';

const ManageContactInquiries = () => {
  const { isCollapsed } = useSidebar();
  const [newInquiries, setNewInquiries] = useState([]);
  const [oldInquiries, setOldInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('new');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await api.get('/contact-inquiries');
      const data = response.data.data || {};
      
      // Handle new API structure with separated inquiries
      if (data.new_inquiries !== undefined && data.old_inquiries !== undefined) {
        // Ensure they are arrays
        setNewInquiries(Array.isArray(data.new_inquiries) ? data.new_inquiries : []);
        setOldInquiries(Array.isArray(data.old_inquiries) ? data.old_inquiries : []);
      } else {
        // Fallback for backward compatibility
        const allInquiries = Array.isArray(data.all_inquiries) 
          ? data.all_inquiries 
          : (Array.isArray(data) ? data : []);
        const newInq = allInquiries.filter(inq => !inq.is_old);
        const oldInq = allInquiries.filter(inq => inq.is_old);
        setNewInquiries(newInq);
        setOldInquiries(oldInq);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to fetch contact inquiries');
      // Set empty arrays on error to prevent map errors
      setNewInquiries([]);
      setOldInquiries([]);
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

  const handleRefresh = async () => {
    await fetchInquiries();
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

  // Filter inquiries based on status filter
  const getFilteredInquiries = (inquiriesList) => {
    // Ensure inquiriesList is always an array
    if (!Array.isArray(inquiriesList)) return [];
    if (filterStatus === 'all') return inquiriesList;
    return inquiriesList.filter(inq => inq.status === filterStatus);
  };

  const filteredNewInquiries = getFilteredInquiries(newInquiries);
  const filteredOldInquiries = getFilteredInquiries(oldInquiries);
  
  // Render inquiry card component
  const renderInquiryCard = (inquiry) => (
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
          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inquiry.email)}&su=${encodeURIComponent(`Re: Your Event Inquiry - ${inquiry.event_type || 'Event'}`)}&body=${encodeURIComponent(
            `Hello ${inquiry.name || `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim() || 'there'},\n\n` +
            `Thank you for your inquiry regarding your ${inquiry.event_type || 'event'}.\n\n` +
            `--- Original Inquiry Details ---\n` +
            `Event Type: ${inquiry.event_type || 'N/A'}\n` +
            `Event Date: ${inquiry.date_of_event || inquiry.event_date || 'Not specified'}\n` +
            `Preferred Venue: ${inquiry.preferred_venue || inquiry.venue || 'Not specified'}\n` +
            `Estimated Guests: ${inquiry.estimated_guests || inquiry.guests || 'Not specified'}\n` +
            `Budget: ${inquiry.budget ? `₱${parseFloat(inquiry.budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not specified'}\n` +
            (inquiry.message ? `Message: ${inquiry.message}\n` : '') +
            `\n--- End of Original Inquiry ---\n\n` +
            `Best regards,\nDreams Events Team`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm font-medium transition-colors duration-300"
        >
          Reply via Gmail
        </a>
      </div>
    </div>
  );

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
        <PullToRefresh onRefresh={handleRefresh} className="h-full">
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
            {activeTab === 'new' 
              ? `Showing ${filteredNewInquiries.length} of ${newInquiries.length} new inquiries`
              : `Showing ${filteredOldInquiries.length} of ${oldInquiries.length} old inquiries`
            }
          </span>
        </div>

        {/* Tabs for New and Old Inquiries */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('new')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                  activeTab === 'new'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                New Inquiries
                {newInquiries.length > 0 && (
                  <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                    {newInquiries.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('old')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                  activeTab === 'old'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Old Inquiries
                {oldInquiries.length > 0 && (
                  <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {oldInquiries.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Inquiries List */}
        {activeTab === 'new' ? (
          filteredNewInquiries.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
                No new inquiries found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNewInquiries.map(renderInquiryCard)}
            </div>
          )
        ) : (
          filteredOldInquiries.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
                No old inquiries found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOldInquiries.map(renderInquiryCard)}
            </div>
          )
        )}
        </div>
        </PullToRefresh>
      </main>
    </div>
  );
};

export default ManageContactInquiries;

