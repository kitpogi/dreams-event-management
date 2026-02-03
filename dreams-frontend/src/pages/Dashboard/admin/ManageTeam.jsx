import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import { formatAssetUrl } from '../../../lib/utils';
import { X, Upload, Users, Type, AlignLeft, Facebook, Instagram, Twitter, Linkedin, Hash, Eye, EyeOff, Briefcase } from 'lucide-react';

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
        if (imagePreview) URL.revokeObjectURL(imagePreview);
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

    return (
        <div className="bg-[#f8fafc] dark:bg-gray-900 min-h-screen pb-20">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Manage Team
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Add, edit, or remove the awesome people behind Dreams Event Management.
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
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    {editingId ? 'Edit Team Member' : 'Add Team Member'}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Type className="w-4 h-4" /> Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                            placeholder="e.g. John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" /> Role
                                        </label>
                                        <input
                                            type="text"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                            placeholder="e.g. Lead Planner"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4" /> Bio / Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none resize-none"
                                        placeholder="Brief bio about the team member..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Facebook className="w-4 h-4" /> Facebook
                                        </label>
                                        <input
                                            type="url"
                                            name="facebook_link"
                                            value={formData.facebook_link}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                            placeholder="https://facebook.com/..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Instagram className="w-4 h-4" /> Instagram
                                        </label>
                                        <input
                                            type="url"
                                            name="instagram_link"
                                            value={formData.instagram_link}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                            placeholder="https://instagram.com/..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Twitter className="w-4 h-4" /> Twitter
                                        </label>
                                        <input
                                            type="url"
                                            name="twitter_link"
                                            value={formData.twitter_link}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                            placeholder="https://twitter.com/..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Linkedin className="w-4 h-4" /> LinkedIn
                                        </label>
                                        <input
                                            type="url"
                                            name="linkedin_link"
                                            value={formData.linkedin_link}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Hash className="w-4 h-4" /> Sort Order
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
                                        <Upload className="w-4 h-4" /> Profile Photo
                                    </label>

                                    {imagePreview && (
                                        <div className="relative w-32 h-40 mx-auto group">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-indigo-500" />
                                            <button
                                                type="button"
                                                onClick={removePreview}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {!imagePreview && (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-8 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Click to upload photo</span>
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {submitting ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Member' : 'Add Member')}
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
                            ) : team.length === 0 ? (
                                <div className="md:col-span-2 text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                                    <p className="text-gray-500">No team members found. Start by adding one!</p>
                                </div>
                            ) : (
                                team.map((member) => (
                                    <div key={member.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 overflow-hidden group">
                                        <div className="relative aspect-[4/5]">
                                            <img
                                                src={formatAssetUrl(member.image)}
                                                alt={member.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${member.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                                                    }`}>
                                                    {member.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {member.is_active ? 'Visible' : 'Hidden'}
                                                </span>
                                                <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                    #{member.sort_order}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="mb-4">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                    {member.name}
                                                </h3>
                                                <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider">
                                                    {member.role}
                                                </p>
                                            </div>

                                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6">
                                                {member.description || 'No bio provided.'}
                                            </p>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-3 rounded-xl transition-all"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(member.id)}
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
                title="Remove Team Member"
                message="Are you sure you want to remove this team member? This action cannot be undone."
                confirmText="Yes, remove"
                variant="danger"
            />
        </div>
    );
};

export default ManageTeam;
