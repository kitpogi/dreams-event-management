import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import AdminSidebar from '../../components/AdminSidebar';

const EditPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    capacity: '',
    venue_id: '',
    type: '',
    theme: '',
    is_featured: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(true);

  useEffect(() => {
    fetchPackage();
    fetchVenues();
  }, [id]);

  const fetchPackage = async () => {
    try {
      const response = await api.get(`/packages/${id}`);
      const packageData = response.data.data || response.data;
      setFormData({
        name: packageData.name || '',
        description: packageData.description || '',
        price: packageData.price || '',
        capacity: packageData.capacity || '',
        venue_id: packageData.venue_id || '',
        type: packageData.type || '',
        theme: packageData.theme || '',
        is_featured: packageData.is_featured || false,
      });
    } catch (error) {
      console.error('Error fetching package:', error);
      alert('Failed to load package');
      navigate('/admin/packages');
    } finally {
      setLoadingPackage(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const response = await api.get('/packages');
      const packages = response.data.data || response.data;
      const uniqueVenues = [...new Map(packages.map(pkg => [pkg.venue?.id, pkg.venue])).values()].filter(v => v);
      setVenues(uniqueVenues);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/packages/${id}`, {
        ...formData,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        venue_id: parseInt(formData.venue_id),
      });
      navigate('/admin/packages');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update package');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPackage) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-10 bg-gray-50 min-h-screen">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Edit Package</h1>
        <div className="bg-white shadow-md rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₱) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                {loadingVenues ? (
                  <p className="text-gray-500">Loading venues...</p>
                ) : (
                  <select
                    name="venue_id"
                    value={formData.venue_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a venue...</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} - {venue.location}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select type...</option>
                  <option value="wedding">Wedding</option>
                  <option value="debut">Debut</option>
                  <option value="birthday">Birthday</option>
                  <option value="pageant">Pageant</option>
                  <option value="corporate">Corporate</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <input
                type="text"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                placeholder="e.g., elegant, modern, rustic"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Featured Package
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Package'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/packages')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditPackage;

