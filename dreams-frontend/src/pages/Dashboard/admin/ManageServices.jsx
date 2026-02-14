import React, { useEffect, useState } from 'react';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import { formatAssetUrl } from '../../../lib/utils';
import { Plus, X, Upload, Star, Layout, Type, AlignLeft, Tags, ExternalLink, Hash, Eye, EyeOff, ArrowRight, Edit3, Trash2, GripVertical, Search, Filter, ImageIcon } from 'lucide-react';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const initialFormState = {
    title: '',
    category: '',
    description: '',
    details: '',
    rating: 5.0,
    icon: 'star',
    link: '/packages',
    is_active: true,
    sort_order: 0,
};

const ManageServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(initialFormState);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, itemId: null });
    const [existingImages, setExistingImages] = useState([]);
    const [imagesToRemove, setImagesToRemove] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/services');
            setServices(response.data.data || []);
        } catch (error) {
            console.error('Failed to load services', error);
            setFeedback({ type: 'error', message: 'Failed to load services.' });
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
        const files = Array.from(event.target.files || []);
        const validFiles = [];
        const newPreviews = [];

        files.forEach(file => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setFeedback({ type: 'error', message: 'Please upload JPG, PNG, or WEBP images.' });
                return;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                setFeedback({ type: 'error', message: 'Images must be 5MB or smaller.' });
                return;
            }
            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        setImageFiles(prev => [...prev, ...validFiles]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeNewImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            const p = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index]);
            return p;
        });
    };

    const removeExistingImage = (path) => {
        setExistingImages(prev => prev.filter(p => p !== path));
        setImagesToRemove(prev => [...prev, path]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const validFiles = [];
            const newPreviews = [];

            files.forEach(file => {
                if (!ALLOWED_TYPES.includes(file.type)) {
                    setFeedback({ type: 'error', message: 'Please upload JPG, PNG, or WEBP images.' });
                    return;
                }
                if (file.size > MAX_IMAGE_SIZE) {
                    setFeedback({ type: 'error', message: 'Images must be 5MB or smaller.' });
                    return;
                }
                validFiles.push(file);
                newPreviews.push(URL.createObjectURL(file));
            });

            setImageFiles(prev => [...prev, ...validFiles]);
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFeedback({ type: '', message: '' });

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

            imageFiles.forEach(file => {
                payload.append('images[]', file);
            });

            if (imagesToRemove.length > 0) {
                payload.append('images_to_remove', JSON.stringify(imagesToRemove));
            }

            if (editingId) {
                payload.append('_method', 'PATCH');
                await api.post(`/services/${editingId}`, payload);
                setFeedback({ type: 'success', message: 'Service updated successfully.' });
            } else {
                await api.post('/services', payload);
                setFeedback({ type: 'success', message: 'Service created successfully.' });
            }

            resetForm();
            setShowForm(false);
            fetchServices();
        } catch (error) {
            console.error('Failed to save service', error);
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Unable to save service.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (service) => {
        setEditingId(service.id);
        setFormData({
            title: service.title || '',
            category: service.category || '',
            description: service.description || '',
            details: service.details || '',
            rating: service.rating ?? 5.0,
            icon: service.icon || 'star',
            link: service.link || '/packages',
            is_active: Boolean(service.is_active),
            sort_order: service.sort_order ?? 0,
        });
        setExistingImages(service.images || []);
        setImagesToRemove([]);
        setImageFiles([]);
        setImagePreviews([]);
        setFeedback({ type: '', message: '' });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = (id) => {
        setDeleteConfirm({ isOpen: true, itemId: id });
    };

    const handleDelete = async () => {
        const id = deleteConfirm.itemId;
        if (!id) return;

        try {
            await api.delete(`/services/${id}`);
            setFeedback({ type: 'success', message: 'Service deleted.' });
            if (editingId === id) resetForm();
            fetchServices();
        } catch (error) {
            console.error('Failed to delete service', error);
            setFeedback({ type: 'error', message: 'Unable to delete service.' });
        } finally {
            setDeleteConfirm({ isOpen: false, itemId: null });
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData(initialFormState);
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setImagesToRemove([]);
    };

    // Derive categories from services
    const categories = ['All', ...new Set(services.map(s => s.category).filter(Boolean))];

    // Filtered services
    const filteredServices = services.filter(service => {
        const matchesSearch = !searchQuery || service.title?.toLowerCase().includes(searchQuery.toLowerCase()) || service.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'All' || service.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="relative min-h-screen pb-20">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">
                {/* ═══════════════ HEADER ═══════════════ */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
                            <Layout className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Manage Services
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                                Create, edit and organize your service offerings
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
                            <span className="hidden sm:inline">{showForm ? 'Close Form' : 'Add Service'}</span>
                        </button>
                    </div>
                </div>

                {/* ═══════════════ FORM PANEL (Collapsible) ═══════════════ */}
                {showForm && (
                    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                            {/* Form Header */}
                            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                            {editingId ? <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {editingId ? 'Edit Service' : 'Create New Service'}
                                            </h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Fill in the details below</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { resetForm(); setShowForm(false); }}
                                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Form Body */}
                            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column: Basic Info */}
                                    <div className="space-y-5">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Type className="w-3.5 h-3.5" />
                                            Basic Information
                                        </h3>

                                        {/* Title */}
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Service Title *</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium"
                                                placeholder="e.g. Floral Décor & Styling"
                                                required
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category *</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="" disabled>Select a category</option>
                                                <option value="Wedding">Wedding</option>
                                                <option value="Debut">Debut</option>
                                                <option value="Birthday">Birthday</option>
                                                <option value="Corporate">Corporate</option>
                                                <option value="Pageant">Pageant</option>
                                                <option value="Anniversary">Anniversary</option>
                                            </select>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description *</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                placeholder="Describe this service..."
                                                rows="4"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm resize-none"
                                                required
                                            />
                                        </div>

                                        {/* Sort Order & Active Toggle Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort Order</label>
                                                <input
                                                    type="number"
                                                    name="sort_order"
                                                    value={formData.sort_order}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium"
                                                    min="0"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                                                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        name="is_active"
                                                        checked={formData.is_active}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {formData.is_active ? 'Active' : 'Hidden'}
                                                    </span>
                                                    {formData.is_active
                                                        ? <Eye className="w-4 h-4 text-emerald-500 ml-auto" />
                                                        : <EyeOff className="w-4 h-4 text-gray-400 ml-auto" />
                                                    }
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Images */}
                                    <div className="space-y-5">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            Visual Assets
                                        </h3>

                                        {/* Existing Images */}
                                        {existingImages.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Current Images</p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                    {existingImages.map((path, index) => (
                                                        <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden group/thumb border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 transition-colors">
                                                            <img src={formatAssetUrl(path)} alt="" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeExistingImage(path)}
                                                                className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 py-0.5 text-[9px] text-white text-center font-bold">
                                                                SAVED
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Area */}
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`relative border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center p-8 cursor-pointer group/upload ${dragActive
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5'
                                                }`}
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                accept="image/*"
                                            />
                                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-3 group-hover/upload:scale-110 transition-transform">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                Drop images here or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG or WEBP • Max 5MB each</p>
                                        </div>

                                        {/* Staged Images */}
                                        {imagePreviews.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Staged for Upload</p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                    {imagePreviews.map((preview, index) => (
                                                        <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden group/thumb border-2 border-indigo-200 dark:border-indigo-500/30">
                                                            <img src={preview} alt="" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeNewImage(index)}
                                                                className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/90 py-0.5 text-[9px] text-white text-center font-bold">
                                                                STAGED
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-900 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <>
                                                {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                {editingId ? 'Update Service' : 'Create Service'}
                                            </>
                                        )}
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={() => { resetForm(); setShowForm(false); }}
                                            className="px-6 py-3.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ═══════════════ STATS BAR ═══════════════ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{services.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Active</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{services.filter(s => s.is_active).length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Categories</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{new Set(services.map(s => s.category).filter(Boolean)).size}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Rating</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl sm:text-3xl font-extrabold text-amber-500">{services.length > 0 ? (services.reduce((a, s) => a + (s.rating || 0), 0) / services.length).toFixed(1) : '0.0'}</p>
                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        </div>
                    </div>
                </div>

                {/* ═══════════════ SEARCH & FILTER BAR ═══════════════ */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search services..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ═══════════════ SERVICES GRID ═══════════════ */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200 dark:bg-gray-800" />
                                <div className="p-5 space-y-3">
                                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
                                    <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-5">
                            {searchQuery || filterCategory !== 'All' ? <Search className="w-8 h-8" /> : <Hash className="w-8 h-8" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                            {searchQuery || filterCategory !== 'All' ? 'No matching services' : 'No services yet'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
                            {searchQuery || filterCategory !== 'All'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Click "Add Service" above to create your first service offering.'
                            }
                        </p>
                        {(searchQuery || filterCategory !== 'All') && (
                            <button
                                onClick={() => { setSearchQuery(''); setFilterCategory('All'); }}
                                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                        {filteredServices.map((service) => (
                            <div
                                key={service.id}
                                className="group bg-white dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 flex flex-col"
                            >
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={formatAssetUrl(service.image_url)}
                                        alt={service.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${service.is_active
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                            : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${service.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                                            {service.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                    </div>

                                    {/* Rating Badge */}
                                    <div className="absolute top-3 right-3">
                                        <div className="flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            <span className="text-xs font-bold text-white">{service.rating || '5.0'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    {/* Category Tag */}
                                    {service.category && (
                                        <span className="inline-flex self-start items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-3 border border-indigo-100 dark:border-indigo-500/20">
                                            <Tags className="w-3 h-3" />
                                            {service.category}
                                        </span>
                                    )}

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {service.title}
                                    </h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4 flex-1">
                                        {service.description}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <button
                                            onClick={() => handleEdit(service)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 transition-all"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(service.id)}
                                            className="flex items-center justify-center w-10 h-10 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-100 dark:border-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, itemId: null })}
                onConfirm={handleDelete}
                title="Delete Service"
                message="Are you sure you want to permanently delete this service? This action cannot be undone."
                confirmText="Delete Service"
                variant="danger"
            />
        </div>
    );
};

export default ManageServices;
