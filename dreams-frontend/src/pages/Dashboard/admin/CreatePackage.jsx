import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { LoadingSpinner } from '../../../components/ui';

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
    theme: [],
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

  // Clear invalid themes when event type changes
  useEffect(() => {
    if (formData.type && formData.theme && formData.theme.length > 0) {
      const availableThemes = getThemeOptions(formData.type).map(t => t.value);
      const validThemes = formData.theme.filter(theme => availableThemes.includes(theme));
      if (validThemes.length !== formData.theme.length) {
        setFormData(prev => ({ ...prev, theme: validThemes }));
      }
    }
  }, [formData.type]);

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

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    setAnalyzingImage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', imageFile);

      // Don't set Content-Type header manually - axios will set it automatically with the correct boundary
      const response = await api.post('/analyze-package-image', formDataToSend);

      if (response.data.success) {
        const extractedData = response.data.data;
        
        // Auto-fill form with extracted data
        // Handle theme - convert string to array if needed
        let themeArray = formData.theme || [];
        if (extractedData.theme) {
          // If theme is a string, split by comma; if array, use as is
          themeArray = Array.isArray(extractedData.theme)
            ? extractedData.theme
            : extractedData.theme.split(',').map((t) => t.trim()).filter((t) => t);
        }
        
        // Format price with commas if extracted
        const priceValue = extractedData.price || formData.price || '';
        const formattedPrice = priceValue ? formatNumberWithCommas(String(priceValue)) : '';
        
        setFormData({
          name: extractedData.name || formData.name,
          description: extractedData.description || formData.description,
          price: formattedPrice,
          capacity: extractedData.capacity || formData.capacity,
          type: extractedData.type || formData.type,
          theme: themeArray,
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
      if (formData.theme && formData.theme.length > 0) {
        const themesString = Array.isArray(formData.theme) 
          ? formData.theme.join(', ') 
          : formData.theme;
        fullDescription += `\n\nTheme: ${themesString}`;
      }
      // Venue is now handled by venue_id field

      const data = new FormData();
      data.append('package_name', formData.name);
      data.append('package_description', fullDescription);
      // Parse formatted price (remove commas) before sending
      data.append('package_price', parseFloat(parseFormattedNumber(formData.price)));
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

      secondaryFiles.forEach((file, index) => {
        data.append(`gallery_images[${index}]`, file);
      });

      // Append is_featured if needed by backend (needs backend support)
      // data.append('is_featured', formData.is_featured ? 1 : 0);

      // Don't set Content-Type header manually - axios will set it automatically with the correct boundary
      await api.post('/packages', data);
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 transition-colors duration-300">
            Create New Package
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
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 transition-colors duration-300"
              />
              
              {imageFile && (
                <div className="mt-4">
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 transition-colors duration-300"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 transition-colors duration-300">
                        <span className="font-medium">Selected:</span> {imageFile.name}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleAnalyzeImage}
                          disabled={analyzingImage}
                          className="bg-purple-600 dark:bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {analyzingImage ? (
                            <>
                              <LoadingSpinner size="sm" />
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
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-300">
                        💡 Click to analyze the image and automatically fill form fields
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Additional Gallery Images
              </label>
              <input
                type="file"
                name="gallery"
                onChange={handleChange}
                accept="image/*"
                multiple
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 transition-colors duration-300"
              />
              {secondaryPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {secondaryPreviews.map((preview) => (
                    <div key={preview.url} className="relative">
                      <img src={preview.url} alt={preview.name} className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-600 transition-colors duration-300" />
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate transition-colors duration-300">{preview.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
                Optional: upload additional images (max {secondaryPreviews.length || 0} selected).
              </p>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    Venue *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchVenues}
                      disabled={loadingVenues}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh venues list"
                    >
                      🔄 Refresh
                    </button>
                    <Link
                      to="/admin/venues"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors duration-300"
                      title="Manage venues"
                    >
                      + Add Venue
                    </Link>
                  </div>
                </div>
                {loadingVenues ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="md" />
                  </div>
                ) : venues.length === 0 ? (
                  <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 transition-colors duration-300">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      No venues available. Please add venues first.
                    </p>
                    <Link
                      to="/admin/venues"
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium hover:underline transition-colors duration-300"
                    >
                      → Go to Manage Venues
                    </Link>
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
                {loading ? 'Creating...' : 'Create Package'}
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
    </div>
  );
};

export default CreatePackage;

