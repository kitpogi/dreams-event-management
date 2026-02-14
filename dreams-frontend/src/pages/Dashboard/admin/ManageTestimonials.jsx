import React, { useEffect, useState, useMemo } from 'react';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import {
  Star, Plus, X, Quote, Search, Filter, Calendar, Users,
  MessageSquare, Trash2, Edit3, Type, TrendingUp, Sparkles, Upload
} from 'lucide-react';
import { formatAssetUrl } from '../../../lib/utils';

const initialFormState = {
  client_name: '',
  event_type: '',
  event_date: '',
  rating: 5,
  message: '',
  is_featured: true,
};

const ManageTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormState);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, testimonialId: null });
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await api.get('/testimonials');
      setTestimonials(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load testimonials', error);
      setFeedback({ type: 'error', message: 'Failed to load testimonials.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const parsedValue = type === 'checkbox' ? checked : name === 'rating' ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '' || value === null || typeof value === 'undefined') return;
        if (typeof value === 'boolean') {
          payload.append(key, value ? 1 : 0);
        } else {
          payload.append(key, value);
        }
      });

      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      if (editingId) {
        payload.append('_method', 'PUT');
        await api.post(`/testimonials/${editingId}`, payload);
        setFeedback({ type: 'success', message: 'Testimonial updated successfully.' });
      } else {
        await api.post('/testimonials', payload);
        setFeedback({ type: 'success', message: 'Testimonial added successfully.' });
      }

      resetForm();
      setShowForm(false);
      fetchTestimonials();
    } catch (error) {
      console.error('Failed to save testimonial', error);
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Unable to save testimonial.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (testimonial) => {
    setEditingId(testimonial.id);
    setFormData({
      client_name: testimonial.client_name || '',
      event_type: testimonial.event_type || '',
      event_date: testimonial.event_date ? testimonial.event_date.slice(0, 10) : '',
      rating: testimonial.rating || 5,
      message: testimonial.message || '',
      is_featured: Boolean(testimonial.is_featured),
    });
    setAvatarPreview(testimonial.avatar_url || null);
    setAvatarFile(null);
    setFeedback({ type: '', message: '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id) => {
    setDeleteConfirm({ isOpen: true, testimonialId: id });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.testimonialId;
    if (!id) return;

    try {
      await api.delete(`/testimonials/${id}`);
      setFeedback({ type: 'success', message: 'Testimonial deleted successfully.' });
      if (editingId === id) resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error('Failed to delete testimonial', error);
      setFeedback({ type: 'error', message: 'Unable to delete testimonial.' });
    } finally {
      setDeleteConfirm({ isOpen: false, testimonialId: null });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      const matchesSearch = !searchQuery || t.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) || t.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating = ratingFilter === 'All' || t.rating === parseInt(ratingFilter);
      return matchesSearch && matchesRating;
    });
  }, [testimonials, searchQuery, ratingFilter]);

  const avgRating = useMemo(() => {
    if (testimonials.length === 0) return 0;
    return (testimonials.reduce((sum, t) => sum + (t.rating || 0), 0) / testimonials.length).toFixed(1);
  }, [testimonials]);

  return (
    <div className="relative min-h-screen pb-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">
        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
              <Quote className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Client Feedback
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                Manage and showcase your client's success stories
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
                : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/25'
                }`}
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="hidden sm:inline">{showForm ? 'Close Form' : 'Add Story'}</span>
            </button>
          </div>
        </div>

        {/* ═══════════════ FORM PANEL (Collapsible) ═══════════════ */}
        {showForm && (
          <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600">
                  {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                {editingId ? 'Edit Testimonial' : 'Draft New Story'}
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Client & Info */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-500" /> Client Name *
                        </label>
                        <input
                          type="text"
                          name="client_name"
                          value={formData.client_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                          placeholder="e.g. Maria Clara"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" /> Event Type
                        </label>
                        <input
                          type="text"
                          name="event_type"
                          value={formData.event_type}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="e.g. Wedding Reception"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-500" /> Testimonial Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none h-40"
                        placeholder="What did the client say about your service?"
                        required
                      />
                    </div>
                  </div>

                  {/* Ratings & Image */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Satisfaction Rating
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, rating: star }))}
                            className="transition-transform active:scale-90"
                          >
                            <Star className={`w-8 h-8 ${formData.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'}`} />
                          </button>
                        ))}
                        <span className="ml-auto text-xl font-black text-amber-500">{formData.rating}/5</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-500" /> Client Avatar (Optional)
                      </label>
                      {avatarPreview ? (
                        <div className="relative group rounded-full overflow-hidden w-24 h-24 mx-auto border-4 border-amber-500 shadow-xl">
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={removeAvatar} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-24 h-24 mx-auto border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-full hover:border-amber-500 hover:bg-amber-50/50 transition-all cursor-pointer">
                          <Upload className="w-6 h-6 text-gray-400" />
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Feature on Website</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20"
                  >
                    {submitting ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Story' : 'Publish Story')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false); }}
                    className="px-6 py-3.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all"
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
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Stories</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{testimonials.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Featured</p>
            <p className="text-3xl font-extrabold text-amber-500">{testimonials.filter(t => t.is_featured).length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-amber-500">{avgRating}</p>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Trends</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-emerald-500">Positive</p>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* ═══════════════ SEARCH & FILTERS ═══════════════ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name or feedback content..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/10 transition-all font-medium text-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['All', '5', '4', '3', '2', '1'].map(rate => (
              <button
                key={rate}
                onClick={() => setRatingFilter(rate)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 ${ratingFilter === rate
                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-amber-300'
                  }`}
              >
                {rate !== 'All' && <Star className={`w-3 h-3 ${ratingFilter === rate ? 'fill-white' : 'fill-amber-500 text-amber-500'}`} />}
                {rate === 'All' ? 'All Ratings' : `${rate} Stars`}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════ TESTIMONIALS GRID ═══════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <Quote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold dark:text-white">No stories found</h3>
            <p className="text-gray-500 mt-2">Be the first to share a client's wonderful experience.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="group bg-white dark:bg-gray-900/70 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-gray-800 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col relative overflow-hidden">
                {/* Quote Icon Decorative */}
                <Quote className="absolute -top-6 -right-6 w-32 h-32 text-gray-500/5 rotate-12 group-hover:text-amber-500/10 transition-colors" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-md">
                    <img
                      src={formatAssetUrl(testimonial.avatar_url || testimonial.avatar_path)}
                      alt={testimonial.client_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${testimonial.client_name}&background=f59e0b&color=fff`; }}
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-900 dark:text-white leading-tight">{testimonial.client_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{testimonial.event_type || 'Client'}</span>
                      {testimonial.is_featured && (
                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border border-amber-500/20">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-6 py-2 bg-amber-500/5 rounded-xl border border-amber-500/10 justify-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-4 h-4 ${testimonial.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-gray-200 dark:text-gray-700 font-light'}`} />
                  ))}
                  <span className="ml-2 text-xs font-black text-amber-600">{testimonial.rating}.0</span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm italic leading-relaxed mb-8 flex-1 relative">
                  <span className="text-4xl text-amber-500 opacity-20 absolute -top-4 -left-2 font-serif">"</span>
                  {testimonial.message}
                  <span className="text-4xl text-amber-500 opacity-20 absolute -bottom-8 -right-2 font-serif">"</span>
                </p>

                <div className="flex items-center gap-2 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all duration-300 border border-amber-100 dark:border-amber-500/20"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(testimonial.id)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100 dark:border-red-500/20"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, testimonialId: null })}
        onConfirm={handleDelete}
        title="Silence Feedback"
        message="Are you sure you want to permanently delete this client testimonial? This story will be lost forever."
        confirmText="Terminate Review"
        variant="danger"
      />
    </div>
  );
};

export default ManageTestimonials;
