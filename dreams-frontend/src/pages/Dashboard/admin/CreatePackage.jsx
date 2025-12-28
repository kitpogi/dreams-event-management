import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';

const CreatePackage = () => {
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
  const [loading, setLoading] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [secondaryFiles, setSecondaryFiles] = useState([]);
  const [secondaryPreviews, setSecondaryPreviews] = useState([]);

  useEffect(() => {
    fetchVenues();
  }, []);

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
      if (name === 'image') {
        if (file) {
          setImageFile(file);
          const previewUrl = URL.createObjectURL(file);
          setImagePreview(previewUrl);
        } else {
          setImageFile(null);
          setImagePreview(null);
        }
      } else if (name === 'gallery') {
        const validFiles = Array.from(files || []);
        setSecondaryFiles(validFiles);
        const previews = validFiles.map((f) => ({
          name: f.name,
          url: URL.createObjectURL(f),
        }));
        setSecondaryPreviews(previews);
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    setAnalyzingImage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', imageFile);

      const response = await api.post('/analyze-package-image', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const extractedData = response.data.data;
        
        // Auto-fill form with extracted data
        setFormData({
          name: extractedData.name || formData.name,
          description: extractedData.description || formData.description,
          price: extractedData.price || formData.price,
          capacity: extractedData.capacity || formData.capacity,
          type: extractedData.type || formData.type,
          theme: extractedData.theme || formData.theme,
          inclusions: extractedData.inclusions || formData.inclusions,
          venue_id: formData.venue_id,
          is_featured: formData.is_featured,
        });

        toast.success('Image analyzed! Form filled with extracted data. Please review and adjust as needed.');
      } else {
        toast.error(response.data.message || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error(error.response?.data?.message || 'Failed to analyze image. Please fill the form manually.');
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare description with extra details since schema is fixed
      let fullDescription = formData.description;
      if (formData.theme) fullDescription += `\n\nTheme: ${formData.theme}`;
      // Venue is now handled by venue_id field

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

      secondaryFiles.forEach((file, index) => {
        data.append(`gallery_images[${index}]`, file);
      });

      // Append is_featured if needed by backend (needs backend support)
      // data.append('is_featured', formData.is_featured ? 1 : 0);

      await api.post('/packages', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Package created successfully!');
      navigate('/admin/packages');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-10 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Package</h1>
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
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              {imageFile && (
                <div className="mt-4">
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Selected:</span> {imageFile.name}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleAnalyzeImage}
                          disabled={analyzingImage}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {analyzingImage ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Analyzing Image with AI...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              Auto-Fill with AI
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Click to analyze the image and automatically fill form fields
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Gallery Images
              </label>
              <input
                type="file"
                name="gallery"
                onChange={handleChange}
                accept="image/*"
                multiple
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {secondaryPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {secondaryPreviews.map((preview) => (
                    <div key={preview.url} className="relative">
                      <img src={preview.url} alt={preview.name} className="w-full h-24 object-cover rounded border" />
                      <p className="text-xs mt-1 text-gray-600 truncate">{preview.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Optional: upload additional images (max {secondaryPreviews.length || 0} selected).
              </p>
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
                placeholder="List package inclusions..."
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
                {loading ? 'Creating...' : 'Create Package'}
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

export default CreatePackage;

