import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import { LoadingSpinner, Button } from '../../../components/ui';

const ManageContactInquiries = () => {
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
      new: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      contacted: 'bg-blue-100 text-blue-800 border-blue-200',
      converted: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
          statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200'
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
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-10 bg-gray-50 min-h-screen">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Contact Inquiries</h1>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="lg:ml-64 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Inquiries</h1>
            <p className="text-gray-600">Manage and respond to customer inquiries</p>
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
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Inquiries</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
          <span className="text-sm text-gray-600">
            Showing {filteredInquiries.length} of {inquiries.length} inquiries
          </span>
        </div>

        {/* Inquiries List */}
        {filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No inquiries found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {inquiry.name || `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim()}
                      </h3>
                      {getStatusBadge(inquiry.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
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
                    <span className="font-medium text-gray-700">Event Date:</span>{' '}
                    {inquiry.date_of_event || inquiry.event_date ? formatDate(inquiry.date_of_event || inquiry.event_date) : 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Preferred Venue:</span>{' '}
                    {inquiry.preferred_venue || inquiry.venue || 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Budget:</span>{' '}
                    {formatCurrency(inquiry.budget)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estimated Guests:</span>{' '}
                    {inquiry.estimated_guests || inquiry.guests || 'Not specified'}
                  </div>
                </div>

                {inquiry.motifs && (
                  <div className="mb-4 text-sm">
                    <span className="font-medium text-gray-700">Motifs/Theme:</span>{' '}
                    <span className="text-gray-600">{inquiry.motifs}</span>
                  </div>
                )}

                <div className="mb-4">
                  <span className="font-medium text-gray-700 block mb-1">Message:</span>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{inquiry.message || 'No message provided'}</p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Update Status:</span>
                  <select
                    value={inquiry.status}
                    onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                    disabled={updatingId === inquiry.id}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                  {updatingId === inquiry.id && (
                    <div className="inline-flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                  <a
                    href={`mailto:${inquiry.email}?subject=Re: Your Event Inquiry - ${inquiry.event_type || 'Event'}`}
                    className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                  >
                    Reply via Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageContactInquiries;

