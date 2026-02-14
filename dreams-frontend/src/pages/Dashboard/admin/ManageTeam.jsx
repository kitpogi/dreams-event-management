import React, { useEffect, useState, useMemo } from 'react';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import { formatAssetUrl } from '../../../lib/utils';
import {
    X, Upload, Users, Type, AlignLeft, Facebook, Instagram, Twitter, Linkedin,
    Hash, Eye, EyeOff, Briefcase, Plus, Search, Edit3, Trash2, TrendingUp, Sparkles
} from 'lucide-react';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const initialFormState = {
    name: '',
    role: '',
    description: '',
    facebook_link: '',
    instagram_link: '',
    twitter_link: '',
    linkedin_link: '',
    is_active: true,
    sort_order: 0,
};

const ManageTeam = () => {
    const [team, setTeam] = useState([]);
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

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/team-members');
            setTeam(response.data.data || []);
        } catch (error) {
            console.error('Failed to load team members', error);
            setFeedback({ type: 'error', message: 'Failed to load team members.' });
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
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setFeedback({ type: 'error', message: 'Please upload JPG, PNG, or WEBP images.' });
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            setFeedback({ type: 'error', message: 'Image must be 5MB or smaller.' });
            return;
        }

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
                payload.append('_method', 'PATCH');
                await api.post(`/team-members/${editingId}`, payload);
                setFeedback({ type: 'success', message: 'Team member updated successfully.' });
            } else {
                await api.post('/team-members', payload);
                setFeedback({ type: 'success', message: 'Team member added successfully.' });
            }

            resetForm();
            setShowForm(false);
            fetchTeam();
        } catch (error) {
            console.error('Failed to save team member', error);
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Unable to save team member.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (member) => {
        setEditingId(member.id);
        setFormData({
            name: member.name || '',
            role: member.role || '',
            description: member.description || '',
            facebook_link: member.facebook_link || '',
            instagram_link: member.instagram_link || '',
            twitter_link: member.twitter_link || '',
            linkedin_link: member.linkedin_link || '',
            is_active: Boolean(member.is_active),
            sort_order: member.sort_order ?? 0,
        });
        setImagePreview(member.image ? formatAssetUrl(member.image) : null);
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
            await api.delete(`/team-members/${id}`);
            setFeedback({ type: 'success', message: 'Team member removed.' });
            if (editingId === id) resetForm();
            fetchTeam();
        } catch (error) {
            console.error('Failed to delete team member', error);
            setFeedback({ type: 'error', message: 'Unable to remove team member.' });
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

    const filteredTeam = useMemo(() => {
        return team.filter(member =>
            member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.role?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [team, searchQuery]);

    const activeCount = useMemo(() => team.filter(m => m.is_active).length, [team]);
    const uniqueRoles = useMemo(() => new Set(team.map(m => m.role)).size, [team]);

    return (
        <div className="relative min-h-screen pb-20">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">
                {/* ═══════════════ HEADER ═══════════════ */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Team Management
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                                Manage the creative minds behind Dreams Events
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
                            <span className="hidden sm:inline">{showForm ? 'Close Form' : 'Add Team Member'}</span>
                        </button>
                    </div>
                </div>

                {/* ═══════════════ FORM PANEL (Collapsible) ═══════════════ */}
                {showForm && (
                    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                        {editingId ? <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {editingId ? 'Edit Team Member' : 'Add New Team Member'}
                                    </h2>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left: Bio & Basic Info */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <Type className="w-4 h-4 text-indigo-500" /> Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                    placeholder="e.g. John Doe"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-indigo-500" /> Role *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                    placeholder="e.g. Event Director"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <AlignLeft className="w-4 h-4 text-indigo-500" /> Bio / Description
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium resize-none"
                                                placeholder="Write a short professional bio..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Facebook</label>
                                                <input type="url" name="facebook_link" value={formData.facebook_link} onChange={handleInputChange} className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Link" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Instagram</label>
                                                <input type="url" name="instagram_link" value={formData.instagram_link} onChange={handleInputChange} className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Link" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Twitter</label>
                                                <input type="url" name="twitter_link" value={formData.twitter_link} onChange={handleInputChange} className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Link" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">LinkedIn</label>
                                                <input type="url" name="linkedin_link" value={formData.linkedin_link} onChange={handleInputChange} className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Link" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Upload & Meta */}
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <Upload className="w-4 h-4 text-indigo-500" /> Profile Photo
                                            </label>

                                            {imagePreview ? (
                                                <div className="relative group rounded-2xl overflow-hidden aspect-[3/4] border-2 border-indigo-500 shadow-lg">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={removePreview}
                                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl shadow-xl transition-all hover:scale-110 active:scale-90"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all cursor-pointer group">
                                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors mb-2" />
                                                    <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600">Click to upload photo</span>
                                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                                </label>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort Order</label>
                                                <input type="number" name="sort_order" value={formData.sort_order} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm h-[50px]" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                                                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer h-[50px]">
                                                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded" />
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{formData.is_active ? 'Active' : 'Hidden'}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {submitting ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Member' : 'Add Team Member')}
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
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Members</p>
                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{team.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Active</p>
                        <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Unique Roles</p>
                        <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{uniqueRoles}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Rating</p>
                        <div className="flex items-center gap-2">
                            <p className="text-3xl font-extrabold text-amber-500">5.0</p>
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
                        placeholder="Search team by name or role..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm shadow-indigo-500/5 text-sm font-medium"
                    />
                </div>

                {/* ═══════════════ TEAM GRID ═══════════════ */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredTeam.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <Users className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No team members found</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs">Try searching for something else or add a new team member.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTeam.map((member) => (
                            <div key={member.id} className="group bg-white dark:bg-gray-900/70 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                                {/* Photo Container */}
                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <img
                                        src={formatAssetUrl(member.image)}
                                        alt={member.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                                    {/* Status Badges */}
                                    <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${member.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-gray-500/20 text-white border-white/20'}`}>
                                            {member.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                        <span className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white">
                                            Order #{member.sort_order}
                                        </span>
                                    </div>

                                    {/* Identity Overlay */}
                                    <div className="absolute bottom-6 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform">
                                        <h3 className="text-xl font-black text-white leading-tight mb-1 drop-shadow-md">
                                            {member.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-[1px] bg-indigo-500" />
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest drop-shadow-sm">
                                                {member.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content & Actions */}
                                <div className="p-6 flex flex-col flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-6 italic">
                                        "{member.description || 'Passionate about creating unforgettable event experiences.'}"
                                    </p>

                                    <div className="flex items-center gap-2 pt-4 mt-auto border-t border-gray-100 dark:border-gray-800">
                                        <button
                                            onClick={() => handleEdit(member)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 hover:text-white transition-all duration-300 border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(member.id)}
                                            className="w-12 h-12 flex items-center justify-center rounded-2xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100 dark:border-red-500/20"
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
                title="Remove Team Member"
                message="Are you sure you want to remove this team member? This action cannot be undone."
                confirmText="Yes, remove"
                variant="danger"
            />
        </div>
    );
};

export default ManageTeam;
