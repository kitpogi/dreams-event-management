import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { Button, Input, ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import { Building2, MapPin, Users, FileText, X, Plus, Edit3, Search, Hash, TrendingUp } from 'lucide-react';

const ManageVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, venueId: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/venues');
      setVenues(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setFeedback({ type: 'error', message: 'Failed to load venues' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      if (editingId) {
        await api.put(`/venues/${editingId}`, formData);
        setFeedback({ type: 'success', message: 'Venue updated successfully' });
      } else {
        await api.post('/venues', formData);
        setFeedback({ type: 'success', message: 'Venue created successfully' });
      }
      fetchVenues();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving venue:', error);
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Failed to save venue' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (venue) => {
    setEditingId(venue.id);
    setFormData({
      name: venue.name,
      location: venue.location,
      capacity: venue.capacity,
      description: venue.description || '',
    });
    setFeedback({ type: '', message: '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id) => {
    setDeleteConfirm({ isOpen: true, venueId: id });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.venueId;
    if (!id) return;

    try {
      await api.delete(`/venues/${id}`);
      setVenues(prev => prev.filter((v) => v.id !== id));
      setFeedback({ type: 'success', message: 'Venue deleted successfully' });
    } catch (error) {
      console.error('Error deleting venue:', error);
      setFeedback({ type: 'error', message: 'Failed to delete venue' });
    } finally {
      setDeleteConfirm({ isOpen: false, venueId: null });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      location: '',
      capacity: '',
      description: '',
    });
  };

  const filteredVenues = useMemo(() => {
    return venues.filter(v =>
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [venues, searchQuery]);

  const totalCapacity = useMemo(() => {
    return venues.reduce((sum, v) => sum + (parseInt(v.capacity) || 0), 0);
  }, [venues]);

  return (
    <div className="relative min-h-screen pb-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">
        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Manage Venues
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                Organize and scale your event locations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {feedback.message && (
              <div className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg animate-in slide-in-from-top-4 duration-500 border ${feedback.type === 'error'
                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${feedback.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {feedback.message}
                </div>
              </div>
            )}
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${showForm
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25'
                }`}
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="hidden sm:inline">{showForm ? 'Close Form' : 'Add Venue'}</span>
            </button>
          </div>
        </div>

        {/* ═══════════════ FORM PANEL (Collapsible) ═══════════════ */}
        {showForm && (
          <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    {editingId ? <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingId ? 'Edit Venue' : 'Create New Venue'}
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Grand Ballroom"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Makati City"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                      placeholder="Max guests"
                      required
                      min="1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none"
                      placeholder="Brief description..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingId ? 'Update Venue' : 'Create Venue'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false); }}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════ STATS BAR ═══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Venues</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{venues.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Capacity</p>
            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{totalCapacity.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Locations</p>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{new Set(venues.map(v => v.location)).size}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Average Cap</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-amber-500">
                {venues.length > 0 ? Math.round(totalCapacity / venues.length) : 0}
              </p>
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* ═══════════════ SEARCH BAR ═══════════════ */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or location..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>

        {/* ═══════════════ VENUES GRID ═══════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
              <Hash className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No venues matching your criteria</h3>
            <p className="text-gray-500 dark:text-gray-400">Clear your search or add a new venue above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className="group bg-white dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-800 p-6 hover:border-blue-500/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{venue.capacity?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {venue.name}
                </h3>

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{venue.location}</span>
                </div>

                {venue.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-6">
                    {venue.description}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleEdit(venue)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all border border-blue-100 dark:border-blue-500/20"
                  >
                    Modify
                  </button>
                  <button
                    onClick={() => confirmDelete(venue.id)}
                    className="px-4 py-2.5 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white transition-all border border-red-100 dark:border-red-500/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, venueId: null })}
        onConfirm={handleDelete}
        title="Delete Venue"
        message="Are you sure you want to delete this venue? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ManageVenues;
