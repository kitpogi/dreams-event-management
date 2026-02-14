import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  Search, Filter, X, Trash2, CheckSquare, Square, Mail, Phone, Calendar,
  MessageSquare, User, TrendingUp, Sparkles, Download, RefreshCw,
  ChevronRight, CheckCircle2, Clock, AlertCircle, Inbox, Send, Tags, MapPin, Users
} from 'lucide-react';
import api from '../../../api/axios';
import { contactService } from '../../../api/services/contactService';
import { LoadingSpinner, Button, Pagination } from '../../../components/ui';
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
  const [perPage, setPerPage] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [oldInquiriesStats, setOldInquiriesStats] = useState(null);
  const [selectedInquiries, setSelectedInquiries] = useState([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    if (activeTab === 'old') {
      fetchOldInquiries();
    }
  }, [activeTab, oldStatusFilter, dateRange, searchQuery, currentPage, perPage]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await contactService.getAll();
      const data = response.data.data || {};

      if (data.new_inquiries !== undefined && data.old_inquiries !== undefined) {
        setNewInquiries(Array.isArray(data.new_inquiries) ? data.new_inquiries : []);
        if (activeTab === 'old') fetchOldInquiries();
      } else {
        const allInquiries = Array.isArray(data.all_inquiries)
          ? data.all_inquiries
          : (Array.isArray(data) ? data : []);
        setNewInquiries(allInquiries.filter(inq => !inq.is_old));
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
        old_status: oldStatusFilter !== 'all' ? oldStatusFilter : undefined,
        date_range: dateRange !== 'all' ? dateRange : undefined,
        search: searchQuery.trim() || undefined
      };

      const response = await contactService.getAll(params);
      const data = response.data.data || {};

      setOldInquiries(Array.isArray(data.old_inquiries) ? data.old_inquiries : []);
      setPagination(data.old_inquiries_pagination || null);
      setOldInquiriesStats(data.old_inquiries_stats || null);
    } catch (error) {
      console.error('Error fetching old inquiries:', error);
      toast.error('Failed to fetch archival inquiries');
      setOldInquiries([]);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/contact-inquiries/${id}/status`, { status });
      toast.success('Inquiry priority updated');
      fetchInquiries();
      if (activeTab === 'old') fetchOldInquiries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefresh = async () => {
    if (activeTab === 'new') await fetchInquiries();
    else await fetchOldInquiries();
  };

  const handleClearFilters = () => {
    setOldStatusFilter('all');
    setDateRange('all');
    setSearchQuery('');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const handleBulkDelete = async () => {
    if (selectedInquiries.length === 0) return;
    setBulkDeleting(true);
    try {
      const response = await contactService.bulkDelete(selectedInquiries.map(i => i.id));
      if (response.data.success) {
        toast.success(response.data.message || `Deleted ${selectedInquiries.length} inquiries`);
        setSelectedInquiries([]);
        setBulkDeleteModalOpen(false);
        await fetchOldInquiries();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete selected items');
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleInquirySelection = (inquiry) => {
    const isSelected = selectedInquiries.some(i => i.id === inquiry.id);
    if (isSelected) {
      setSelectedInquiries(selectedInquiries.filter(i => i.id !== inquiry.id));
    } else {
      const inquiryDate = new Date(inquiry.created_at);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      if (inquiryDate < ninetyDaysAgo) setSelectedInquiries([...selectedInquiries, inquiry]);
      else toast.warning('Security Protocol: Only inquiries older than 90 days can be purged');
    }
  };

  const toggleSelectAll = () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const eligibleInquiries = oldInquiries.filter(inq => new Date(inq.created_at) < ninetyDaysAgo);

    if (selectedInquiries.length === eligibleInquiries.length) setSelectedInquiries([]);
    else setSelectedInquiries(eligibleInquiries);
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      contacted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      converted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${styles[status] || styles.closed}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString, detailed = false) => {
    if (!dateString) return 'Not Set';
    const options = detailed
      ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `₱${parseFloat(amount).toLocaleString()}`;
  };

  const filteredNewInquiries = useMemo(() => {
    if (filterStatus === 'all') return newInquiries;
    return newInquiries.filter(inq => inq.status === filterStatus);
  }, [newInquiries, filterStatus]);

  const renderInquiryCard = (inquiry, isOld = false) => {
    const isSelected = selectedInquiries.some(i => i.id === inquiry.id);
    const inquiryDate = new Date(inquiry.created_at);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const canDelete = inquiryDate < ninetyDaysAgo;

    return (
      <div key={inquiry.id} className={`group bg-white dark:bg-gray-900/70 backdrop-blur-xl rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl flex flex-col overflow-hidden ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-200 dark:border-gray-800'}`}>
        {/* User Header */}
        <div className="p-8 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform border border-indigo-500/20">
              <span className="text-xl font-black">{(inquiry.name || inquiry.first_name || '?').charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                {inquiry.name || `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim()}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(inquiry.status)}
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{inquiry.id}</span>
              </div>
            </div>
          </div>
          {isOld && (
            <button
              onClick={() => toggleInquirySelection(inquiry)}
              disabled={!canDelete}
              className={`p-3 rounded-2xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : (canDelete ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-indigo-500' : 'opacity-20 grayscale cursor-not-allowed')}`}
            >
              {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Tactical Info Row */}
        <div className="px-8 grid grid-cols-2 gap-4 my-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-bold truncate">{inquiry.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-bold">{inquiry.mobile_number || inquiry.phone_number || 'Sensitive'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold">{formatDate(inquiry.date_of_event || inquiry.event_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Tags className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-black uppercase tracking-tighter text-indigo-400">{inquiry.event_type || 'Event Inquiry'}</span>
            </div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="px-8 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 flex flex-wrap gap-x-8 gap-y-4">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Target Venue</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{inquiry.preferred_venue || inquiry.venue || 'Undecided'}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Unit Count</p>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-indigo-500" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{inquiry.estimated_guests || inquiry.guests || '0'} Pax</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Allocation</p>
              <p className="text-sm font-black text-emerald-500">{formatCurrency(inquiry.budget)}</p>
            </div>
          </div>
        </div>

        {/* Message Fragment */}
        <div className="px-8 mt-6 flex-1">
          <div className="relative group/msg">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-indigo-500/10" />
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic line-clamp-3">
              {inquiry.message || 'Transmission contains no readable message payload.'}
            </p>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-8 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Protocol</span>
            <div className="relative flex-1 sm:flex-none">
              <select
                value={inquiry.status}
                onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                disabled={updatingId === inquiry.id}
                className="w-full sm:w-auto appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 pr-10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="new">Mark New</option>
                <option value="contacted">Mark Contacted</option>
                <option value="converted">Mark Converted</option>
                <option value="closed">Mark Closed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {updatingId === inquiry.id && <LoadingSpinner size="sm" />}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase hidden md:inline">Logged {formatDate(inquiry.created_at)}</span>
            <button
              onClick={() => { setSelectedInquiry(inquiry); setReplyModalOpen(true); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              Dispatch Reply
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen pb-20">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">

          {/* ═══════════════ HEADER ═══════════════ */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
                <Inbox className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Inquiry Hub
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                  Review and manage {newInquiries.length + (oldInquiriesStats?.total || 0)} incoming client requests
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const response = await api.get('/contact-inquiries/export', { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Inquiries_Export_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (error) { toast.error('Failed to export catalog'); }
                }}
                className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all font-black uppercase tracking-widest"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* ═══════════════ STATS BAR ═══════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Incoming Pipeline</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{newInquiries.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Archived Records</p>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{oldInquiriesStats?.total || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Success Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-extrabold text-emerald-500">{oldInquiriesStats?.by_status?.converted || 0}</p>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Attention Req.</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-extrabold text-amber-500">{newInquiries.filter(i => i.status === 'new').length}</p>
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

          {/* ═══════════════ TABS ═══════════════ */}
          <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl mb-8 w-fit border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { setActiveTab('new'); setSelectedInquiries([]); }}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Active <span className="ml-1 opacity-60">({newInquiries.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('old'); setSelectedInquiries([]); }}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'old' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Archived <span className="ml-1 opacity-60">({oldInquiriesStats?.total || 0})</span>
            </button>
          </div>

          {/* ═══════════════ SEARCH & FILTERS ═══════════════ */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or event parameters..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${showFilters ? 'bg-slate-900 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-gray-300'}`}
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
              </button>
              {selectedInquiries.length > 0 && (
                <button
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" /> Purge ({selectedInquiries.length})
                </button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Priority Status</label>
                  <select
                    value={activeTab === 'new' ? filterStatus : oldStatusFilter}
                    onChange={(e) => {
                      if (activeTab === 'new') setFilterStatus(e.target.value);
                      else { setOldStatusFilter(e.target.value); setCurrentPage(1); }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold"
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New Requests</option>
                    <option value="contacted">In Discussion</option>
                    <option value="converted">Converted Deals</option>
                    <option value="closed">Closed/Lost</option>
                  </select>
                </div>
                {activeTab === 'old' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Age Protocol</label>
                    <select
                      value={dateRange}
                      onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold"
                    >
                      <option value="all">Unlimited History</option>
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="90days">Standard Archi (90d)</option>
                      <option value="6months">Extended (6m)</option>
                    </select>
                  </div>
                )}
                <div className="flex items-end">
                  <button onClick={handleClearFilters} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors px-4 py-3">Reset Filters</button>
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════ INQUIRY LIST ═══════════════ */}
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 bg-gray-200 dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
              ))}
            </div>
          ) : (activeTab === 'new' ? filteredNewInquiries : oldInquiries).length === 0 ? (
            <div className="py-24 text-center bg-gray-50/50 dark:bg-gray-800/20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem]">
              <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold dark:text-white">Communication channel silent</h3>
              <p className="text-gray-500 mt-2">No inquiries detected matching the current configuration.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {(activeTab === 'new' ? filteredNewInquiries : oldInquiries).map(inq => renderInquiryCard(inq, activeTab === 'old'))}
            </div>
          )}

          {/* ═══════════════ PAGINATION ═══════════════ */}
          {activeTab === 'old' && pagination && (
            <div className="mt-12 flex justify-center">
              <Pagination
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
                total={pagination.total}
                perPage={pagination.per_page}
                from={pagination.from}
                to={pagination.to}
                onPageChange={setCurrentPage}
                onPerPageChange={(newPerPage) => { setPerPage(newPerPage); setCurrentPage(1); }}
              />
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Modals */}
      <ContactInquiryReplyModal
        isOpen={replyModalOpen}
        onClose={() => { setReplyModalOpen(false); setSelectedInquiry(null); }}
        inquiry={selectedInquiry}
      />
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
