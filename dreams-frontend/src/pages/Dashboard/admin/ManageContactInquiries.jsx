import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Search, Filter, X, Trash2, CheckSquare, Square } from 'lucide-react';
import api from '../../../api/axios';
import { contactService } from '../../../api/services/contactService';
import { LoadingSpinner, Button } from '../../../components/ui';
import InquiryPagination from '../../../components/ui/pagination';
import { PullToRefresh } from '../../../components/features';
import ContactInquiryReplyModal from '../../../components/modals/ContactInquiryReplyModal';
import BulkDeleteConfirmModal from '../../../components/modals/BulkDeleteConfirmModal';

const ManageContactInquiries = () => {
  const [newInquiries, setNewInquiries] = useState([]);
  const [oldInquiries, setOldInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('new');
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  
  // Old inquiries filtering and pagination
  const [oldStatusFilter, setOldStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [pagination, setPagination] = useState(null);
  const [oldInquiriesStats, setOldInquiriesStats] = useState(null);
  const [selectedInquiries, setSelectedInquiries] = useState([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Fetch old inquiries when filters or pagination change
  useEffect(() => {
    if (activeTab === 'old') {
      fetchOldInquiries();
    }
  }, [activeTab, oldStatusFilter, dateRange, searchQuery, currentPage, perPage]);

  const fetchInquiries = async () => {
    try {
      const response = await contactService.getAll();
      const data = response.data.data || {};
      
      // Handle new API structure with separated inquiries
      if (data.new_inquiries !== undefined && data.old_inquiries !== undefined) {
        // Ensure they are arrays
        setNewInquiries(Array.isArray(data.new_inquiries) ? data.new_inquiries : []);
        // Old inquiries will be fetched separately with filters
        if (activeTab === 'old') {
          fetchOldInquiries();
        }
      } else {
        // Fallback for backward compatibility
        const allInquiries = Array.isArray(data.all_inquiries) 
          ? data.all_inquiries 
          : (Array.isArray(data) ? data : []);
        const newInq = allInquiries.filter(inq => !inq.is_old);
        setNewInquiries(newInq);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to fetch contact inquiries');
      setNewInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOldInquiries = async () => {
    try {
      const params = {
        paginate: 'true',
        page: currentPage,
        per_page: perPage,
      };

      if (oldStatusFilter !== 'all') {
        params.old_status = oldStatusFilter;
      }

      if (dateRange !== 'all') {
        params.date_range = dateRange;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await contactService.getAll(params);
      const data = response.data.data || {};
      
      setOldInquiries(Array.isArray(data.old_inquiries) ? data.old_inquiries : []);
      setPagination(data.old_inquiries_pagination || null);
      setOldInquiriesStats(data.old_inquiries_stats || null);
    } catch (error) {
      console.error('Error fetching old inquiries:', error);
      toast.error('Failed to fetch old inquiries');
      setOldInquiries([]);
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
    if (activeTab === 'new') {
      await fetchInquiries();
    } else {
      await fetchOldInquiries();
    }
  };

  const handleClearFilters = () => {
    setOldStatusFilter('all');
    setDateRange('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleBulkDelete = async () => {
    if (selectedInquiries.length === 0) return;

    setBulkDeleting(true);
    try {
      const response = await contactService.bulkDelete(selectedInquiries.map(i => i.id));

      if (response.data.success) {
        toast.success(response.data.message || `Successfully deleted ${selectedInquiries.length} inquiry(ies)`);
        setSelectedInquiries([]);
        setBulkDeleteModalOpen(false);
        await fetchOldInquiries();
      }
    } catch (error) {
      console.error('Error deleting inquiries:', error);
      toast.error(error.response?.data?.message || 'Failed to delete inquiries');
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleInquirySelection = (inquiry) => {
    const isSelected = selectedInquiries.some(i => i.id === inquiry.id);
    if (isSelected) {
      setSelectedInquiries(selectedInquiries.filter(i => i.id !== inquiry.id));
    } else {
      // Check if inquiry is old enough to delete (>90 days)
      const inquiryDate = new Date(inquiry.created_at);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      if (inquiryDate < ninetyDaysAgo) {
        setSelectedInquiries([...selectedInquiries, inquiry]);
      } else {
        toast.warning('Only inquiries older than 90 days can be deleted');
      }
    }
  };

  const toggleSelectAll = () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const eligibleInquiries = filteredOldInquiries.filter(inq => {
      const inquiryDate = new Date(inq.created_at);
      return inquiryDate < ninetyDaysAgo;
    });

    if (selectedInquiries.length === eligibleInquiries.length) {
      setSelectedInquiries([]);
    } else {
      setSelectedInquiries(eligibleInquiries);
    }
  };

  const isInquiryEligibleForDelete = (inquiry) => {
    const inquiryDate = new Date(inquiry.created_at);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return inquiryDate < ninetyDaysAgo;
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

  // Filter inquiries based on status filter (for new inquiries)
  const getFilteredInquiries = (inquiriesList) => {
    // Ensure inquiriesList is always an array
    if (!Array.isArray(inquiriesList)) return [];
    if (filterStatus === 'all') return inquiriesList;
    return inquiriesList.filter(inq => inq.status === filterStatus);
  };

  const filteredNewInquiries = getFilteredInquiries(newInquiries);
  // Old inquiries are already filtered by backend, no need to filter again
  const filteredOldInquiries = oldInquiries;
  
  // Render inquiry card component
  const renderInquiryCard = (inquiry, showCheckbox = false) => {
    const isSelected = selectedInquiries.some(i => i.id === inquiry.id);
    const canDelete = isInquiryEligibleForDelete(inquiry);
    
    return (
    <div
      key={inquiry.id}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {showCheckbox && (
        <div className="flex items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleInquirySelection(inquiry)}
            disabled={!canDelete}
            className={`flex items-center gap-2 text-sm ${
              canDelete 
                ? 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={canDelete ? 'Select for deletion' : 'Only inquiries older than 90 days can be deleted'}
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span>{isSelected ? 'Selected' : canDelete ? 'Select' : 'Cannot delete (< 90 days)'}</span>
          </button>
        </div>
      )}
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
        <button
          onClick={() => {
            setSelectedInquiry(inquiry);
            setReplyModalOpen(true);
          }}
          className="ml-auto px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm font-medium transition-colors duration-300"
        >
          Reply
        </button>
      </div>
    </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-[#FFF7F0] to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 transition-colors duration-300">
            Contact Inquiries
          </h1>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#FFF7F0] to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
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

        {/* Filter - Only show for new inquiries */}
        {activeTab === 'new' && (
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
              Showing {filteredNewInquiries.length} of {newInquiries.length} new inquiries
            </span>
          </div>
        )}

        {/* Old Inquiries Filters and Summary */}
        {activeTab === 'old' && (
          <>
            {/* Summary Statistics */}
            {oldInquiriesStats && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Old Inquiries</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {oldInquiriesStats.total || 0}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400">Contacted</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">
                    {oldInquiriesStats.by_status?.contacted || 0}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400">Converted</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-200 mt-1">
                    {oldInquiriesStats.by_status?.converted || 0}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Closed</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {oldInquiriesStats.by_status?.closed || 0}
                  </div>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
                </div>
                
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Status:</label>
                  <select
                    value={oldStatusFilter}
                    onChange={(e) => {
                      setOldStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Date Range:</label>
                  <select
                    value={dateRange}
                    onChange={(e) => {
                      setDateRange(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Time</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="6months">Last 6 Months</option>
                  </select>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search by name, email, event type..."
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Clear Filters */}
                {(oldStatusFilter !== 'all' || dateRange !== 'all' || searchQuery) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedInquiries.length > 0 && (
              <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                    {selectedInquiries.length} inquiry(ies) selected
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {selectedInquiries.length === filteredOldInquiries.filter(isInquiryEligibleForDelete).length
                      ? 'Deselect All'
                      : 'Select All Eligible'}
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            )}
          </>
        )}

        {/* Tabs for New and Old Inquiries */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('new');
                  setSelectedInquiries([]); // Clear selections when switching tabs
                }}
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
                onClick={() => {
                  setActiveTab('old');
                  setSelectedInquiries([]); // Clear selections when switching tabs
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                  activeTab === 'old'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Old Inquiries
                {oldInquiriesStats?.total > 0 && (
                  <span className="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {oldInquiriesStats.total}
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
              {filteredNewInquiries.map(inquiry => renderInquiryCard(inquiry, false))}
            </div>
          )
        ) : (
          <>
            {filteredOldInquiries.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  No old inquiries found matching your filters.
                </p>
                {(oldStatusFilter !== 'all' || dateRange !== 'all' || searchQuery) && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredOldInquiries.map(inquiry => renderInquiryCard(inquiry, true))}
                </div>
                {/* Pagination */}
                {pagination && (
                  <InquiryPagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    total={pagination.total}
                    perPage={pagination.per_page}
                    from={pagination.from}
                    to={pagination.to}
                    onPageChange={setCurrentPage}
                    onPerPageChange={(newPerPage) => {
                      setPerPage(newPerPage);
                      setCurrentPage(1);
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
        </div>
        </PullToRefresh>

        {/* Reply Modal */}
        <ContactInquiryReplyModal
          isOpen={replyModalOpen}
          onClose={() => {
            setReplyModalOpen(false);
            setSelectedInquiry(null);
          }}
          inquiry={selectedInquiry}
        />

        {/* Bulk Delete Confirmation Modal */}
        <BulkDeleteConfirmModal
          isOpen={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          inquiries={selectedInquiries}
          onConfirm={handleBulkDelete}
          loading={bulkDeleting}
        />
    </div>
  );
};

export default ManageContactInquiries;

