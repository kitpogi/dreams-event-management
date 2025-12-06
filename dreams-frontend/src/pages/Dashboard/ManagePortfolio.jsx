import { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminSidebar from '../../components/AdminSidebar';

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
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

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
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Please upload a JPG, PNG, or WEBP image.' });
      setImageFile(null);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFeedback({ type: 'error', message: 'Image must be 5MB or smaller.' });
      setImageFile(null);
      event.target.value = '';
      return;
    }

    setFeedback({ type: '', message: '' });
    setImageFile(file);
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
        if (value === '' || value === null || typeof value === 'undefined') {
          return;
        }

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
    setImageFile(null);
    setFeedback({ type: '', message: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this portfolio item?')) {
      return;
    }

    try {
      await api.delete(`/portfolio-items/${id}`);
      setFeedback({ type: 'success', message: 'Portfolio item deleted.' });
      if (editingId === id) {
        resetForm();
      }
      fetchItems();
    } catch (error) {
      console.error('Failed to delete portfolio item', error);
      setFeedback({ type: 'error', message: 'Unable to delete portfolio item.' });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setImageFile(null);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 bg-gray-50 min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manage Portfolio</h1>
            <p className="text-sm text-gray-500">
              Upload event photos and keep your public portfolio fresh.
            </p>
          </div>
          {feedback.message && (
            <div
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                feedback.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {feedback.message}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="bg-white rounded-xl shadow-md p-6 lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Weddings, Corporate..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Share highlights that appear on hover."
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
                    Featured
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingId ? 'Replace Image' : 'Upload Image'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {editingId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to keep the existing image.
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  JPG/PNG/WEBP, max 5MB.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="lg:col-span-2 bg-white rounded-xl shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Title & Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Event Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Featured
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-gray-500">
                        Loading portfolio items...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-gray-500">
                        No portfolio entries yet. Start by adding one on the left.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {item.image_url || item.image_path ? (
                            <img
                              src={item.image_url || item.image_path}
                              alt={item.title}
                              className="h-20 w-32 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="h-20 w-32 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                              No image
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.category || 'Uncategorized'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.event_date
                            ? new Date(item.event_date).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              item.is_featured
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.is_featured ? 'Featured' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1.5 rounded-md bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
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
      </main>
    </div>
  );
};

export default ManagePortfolio;


