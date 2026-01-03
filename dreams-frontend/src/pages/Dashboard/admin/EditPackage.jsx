import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminNavbar from '../../../components/layout/AdminNavbar';
import { LoadingSpinner } from '../../../components/ui';
import { useSidebar } from '../../../context/SidebarContext';

const EditPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    capacity: '',
    venue_id: '',
    type: '',
    theme: [],
    inclusions: '',
    is_featured: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(true);

  // Get theme options based on event type
  const getThemeOptions = (eventType) => {
    const allThemes = {
      wedding: [
        { value: 'elegant', label: 'Elegant' },
        { value: 'romantic', label: 'Romantic' },
        { value: 'rustic', label: 'Rustic' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'classic', label: 'Classic' },
        { value: 'garden', label: 'Garden' },
        { value: 'beach', label: 'Beach' },
        { value: 'bohemian', label: 'Bohemian' },
        { value: 'luxury', label: 'Luxury' },
        { value: 'modern', label: 'Modern' },
        { value: 'tropical', label: 'Tropical' },
        { value: 'minimalist', label: 'Minimalist' },
      ],
      debut: [
        { value: 'elegant', label: 'Elegant' },
        { value: 'romantic', label: 'Romantic' },
        { value: 'modern', label: 'Modern' },
        { value: 'classic', label: 'Classic' },
        { value: 'luxury', label: 'Luxury' },
        { value: 'glamorous', label: 'Glamorous' },
        { value: 'garden', label: 'Garden' },
        { value: 'tropical', label: 'Tropical' },
        { value: 'bohemian', label: 'Bohemian' },
        { value: 'vintage', label: 'Vintage' },
      ],
      birthday: [
        { value: 'casual', label: 'Casual' },
        { value: 'modern', label: 'Modern' },
        { value: 'tropical', label: 'Tropical' },
        { value: 'beach', label: 'Beach' },
        { value: 'garden', label: 'Garden' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'elegant', label: 'Elegant' },
        { value: 'luxury', label: 'Luxury' },
        { value: 'minimalist', label: 'Minimalist' },
        { value: 'bohemian', label: 'Bohemian' },
      ],
      pageant: [
        { value: 'glamorous', label: 'Glamorous' },
        { value: 'elegant', label: 'Elegant' },
        { value: 'luxury', label: 'Luxury' },
        { value: 'modern', label: 'Modern' },
        { value: 'classic', label: 'Classic' },
        { value: 'contemporary', label: 'Contemporary' },
        { value: 'minimalist', label: 'Minimalist' },
      ],
      corporate: [
        { value: 'professional', label: 'Professional' },
        { value: 'modern', label: 'Modern' },
        { value: 'contemporary', label: 'Contemporary' },
        { value: 'minimalist', label: 'Minimalist' },
        { value: 'elegant', label: 'Elegant' },
        { value: 'classic', label: 'Classic' },
        { value: 'industrial', label: 'Industrial' },
      ],
      anniversary: [
        { value: 'romantic', label: 'Romantic' },
        { value: 'elegant', label: 'Elegant' },
        { value: 'classic', label: 'Classic' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'luxury', label: 'Luxury' },
        { value: 'garden', label: 'Garden' },
        { value: 'beach', label: 'Beach' },
        { value: 'modern', label: 'Modern' },
      ],
      other: [
        { value: 'elegant', label: 'Elegant' },
        { value: 'modern', label: 'Modern' },
        { value: 'classic', label: 'Classic' },
        { value: 'contemporary', label: 'Contemporary' },
        { value: 'casual', label: 'Casual' },
        { value: 'luxury', label: 'Luxury' },
        { value: 'minimalist', label: 'Minimalist' },
        { value: 'romantic', label: 'Romantic' },
        { value: 'rustic', label: 'Rustic' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'tropical', label: 'Tropical' },
        { value: 'garden', label: 'Garden' },
        { value: 'beach', label: 'Beach' },
      ],
    };

    return allThemes[eventType] || allThemes.other;
  };

  // Format number with commas
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    // Remove all non-digit characters except decimal point
    const numericValue = String(value).replace(/[^\d.]/g, '');
    if (!numericValue) return '';
    // Split by decimal point
    const parts = numericValue.split('.');
    // Format the integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Join back with decimal point
    return parts.join('.');
  };

  // Parse formatted number back to numeric value
  const parseFormattedNumber = (value) => {
    return String(value).replace(/,/g, '');
  };

  const fetchPackage = useCallback(async () => {
    try {
      const response = await api.get(`/packages/${id}`);
      const packageData = response.data.data || response.data;
      
      // Extract theme from description if it exists
      let description = packageData.package_description || packageData.description || '';
      let themeArray = [];
      
      // Handle theme - convert string to array if needed
      if (packageData.theme) {
        // If theme is a string, split by comma; if array, use as is
        themeArray = Array.isArray(packageData.theme)
          ? packageData.theme
          : packageData.theme.split(',').map((t) => t.trim()).filter((t) => t);
      }
      
      // Try to extract theme from description if it's stored there
      if (description.includes('Theme:')) {
        const themeMatch = description.match(/Theme:\s*(.+)/);
        if (themeMatch) {
          const themeString = themeMatch[1].trim();
          // Split theme string and merge with existing themes
          const extractedThemes = themeString.split(',').map((t) => t.trim()).filter((t) => t);
          themeArray = [...new Set([...themeArray, ...extractedThemes])]; // Merge and remove duplicates
          // Remove theme from description to avoid duplication
          description = description.replace(/\n\nTheme:.*$/, '').trim();
        }
      }
      
      // Format price with commas when loading
      const priceValue = packageData.package_price || packageData.price || '';
      const formattedPrice = priceValue ? formatNumberWithCommas(String(priceValue)) : '';
      
      setFormData({
        name: packageData.package_name || packageData.name || '',
        description: description,
        inclusions: packageData.package_inclusions || packageData.inclusions || '',
        price: formattedPrice,
        capacity: packageData.capacity || '',
        venue_id: packageData.venue_id ? String(packageData.venue_id) : '',
        type: packageData.package_category || packageData.type || '',
        theme: themeArray,
        // Convert to boolean properly - handles 1/0, true/false, or null/undefined
        is_featured: Boolean(packageData.is_featured),
      });
      setCurrentImageUrl(packageData.package_image || '');
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('Failed to load package');
      navigate('/admin/packages');
    } finally {
      setLoadingPackage(false);
    }
  }, [id, navigate]);

  const fetchVenues = useCallback(async () => {
    try {
      const response = await api.get('/venues');
      setVenues(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  useEffect(() => {
    fetchPackage();
    fetchVenues();
  }, [fetchPackage, fetchVenues]);

  // Clear invalid themes when event type changes
  useEffect(() => {
    if (formData.type && formData.theme && formData.theme.length > 0) {
      const availableThemes = getThemeOptions(formData.type).map(t => t.value);
      const validThemes = formData.theme.filter(theme => availableThemes.includes(theme));
      if (validThemes.length !== formData.theme.length) {
        setFormData(prev => ({ ...prev, theme: validThemes }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type]);

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
    } else if (name === 'theme' && type === 'checkbox') {
      // Handle theme checkboxes (multiple selection)
      const currentThemes = formData.theme || [];
      if (checked) {
        setFormData({
          ...formData,
          theme: [...currentThemes, value],
        });
      } else {
        setFormData({
          ...formData,
          theme: currentThemes.filter((t) => t !== value),
        });
      }
    } else if (name === 'price') {
      // Format price with commas as user types
      const formattedValue = formatNumberWithCommas(value);
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : (name === 'venue_id' ? String(value) : value),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate price
      const parsedPrice = parseFloat(parseFormattedNumber(formData.price));
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        toast.error('Please enter a valid price');
        setLoading(false);
        return;
      }

      // Prepare description with extra details
      let fullDescription = formData.description;
      // Only append if not already present to avoid duplicates on repeated edits
      if (formData.theme && formData.theme.length > 0) {
        const themesString = Array.isArray(formData.theme) 
          ? formData.theme.join(', ') 
          : formData.theme;
        if (!fullDescription.includes(`Theme: ${themesString}`)) {
          fullDescription += `\n\nTheme: ${themesString}`;
        }
      }

      const data = new FormData();
      data.append('package_name', formData.name);
      data.append('package_description', fullDescription);
      data.append('package_price', parsedPrice);
      data.append('package_category', formData.type);
      if (formData.capacity) data.append('capacity', parseInt(formData.capacity));
      // Only append venue_id if it's not empty, backend expects null or valid ID
      if (formData.venue_id && formData.venue_id !== '') {
        data.append('venue_id', parseInt(formData.venue_id));
      }
      data.append('package_inclusions', formData.inclusions || 'Standard inclusions');
      
      if (imageFile) {
        data.append('package_image', imageFile);
      }
      
      // Since PUT with FormData is tricky in Laravel/PHP (doesn't parse multipart/form-data for PUT requests natively),
      // we use POST with _method=PUT spoofing.
      data.append('_method', 'PUT');

      // Don't set Content-Type header manually - axios will set it automatically with the correct boundary
      await api.post(`/packages/${id}`, data);
      toast.success('Package updated successfully!');
      navigate('/admin/packages');
    } catch (error) {
      console.error('Error updating package:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null)
        || 'Failed to update package';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPackage) {
    return (
      <div className="flex">
        <AdminSidebar />
        <AdminNavbar />
        <main
          className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300 pt-16"
          style={{
            marginLeft: isCollapsed ? '5rem' : '16rem',
            width: isCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 16rem)',
          }}
        >
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <AdminNavbar />
      <main
        className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300 pt-16"
        style={{
          marginLeft: isCollapsed ? '5rem' : '16rem',
          width: isCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 16rem)',
        }}
      >
        <div className="p-4 sm:p-6 lg:p-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 transition-colors duration-300">
            Edit Package
          </h1>
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Package Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Package Image
              </label>
              <div className="space-y-3">
                {currentImageUrl && !imageFile && (
                  <div className="mb-2">
                    <img src={currentImageUrl} alt="Current" className="h-32 w-auto object-cover rounded border border-gray-200 dark:border-gray-600 transition-colors duration-300" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">Current Image</p>
                  </div>
                )}
                {imageFile && (
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded border-2 border-indigo-200 dark:border-indigo-600 transition-colors duration-300" />
                    )}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                        <span className="font-medium">Selected:</span> {imageFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">Upload a new image to replace the current one.</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 transition-colors duration-300"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">Leave blank to keep current image</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Inclusions *
              </label>
              <textarea
                name="inclusions"
                value={formData.inclusions}
                onChange={handleChange}
                required
                rows="4"
                placeholder="List package inclusions..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Price (₱) *
                </label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  inputMode="decimal"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Venue *
                </label>
                {loadingVenues ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="md" />
                  </div>
                ) : venues.length === 0 ? (
                  <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 transition-colors duration-300">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      No venues available.
                    </p>
                  </div>
                ) : (
                  <select
                    name="venue_id"
                    value={formData.venue_id || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                  >
                    <option value="">Select a venue...</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={String(venue.id)}>
                        {venue.name} - {venue.location}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Theme (Select multiple)
                {!formData.type && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    (Select event type first)
                  </span>
                )}
              </label>
              {formData.type ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 transition-colors duration-300">
                    {getThemeOptions(formData.type).map((themeOption) => (
                      <label
                        key={themeOption.value}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded transition-colors duration-200"
                      >
                        <input
                          type="checkbox"
                          name="theme"
                          value={themeOption.value}
                          checked={formData.theme?.includes(themeOption.value) || false}
                          onChange={handleChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 transition-colors duration-300"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                          {themeOption.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.theme && formData.theme.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-300">
                      Selected: {formData.theme.join(', ')}
                    </p>
                  )}
                </>
              ) : (
                <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Please select an event type above to see available themes
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 transition-colors duration-300"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                Featured Package
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 dark:bg-indigo-700 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Package'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/packages')}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditPackage;

