import React, { useEffect, useState, useMemo } from 'react';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import {
  Plus, X, Image as ImageIcon, Search, Filter, Calendar,
  Star, Layout, Trash2, Edit3, Type, AlignLeft, Tags, Clock, TrendingUp
} from 'lucide-react';
import { formatAssetUrl } from '../../../lib/utils';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const initialFormState = {
  title: '',
  category: '',
  description: '',
  event_date: '',
  display_order: 0,
  is_featured: false,
};

const ManagePortfolio = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, itemId: null });
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get('/portfolio-items');
      setItems(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load portfolio items', error);
      setFeedback({ type: 'error', message: 'Failed to load portfolio items.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const parsedValue = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Please upload a JPG, PNG, or WEBP image.' });
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFeedback({ type: 'error', message: 'Image must be 5MB or smaller.' });
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setFeedback({ type: '', message: '' });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removePreview = () => {
    setImageFile(null);
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!editingId && !imageFile) {
      setFeedback({ type: 'error', message: 'Please attach an image before creating an item.' });
      return;
    }

    setSubmitting(true);

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

      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (editingId) {
        payload.append('_method', 'PUT');
        await api.post(`/portfolio-items/${editingId}`, payload);
        setFeedback({ type: 'success', message: 'Portfolio item updated successfully.' });
      } else {
        await api.post('/portfolio-items', payload);
        setFeedback({ type: 'success', message: 'Portfolio item created successfully.' });
      }

      resetForm();
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Failed to save portfolio item', error);
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Unable to save portfolio item.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      category: item.category || '',
      description: item.description || '',
      event_date: item.event_date ? item.event_date.slice(0, 10) : '',
      display_order: item.display_order ?? 0,
      is_featured: Boolean(item.is_featured),
    });
    setImagePreview(item.image_url || item.image_path || null);
    setImageFile(null);
    setFeedback({ type: '', message: '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, itemId: id });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.itemId;
    if (!id) return;

    try {
      await api.delete(`/portfolio-items/${id}`);
      setFeedback({ type: 'success', message: 'Portfolio item deleted.' });
      if (editingId === id) resetForm();
      fetchItems();
    } catch (error) {
      console.error('Failed to delete portfolio item', error);
      setFeedback({ type: 'error', message: 'Unable to delete portfolio item.' });
    } finally {
      setDeleteConfirm({ isOpen: false, itemId: null });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setImageFile(null);
    setImagePreview(null);
  };

  const categories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, filterCategory]);

  const featuredCount = useMemo(() => items.filter(i => i.is_featured).length, [items]);

  return (
    <div className="relative min-h-screen pb-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">
        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Portfolio Showroom
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                Showcase your best event masterpieces
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
                : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-blue-500/25'
                }`}
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="hidden sm:inline">{showForm ? 'Close Form' : 'Add Masterpiece'}</span>
            </button>
          </div>
        </div>

        {/* ═══════════════ FORM PANEL (Collapsible) ═══════════════ */}
        {showForm && (
          <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingId ? 'Edit Masterpiece' : 'Post New Masterpiece'}
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Content Info */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-indigo-500">
                        <Type className="w-4 h-4" /> Mastery Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="e.g. Royal Wedding at the Palace"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-indigo-500">
                          <Tags className="w-4 h-4" /> Category
                        </label>
                        <input
                          type="text"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          placeholder="e.g. Weddings"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-indigo-500">
                          <Calendar className="w-4 h-4" /> Event Date
                        </label>
                        <input
                          type="date"
                          name="event_date"
                          value={formData.event_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-indigo-500">
                        <AlignLeft className="w-4 h-4" /> Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                        placeholder="Share the story behind this event..."
                      />
                    </div>
                  </div>

                  {/* Asset & Settings */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-indigo-500">
                        <Upload className="w-4 h-4" /> Highlight Image *
                      </label>
                      {imagePreview ? (
                        <div className="relative group rounded-2xl overflow-hidden aspect-video border-2 border-indigo-500 shadow-lg">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removePreview}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                          <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors mb-2" />
                          <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600">Select Image</span>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Display Order</label>
                        <input type="number" name="display_order" value={formData.display_order} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                      </div>
                      <div className="flex flex-col justify-end pb-3">
                        <label className="flex items-center gap-3 cursor-pointer group px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="w-4 h-4 rounded border-indigo-500 text-indigo-600 focus:ring-indigo-500" />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Star className={`w-3.5 h-3.5 ${formData.is_featured ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                            Featured
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                  >
                    {submitting ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Masterpiece' : 'Post Showroom Entry')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false); }}
                    className="px-6 py-3.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all font-medium"
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
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Exhibits</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{items.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Featured</p>
            <p className="text-3xl font-extrabold text-amber-500">{featuredCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Genres</p>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{new Set(items.map(i => i.category)).size}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Recent View</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-emerald-500">Active</p>
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* ═══════════════ SEARCH & FILTER ═══════════════ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find masterpieces by title or category..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition-all shadow-sm focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${filterCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-indigo-300'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════ PORTFOLIO GRID ═══════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/50 dark:bg-gray-800/20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem]">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold dark:text-white">No matches found in your showroom</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or explore new search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="group bg-white dark:bg-gray-900/70 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={item.image_url || item.image_path}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {item.is_featured && (
                      <span className="bg-amber-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                        Featured
                      </span>
                    )}
                    <span className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                      #{item.display_order}
                    </span>
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-5 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform">
                    <h3 className="text-lg font-black text-white leading-tight drop-shadow-md">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Tags className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                        {item.category || 'Event Portfolio'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-4">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold leading-none">{item.event_date ? new Date(item.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date Unspecified'}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-6">
                    {item.description || 'Curation of the most elegant moments captured in our professional events showcase.'}
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 hover:text-white transition-all duration-300 border border-indigo-100 dark:border-indigo-500/20"
                    >
                      <Edit3 className="w-4 h-4" />
                      Redact
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100 dark:border-red-500/10"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemId: null })}
        onConfirm={handleDelete}
        title="Acknowledge Deletion"
        message="Are you sure you want to permanently remove this masterpiece from the showroom?"
        confirmText="Terminate Entry"
        variant="danger"
      />
    </div>
  );
};

export default ManagePortfolio;
