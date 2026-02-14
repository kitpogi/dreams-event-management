import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { LoadingSpinner } from '../../../components/ui';
import { Package, Plus, ArrowLeft, Image, Info, Sparkles, DollarSign, Users, MapPin, Tag, CheckCircle2 } from 'lucide-react';

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
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [secondaryFiles, setSecondaryFiles] = useState([]);
  const [secondaryPreviews, setSecondaryPreviews] = useState([]);
  const [isVenueOpen, setIsVenueOpen] = useState(false);

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

      // Append featured and active status
      data.append('is_featured', formData.is_featured ? '1' : '0');
      data.append('is_active', formData.is_active ? '1' : '0');

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
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[1.25rem] shadow-xl shadow-blue-500/20 transform transition-transform hover:scale-105">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight text-left">
                Create New Package
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Design and launch a premium event experience for your clients
              </p>
            </div>
          </div>
          <Link
            to="/admin/packages"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white shadow-sm dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 hover:text-white transition-all duration-300 font-bold group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Packages
          </Link>
        </div>

        <div className="bg-white/80 dark:bg-[#0b1121]/50 backdrop-blur-xl shadow-2xl rounded-[2rem] border border-gray-200 dark:border-blue-900/30 overflow-hidden transition-all duration-300">
          {/* Form Header */}
          <div className="h-16 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex items-center px-8">
            <div className="flex items-center gap-3 text-gray-900 dark:text-white font-bold text-sm tracking-wider uppercase">
              <Package className="w-5 h-5 text-gray-400" />
              Package Details & Configuration
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                    <Tag className="w-4 h-4 text-gray-400" />
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Royal Wedding Gala"
                    className="w-full px-5 py-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white dark:bg-[#0b1121] text-gray-900 dark:text-white transition-all duration-300 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white dark:bg-[#0b1121] text-gray-900 dark:text-white transition-all duration-300 shadow-sm"
                  >
                    <option value="">Select event type...</option>
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

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                  <Info className="w-4 h-4 text-gray-400" />
                  Package Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Describe the unique value of this package..."
                  className="w-full px-5 py-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white dark:bg-[#0b1121] text-gray-900 dark:text-white transition-all duration-300 shadow-sm resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                  <Image className="w-4 h-4 text-gray-400" />
                  Featured Image
                </label>
                <div className={`relative group border-2 border-dashed rounded-3xl p-8 transition-all duration-300 ${imageFile ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-200 dark:border-gray-700 hover:border-blue-500/30 hover:bg-white/5'}`}>
                  <input
                    type="file"
                    name="image"
                    onChange={handleChange}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {!imageFile ? (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-200">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      {imagePreview && (
                        <div className="relative group/preview">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-48 h-48 object-cover rounded-2xl shadow-2xl border-4 border-white dark:border-gray-800"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white rotate-45" />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 text-center sm:text-left space-y-4">
                        <div className="space-y-1">
                          <p className="text-xl font-black text-blue-600 dark:text-blue-400 truncate max-w-xs mx-auto sm:mx-0">
                            {imageFile.name}
                          </p>
                          <p className="text-sm text-gray-500">Ready to be processed</p>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                          <button
                            type="button"
                            onClick={handleAnalyzeImage}
                            disabled={analyzingImage}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2 active:scale-95"
                          >
                            {analyzingImage ? <LoadingSpinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                            AI Auto-Fill
                          </button>
                          <button
                            type="button"
                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                            className="px-6 py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                  <Plus className="w-4 h-4 text-gray-400" />
                  Additional Gallery Images
                </label>
                <div className="relative group border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-300">
                  <input
                    type="file"
                    name="gallery"
                    onChange={handleChange}
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Browse more photos</p>
                  </div>
                </div>
                {secondaryPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-4">
                    {secondaryPreviews.map((preview) => (
                      <div key={preview.url} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-white dark:border-gray-800">
                        <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  Key Inclusions <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="inclusions"
                  value={formData.inclusions}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="List what's included in this package..."
                  className="w-full px-5 py-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white dark:bg-[#0b1121] text-gray-900 dark:text-white transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    Base Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                      className="w-full pl-10 pr-5 py-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-lg font-black text-gray-900 dark:text-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                    <Users className="w-4 h-4 text-gray-400" />
                    Guest Capacity <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      required
                      min="1"
                      placeholder="0"
                      className="w-full px-5 py-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-lg font-black text-gray-900 dark:text-white transition-all shadow-sm"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm uppercase tracking-widest">Guests</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Primary Venue <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={fetchVenues}
                        disabled={loadingVenues}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors flex items-center gap-1 group/refresh"
                      >
                        <Plus className={`w-3 h-3 transition-transform duration-500 ${loadingVenues ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                        Refresh
                      </button>
                      <Link
                        to="/admin/venues"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add New
                      </Link>
                    </div>
                  </div>
                  {loadingVenues ? (
                    <div className="h-[60px] flex items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsVenueOpen(!isVenueOpen)}
                        className={`w-full px-5 py-4 bg-white dark:bg-[#0b1121] border ${isVenueOpen ? 'border-gray-400 dark:border-white/20 ring-2 ring-gray-400/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl flex items-center justify-between transition-all duration-300 shadow-sm group`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className={`w-5 h-5 ${formData.venue_id ? 'text-gray-400' : 'text-gray-400'}`} />
                          <span className={`${formData.venue_id ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}`}>
                            {formData.venue_id
                              ? venues.find(v => String(v.id) === String(formData.venue_id))?.name || 'Unknown Venue'
                              : 'Choose a venue partner...'}
                          </span>
                        </div>
                        <Plus className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isVenueOpen ? 'rotate-45' : ''}`} />
                      </button>

                      {isVenueOpen && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setIsVenueOpen(false)} />
                          <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-60 overflow-y-auto no-scrollbar">
                              {venues.length === 0 ? (
                                <div className="px-5 py-4 text-center text-gray-500 italic">No venues available</div>
                              ) : (
                                venues.map((venue) => (
                                  <button
                                    key={venue.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData({ ...formData, venue_id: String(venue.id) });
                                      setIsVenueOpen(false);
                                    }}
                                    className={`w-full px-5 py-4 flex flex-col items-start gap-0.5 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0 ${String(formData.venue_id) === String(venue.id) ? 'bg-blue-50/50 dark:bg-blue-600/20' : ''}`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className={`font-bold ${String(formData.venue_id) === String(venue.id) ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {venue.name}
                                      </span>
                                      {String(formData.venue_id) === String(venue.id) && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {venue.location}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                    Visual Themes
                  </label>
                  {!formData.type ? (
                    <div className="h-14 flex items-center justify-center bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 italic text-sm text-gray-400">
                      Select event type to see themes
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="flex flex-wrap gap-2 p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl min-h-[3.5rem] transition-all group-hover:border-blue-500/30">
                        {getThemeOptions(formData.type).map((themeOption) => (
                          <label
                            key={themeOption.value}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all border ${formData.theme?.includes(themeOption.value)
                              ? 'bg-gray-800 dark:bg-white/10 border-gray-700 dark:border-white/20 text-white'
                              : 'bg-white dark:bg-[#0b1121] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                              }`}
                          >
                            <input
                              type="checkbox"
                              name="theme"
                              value={themeOption.value}
                              checked={formData.theme?.includes(themeOption.value) || false}
                              onChange={handleChange}
                              className="hidden"
                            />
                            {themeOption.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Featured & Active Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-blue-600/[0.03] dark:bg-blue-600/[0.03] border border-blue-600/10 rounded-[2.5rem]">
                <div className="flex items-center justify-between bg-white dark:bg-[#0b1121]/50 p-6 rounded-[2rem] border border-gray-100 dark:border-blue-900/20 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-[#0b1121]/80">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Featured
                      </label>
                      <p className="text-xs text-gray-500">Show on homepage</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 focus:outline-none ${formData.is_featured
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <div className={`absolute left-1 flex items-center justify-center w-6 h-6 transform rounded-full bg-white shadow-md transition-all duration-500 ease-spring ${formData.is_featured ? 'translate-x-6 rotate-0' : 'translate-x-0 -rotate-90'}`}>
                      <Sparkles className={`w-3.5 h-3.5 transition-colors duration-500 ${formData.is_featured ? 'text-amber-500' : 'text-gray-300'}`} />
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-[#0b1121]/50 p-6 rounded-[2rem] border border-gray-100 dark:border-blue-900/20 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-[#0b1121]/80">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Live Status
                      </label>
                      <p className="text-xs text-gray-500">Visible to customers</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 focus:outline-none ${formData.is_active
                      ? 'bg-gradient-to-r from-emerald-400 to-green-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <div className={`absolute left-1 flex items-center justify-center w-6 h-6 transform rounded-full bg-white shadow-md transition-all duration-500 ease-spring ${formData.is_active ? 'translate-x-6 scale-100' : 'translate-x-0 scale-90'}`}>
                      <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-4 pt-10 mt-10 border-t border-gray-100 dark:border-blue-900/20">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-12 py-5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-[1.5rem] hover:from-blue-700 hover:to-blue-900 transition-all duration-300 font-black shadow-2xl shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.97] transform hover:-translate-y-1"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                  {loading ? 'Processing...' : 'Deploy Package'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/packages')}
                  className="flex-1 sm:flex-none px-12 py-5 bg-white shadow-sm dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-[1.5rem] hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 font-bold active:scale-[0.97]"
                >
                  Discard Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePackage;

