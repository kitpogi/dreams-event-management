import React, { useEffect, useState } from 'react';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner } from '../../../components/ui';

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
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, testimonialId: null });

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
    const parsedValue =
      type === 'checkbox' ? checked : name === 'rating' ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '' || value === null || typeof value === 'undefined') {
          return;
        }

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
    setAvatarFile(null);
    setFeedback({ type: '', message: '' });
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, testimonialId: id });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.testimonialId;
    if (!id) return;

    try {
      await api.delete(`/testimonials/${id}`);
      setFeedback({ type: 'success', message: 'Testimonial deleted.' });
      if (editingId === id) {
        resetForm();
      }
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
  };

  return (
    <div className="bg-gradient-to-b from-[#FFF7F0] to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
                Manage Testimonials
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                Moderate client-submitted testimonials, edit content, and manage which quotes appear publicly. 
                Clients submit testimonials from their dashboard after completing events.
              </p>
            </div>
            {feedback.message && (
              <div
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                  feedback.type === 'error'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 lg:col-span-1 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 transition-colors duration-300">
                {editingId ? 'Edit Testimonial' : 'Add/Moderate Testimonial'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">
                Use this form to add testimonials from external sources or edit client-submitted testimonials.
              </p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                  Client Name
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                    Event Type
                  </label>
                  <input
                    type="text"
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                    placeholder="Wedding, corporate..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                    Event Date
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                  Rating
                </label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} Star{value > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  required
                ></textarea>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 transition-colors duration-300"
                />
                <label
                  htmlFor="is_featured"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300"
                >
                  Featured
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                  {editingId ? 'Replace Avatar (optional)' : 'Avatar (optional)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 transition-colors duration-300"
                />
                {editingId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
                    Leave blank to keep the current avatar.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-300 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Testimonial' : 'Add Testimonial'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Featured
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center">
                        <LoadingSpinner size="lg" />
                      </td>
                    </tr>
                  ) : testimonials.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-10 text-center text-gray-500 dark:text-gray-400 transition-colors duration-300"
                      >
                        No testimonials yet. Use the form to add your first one.
                      </td>
                    </tr>
                  ) : (
                    testimonials.map((testimonial) => (
                      <tr
                        key={testimonial.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {testimonial.avatar_url ? (
                              <img
                                src={testimonial.avatar_url}
                                alt={testimonial.client_name}
                                className="h-12 w-12 rounded-full object-cover border border-gray-200 dark:border-gray-600 transition-colors duration-300"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center transition-colors duration-300">
                                {testimonial.client_initials ||
                                  (testimonial.client_name || '?').slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                                {testimonial.client_name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                {testimonial.event_type || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-md transition-colors duration-300">
                          <p>&ldquo;{testimonial.message}&rdquo;</p>
                          {testimonial.event_date && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors duration-300">
                              Event date: {new Date(testimonial.event_date).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
                          {testimonial.rating} / 5
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${
                              testimonial.is_featured
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {testimonial.is_featured ? 'Featured' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(testimonial)}
                              className="px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors duration-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(testimonial.id)}
                              className="px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <ConfirmationModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, testimonialId: null })}
          onConfirm={handleDelete}
          title="Delete Testimonial"
          message="Are you sure you want to delete this testimonial? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </div>
  );
};

export default ManageTestimonials;


