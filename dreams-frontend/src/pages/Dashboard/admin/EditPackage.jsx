import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';

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
    inclusions: '',
    is_featured: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
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
        name: packageData.package_name || packageData.name || '',
        description: packageData.package_description || packageData.description || '',
        inclusions: packageData.package_inclusions || packageData.inclusions || '',
        price: packageData.package_price || packageData.price || '',
        // capacity: Not stored in DB column, usually part of description now
        capacity: packageData.capacity || '',
        venue_id: packageData.venue_id || '',
        type: packageData.package_category || packageData.type || '',
        theme: packageData.theme || '',
        is_featured: packageData.is_featured || false,
      });
      setCurrentImageUrl(packageData.package_image || '');
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('Failed to load package');
      navigate('/admin/packages');
    } finally {
      setLoadingPackage(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const response = await api.get('/venues');
      setVenues(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setImageFile(file || null);
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare description with extra details
      let fullDescription = formData.description;
      // Only append if not already present to avoid duplicates on repeated edits
      if (formData.theme && !fullDescription.includes(`Theme: ${formData.theme}`)) {
        fullDescription += `\n\nTheme: ${formData.theme}`;
      }

      const data = new FormData();
      data.append('package_name', formData.name);
      data.append('package_description', fullDescription);
      data.append('package_price', parseFloat(formData.price));
      data.append('package_category', formData.type);
      if (formData.capacity) data.append('capacity', parseInt(formData.capacity));
      data.append('venue_id', formData.venue_id);
      data.append('package_inclusions', formData.inclusions || 'Standard inclusions');
      
      if (imageFile) {
        data.append('package_image', imageFile);
      }
      
      // Since PUT with FormData is tricky in Laravel/PHP (doesn't parse multipart/form-data for PUT requests natively),
      // we use POST with _method=PUT spoofing.
      data.append('_method', 'PUT');

      await api.post(`/packages/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Package updated successfully!');
      navigate('/admin/packages');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update package');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPackage) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-10 bg-gray-50 min-h-screen">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Image
              </label>
              <div className="space-y-3">
                {currentImageUrl && !imageFile && (
                  <div className="mb-2">
                    <img src={currentImageUrl} alt="Current" className="h-32 w-auto object-cover rounded border" />
                    <p className="text-xs text-gray-500 mt-1">Current Image</p>
                  </div>
                )}
                {imageFile && (
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded border-2 border-indigo-200" />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Selected:</span> {imageFile.name}
                      </p>
                      <p className="text-xs text-gray-500">Upload a new image to replace the current one.</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to keep current image</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inclusions *
              </label>
              <textarea
                name="inclusions"
                value={formData.inclusions}
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

