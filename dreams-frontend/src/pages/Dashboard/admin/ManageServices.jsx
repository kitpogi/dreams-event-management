import React, { useEffect, useState } from 'react';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import { formatAssetUrl } from '../../../lib/utils';
import { Plus, X, Upload, Star, Layout, Type, AlignLeft, Tags, ExternalLink, Hash, Eye, EyeOff } from 'lucide-react';

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id) => {
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

    return (
        <div className="bg-[#f8fafc] dark:bg-gray-900 min-h-screen pb-20">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Manage Services
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Control the services displayed on your homepage and catalog.
                        </p>
                    </div>
                    {feedback.message && (
                        <div className={`px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all animate-fade-in ${feedback.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                            {feedback.message}
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-12 xl:col-span-5">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-6">
                            <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-indigo-500" />
                                    {editingId ? 'Edit Service' : 'Create New Service'}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Type className="w-4 h-4" /> Title
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                            placeholder="e.g. Dream Wedding"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Tags className="w-4 h-4" /> Category
                                        </label>
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                            placeholder="e.g. Wedding"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4" /> Short Description
                                    </label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                        placeholder="e.g. Starting from ₱50,000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Detailed Information</label>
                                    <textarea
                                        name="details"
                                        value={formData.details}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none resize-none"
                                        placeholder="Provide full details about this service..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Star className="w-4 h-4" /> Rating
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="5"
                                            name="rating"
                                            value={formData.rating}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Icon</label>
                                        <input
                                            type="text"
                                            name="icon"
                                            value={formData.icon}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Hash className="w-4 h-4" /> Order
                                        </label>
                                        <input
                                            type="number"
                                            name="sort_order"
                                            value={formData.sort_order}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <label className="flex items-center gap-3 cursor-pointer group bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-600">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 rounded-lg border-2 border-indigo-500 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Active</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Service Images
                                    </label>

                                    {/* Current Images */}
                                    {(existingImages.length > 0 || imagePreviews.length > 0) && (
                                        <div className="grid grid-cols-3 gap-3">
                                            {existingImages.map((img, i) => (
                                                <div key={`exist-${i}`} className="relative aspect-square group">
                                                    <img src={formatAssetUrl(img)} alt="" className="w-full h-full object-cover rounded-xl" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(img)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {imagePreviews.map((url, i) => (
                                                <div key={`new-${i}`} className="relative aspect-square group">
                                                    <img src={url} alt="" className="w-full h-full object-cover rounded-xl border-2 border-indigo-500" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewImage(i)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-8 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Click to upload photos</span>
                                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {submitting ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Service' : 'Create Service')}
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-12 xl:col-span-7">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loading ? (
                                <div className="md:col-span-2 flex justify-center py-20">
                                    <LoadingSpinner size="lg" />
                                </div>
                            ) : services.length === 0 ? (
                                <div className="md:col-span-2 text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                                    <p className="text-gray-500">No services found. Start by creating one!</p>
                                </div>
                            ) : (
                                services.map((service) => (
                                    <div key={service.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 overflow-hidden group">
                                        <div className="relative aspect-video">
                                            <img
                                                src={formatAssetUrl(service.images?.[0])}
                                                alt={service.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${service.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                                                    }`}>
                                                    {service.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {service.is_active ? 'Visible' : 'Hidden'}
                                                </span>
                                                <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                    #{service.sort_order}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">
                                                        {service.category}
                                                    </span>
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                        {service.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1 bg-yellow-400 text-white px-2 py-1 rounded-lg text-xs font-black">
                                                    <Star className="w-3 h-3 fill-white" />
                                                    {service.rating}
                                                </div>
                                            </div>

                                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6">
                                                {service.description || 'No description provided.'}
                                            </p>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(service)}
                                                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-3 rounded-xl transition-all"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(service.id)}
                                                    className="px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, itemId: null })}
                onConfirm={handleDelete}
                title="Delete Service"
                message="Are you sure you want to delete this service? This will remove it from the website permanently."
                confirmText="Yes, delete it"
                variant="danger"
            />
        </div>
    );
};

export default ManageServices;
