import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input } from '../../components/ui';
import { PackageComparison } from '../../components/features';
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Users,
  DollarSign,
  Sparkles,
  ChevronRight,
  X,
  Filter,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Palette,
  Heart,
  HelpCircle,
  Search,
  Tag,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';

const Recommendations = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    type: '',
    budget: '',
    guests: '',
    theme: '',
    preferences: '',
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryData, setInquiryData] = useState(null);
  const [filters, setFilters] = useState({
    eventType: '',
    budgetRange: '',
    guests: '',
    sortBy: 'match-score',
  });
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState({});
  const [activeFilters, setActiveFilters] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [savedRecommendations, setSavedRecommendations] = useState([]);

  // Theme suggestions
  const themeSuggestions = ['elegant', 'modern', 'rustic', 'vintage', 'classic', 'romantic', 'minimalist', 'luxury', 'outdoor', 'indoor'];

  // Load saved recommendations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedRecommendations');
      if (saved) {
        setSavedRecommendations(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved recommendations:', error);
    }
  }, []);

  // Save/unsave recommendation
  const handleSaveForLater = (pkg) => {
    try {
      const packageId = pkg.id || pkg.package_id;
      const saved = [...savedRecommendations];
      const index = saved.findIndex(r => (r.id || r.package_id) === packageId);

      if (index > -1) {
        // Remove from saved
        saved.splice(index, 1);
        toast.success('Removed from saved recommendations');
      } else {
        // Add to saved
        saved.push({
          ...pkg,
          savedAt: new Date().toISOString(),
        });
        toast.success('Saved for later! You can view it in your dashboard.');
      }

      setSavedRecommendations(saved);
      localStorage.setItem('savedRecommendations', JSON.stringify(saved));
    } catch (error) {
      console.error('Error saving recommendation:', error);
      toast.error('Failed to save recommendation');
    }
  };

  const isSaved = (pkg) => {
    const packageId = pkg.id || pkg.package_id;
    return savedRecommendations.some(r => (r.id || r.package_id) === packageId);
  };

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if recommendations were passed from SetAnEvent page
  useEffect(() => {
    if (location.state?.recommendations) {
      setRecommendations(location.state.recommendations);
      setSubmitted(true);
      setInquiryData(location.state.inquiryData);
    }
  }, [location.state]);

  // Update active filters display
  useEffect(() => {
    const active = [];
    if (filters.eventType) active.push({ key: 'eventType', label: `Type: ${filters.eventType}`, value: filters.eventType });
    if (filters.budgetRange) active.push({ key: 'budgetRange', label: `Budget: ${filters.budgetRange}`, value: filters.budgetRange });
    if (filters.guests) active.push({ key: 'guests', label: `Guests: ${filters.guests}`, value: filters.guests });
    setActiveFilters(active);
  }, [filters]);

  // Memoized filtered and sorted recommendations for performance
  const filteredRecommendations = useMemo(() => {
    if (recommendations.length === 0) return [];

    let filtered = [...recommendations];

    // Search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(pkg => {
        const name = (pkg.name || pkg.package_name || '').toLowerCase();
        const description = (pkg.description || pkg.package_description || '').toLowerCase();
        const category = (pkg.category || pkg.package_category || '').toLowerCase();
        return name.includes(query) || description.includes(query) || category.includes(query);
      });
    }

    // Filter by event type
    if (filters.eventType) {
      filtered = filtered.filter(pkg => {
        const category = (pkg.category || pkg.package_category || '').toLowerCase();
        return category.includes(filters.eventType.toLowerCase());
      });
    }

    // Filter by budget range
    if (filters.budgetRange) {
      const [min, max] = filters.budgetRange.split('-').map(v => parseFloat(v.replace(/[^0-9.]/g, '')));
      filtered = filtered.filter(pkg => {
        const price = parseFloat(pkg.price || pkg.package_price || 0);
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
      });
    }

    // Filter by guests
    if (filters.guests) {
      const guestCount = parseInt(filters.guests);
      filtered = filtered.filter(pkg => {
        // Assuming packages have a capacity field, adjust as needed
        const capacity = pkg.capacity || pkg.venue?.capacity || 9999;
        return capacity >= guestCount;
      });
    }

    // Sort
    const sorted = [...filtered];
    switch (filters.sortBy) {
      case 'price-low':
        sorted.sort((a, b) => (a.price || a.package_price || 0) - (b.price || b.package_price || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => (b.price || b.package_price || 0) - (a.price || a.package_price || 0));
        break;
      case 'match-score':
      default:
        sorted.sort((a, b) => (b.score || b.match_score || 0) - (a.score || a.match_score || 0));
        break;
    }

    return sorted;
  }, [recommendations, filters, debouncedSearchQuery]);

  // Format number with commas
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    // Remove all non-digit characters
    const numbers = value.toString().replace(/\D/g, '');
    // Add commas for thousands
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Remove commas from number
  const removeCommas = (value) => {
    return value.toString().replace(/,/g, '');
  };

  // Form validation
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'type':
        if (!value) {
          error = 'Event type is required';
        }
        break;
      case 'guests':
        if (!value) {
          error = 'Number of guests is required';
        } else if (parseInt(value) < 1) {
          error = 'Number of guests must be at least 1';
        } else if (parseInt(value) > 10000) {
          error = 'Number of guests cannot exceed 10,000';
        }
        break;
      case 'budget':
        if (value) {
          const numValue = parseFloat(removeCommas(value));
          if (isNaN(numValue) || numValue < 0) {
            error = 'Budget must be a valid positive number';
          }
        }
        break;
      default:
        break;
    }

    return error;
  };

  // Validate entire form
  const validateForm = () => {
    const errors = {};
    errors.type = validateField('type', formData.type);
    errors.guests = validateField('guests', formData.guests);
    errors.budget = validateField('budget', formData.budget);
    setFormErrors(errors);
    return !errors.type && !errors.guests && !errors.budget;
  };

  // Calculate form completion percentage
  const getFormProgress = () => {
    const requiredFields = ['type', 'guests'];
    const optionalFields = ['budget', 'theme', 'preferences'];
    const totalFields = requiredFields.length + optionalFields.length;
    let filledFields = 0;

    requiredFields.forEach(field => {
      if (formData[field]) filledFields++;
    });
    optionalFields.forEach(field => {
      if (formData[field]) filledFields++;
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mark field as touched
    setTouchedFields({ ...touchedFields, [name]: true });

    // Special handling for budget field - format with commas
    if (name === 'budget') {
      const numericValue = removeCommas(value);
      const formattedValue = formatNumberWithCommas(numericValue);
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
      // Validate budget field
      const error = validateField(name, formattedValue);
      setFormErrors({ ...formErrors, [name]: error });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
      // Validate field in real-time
      const error = validateField(name, value);
      setFormErrors({ ...formErrors, [name]: error });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields({ ...touchedFields, [name]: true });
    const error = validateField(name, value);
    setFormErrors({ ...formErrors, [name]: error });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const removeFilter = (filterKey) => {
    setFilters({
      ...filters,
      [filterKey]: '',
    });
  };

  const handleFeedback = async (packageId, feedbackType) => {
    setFeedbackLoading({ ...feedbackLoading, [packageId]: true });
    try {
      // TODO: Implement API endpoint for feedback
      // await api.post(`/api/recommendations/${packageId}/feedback`, { type: feedbackType });
      toast.success(`Thank you for your ${feedbackType === 'up' ? 'positive' : 'feedback'}!`);
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setFeedbackLoading({ ...feedbackLoading, [packageId]: false });
    }
  };

  const handleComparisonToggle = (pkg) => {
    const packageId = pkg.id || pkg.package_id;
    if (selectedForComparison.some(p => (p.id || p.package_id) === packageId)) {
      setSelectedForComparison(selectedForComparison.filter(p => (p.id || p.package_id) !== packageId));
    } else {
      if (selectedForComparison.length >= 3) {
        toast.warning('You can compare up to 3 packages at a time');
        return;
      }
      setSelectedForComparison([...selectedForComparison, pkg]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouchedFields({
      type: true,
      guests: true,
      budget: true,
      theme: true,
      preferences: true,
    });

    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the errors in the form before submitting');
      return;
    }

    setLoading(true);
    setSubmitted(false);

    try {
      const preferencesArray = formData.preferences
        ? formData.preferences.split(',').map(p => p.trim()).filter(p => p)
        : [];

      const response = await api.post('/recommend', {
        type: formData.type || null,
        budget: formData.budget ? parseFloat(removeCommas(formData.budget)) : null,
        guests: formData.guests ? parseInt(formData.guests) : null,
        theme: formData.theme || null,
        preferences: preferencesArray,
      });

      const recs = response.data.data || [];
      setRecommendations(recs);
      setSubmitted(true);

      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error(error.response?.data?.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `₱${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMatchScore = (score) => {
    if (!score) return 0;
    return Math.round(parseFloat(score) * 100);
  };

  const getMatchScoreColor = (score) => {
    const percentage = formatMatchScore(score);
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const parseJustification = (justification) => {
    if (!justification) return [];
    // Parse justification string like "Type match (+40), Within budget (+30)"
    return justification.split(',').map(j => j.trim()).filter(j => j);
  };

  const getPackageImage = (pkg) => {
    if (pkg.images && pkg.images.length > 0) {
      return pkg.images[0].image_url;
    }
    if (pkg.package_image) {
      return pkg.package_image;
    }
    // Fallback placeholder - Simple gray SVG
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EPackage Image%3C/text%3E%3C/svg%3E";
  };

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-gradient-to-b from-[#FFF7F0] via-[#FFF7F0] to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-[calc(100vh-200px)] transition-colors duration-300">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#4338CA] focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div id="main-content" className="flex flex-1 justify-center py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col max-w-7xl w-full flex-1 gap-6 md:gap-10">
          {/* Success Banner - Only show if coming from SetAnEvent */}
          {submitted && location.state?.recommendations && (
            <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:bg-green-900/20 dark:border-green-800 animate-in slide-in-from-top-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-base font-medium text-green-800 dark:text-green-200">Success!</p>
                <p className="text-sm text-green-700 dark:text-green-300">Here are your personalized event packages.</p>
              </div>
            </div>
          )}

          {/* Page Heading */}
          <header className="flex flex-col items-center text-center gap-3 animate-fade-in-up">
            <h1 className="text-[#181611] dark:text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] transition-colors duration-300">
              {submitted ? 'Recommended Packages for You' : 'Get Personalized Recommendations'}
            </h1>
            <p className="text-[#8a7c60] dark:text-gray-300 text-base font-normal leading-normal max-w-2xl transition-colors duration-300">
              {submitted
                ? "Based on your preferences, we've curated a selection of packages that we think you'll love. Explore the options below to find the perfect fit for your special occasion."
                : "Fill out the form below to get personalized package recommendations tailored to your event needs."}
            </p>
          </header>

          {/* Form - Only show if not submitted or if no recommendations from SetAnEvent */}
          {!submitted && (
            <div className="w-full">
              {/* Modern Form Header */}
              <div className="text-center mb-8 animate-fade-in-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] mb-4 shadow-lg animate-pulse-scale">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
                  Create Your Perfect Event
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                  Share a few details and we'll find the perfect packages for you
                </p>
              </div>

              {/* Form Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Progress</span>
                  <span className="text-sm font-bold text-[#4338CA] dark:text-[#6366F1]">{getFormProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-[#4338CA] to-[#6366F1] h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${getFormProgress()}%` }}
                  ></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Event Type - Card Style */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#4338CA]/30 dark:hover:border-[#6366F1]/30">
                      <label htmlFor="event-type-select" className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] shadow-md" aria-hidden="true">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <span>Event Type</span>
                        <span className="text-red-500 text-lg" aria-label="required">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="event-type-select"
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-required="true"
                          aria-invalid={touchedFields.type && formErrors.type ? 'true' : 'false'}
                          aria-describedby={touchedFields.type && formErrors.type ? 'event-type-error' : undefined}
                          className={`w-full appearance-none pl-4 pr-10 py-3.5 border-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4338CA] dark:focus:ring-[#6366F1] transition-all min-h-[48px] touch-manipulation ${touchedFields.type && formErrors.type
                              ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                              : formData.type
                                ? 'border-green-500 dark:border-green-400 bg-white dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                        >
                          <option value="">Select event type...</option>
                          <option value="wedding">Wedding</option>
                          <option value="birthday">Birthday</option>
                          <option value="corporate">Corporate</option>
                          <option value="anniversary">Anniversary</option>
                          <option value="debut">Debut</option>
                          <option value="pageant">Pageant</option>
                          <option value="other">Other</option>
                        </select>
                        {touchedFields.type && formData.type && !formErrors.type && (
                          <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                        {touchedFields.type && formErrors.type && (
                          <AlertCircle className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                        )}
                        <svg
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {touchedFields.type && formErrors.type && (
                        <p id="event-type-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                          <AlertCircle className="w-4 h-4" aria-hidden="true" />
                          {formErrors.type}
                        </p>
                      )}
                    </div>

                    {/* Number of Guests - Card Style */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#4338CA]/30 dark:hover:border-[#6366F1]/30">
                      <label htmlFor="guests-input" className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] shadow-md" aria-hidden="true">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span>Number of Guests</span>
                        <span className="text-red-500 text-lg" aria-label="required">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="guests-input"
                          type="number"
                          name="guests"
                          value={formData.guests}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          min="1"
                          placeholder="e.g., 50, 100, 200"
                          aria-required="true"
                          aria-invalid={touchedFields.guests && formErrors.guests ? 'true' : 'false'}
                          aria-describedby={touchedFields.guests && formErrors.guests ? 'guests-error' : undefined}
                          className={`w-full pl-4 pr-10 py-3.5 border-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] dark:focus:ring-[#6366F1] transition-all min-h-[48px] touch-manipulation ${touchedFields.guests && formErrors.guests
                              ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                              : formData.guests
                                ? 'border-green-500 dark:border-green-400 bg-white dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                        />
                        {touchedFields.guests && formData.guests && !formErrors.guests && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                        {touchedFields.guests && formErrors.guests && (
                          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                        )}
                      </div>
                      {touchedFields.guests && formErrors.guests && (
                        <p id="guests-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                          <AlertCircle className="w-4 h-4" aria-hidden="true" />
                          {formErrors.guests}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Budget - Card Style */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#4338CA]/30 dark:hover:border-[#6366F1]/30">
                      <label htmlFor="budget-input" className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] shadow-md" aria-hidden="true">
                          <span className="text-white font-bold text-lg">₱</span>
                        </div>
                        <span>Budget</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                          <span className="text-gray-500 dark:text-gray-400 font-semibold text-lg">₱</span>
                        </div>
                        <input
                          id="budget-input"
                          type="text"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="e.g., 50,000 or 100,000"
                          inputMode="numeric"
                          aria-label="Budget amount in Philippine Peso"
                          aria-invalid={touchedFields.budget && formErrors.budget ? 'true' : 'false'}
                          aria-describedby={touchedFields.budget && formErrors.budget ? 'budget-error' : 'budget-help'}
                          className={`w-full pl-10 pr-10 py-3.5 border-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] dark:focus:ring-[#6366F1] transition-all min-h-[48px] touch-manipulation ${touchedFields.budget && formErrors.budget
                              ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                              : formData.budget
                                ? 'border-green-500 dark:border-green-400 bg-white dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                        />
                        {touchedFields.budget && formData.budget && !formErrors.budget && (
                          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                        {touchedFields.budget && formErrors.budget && (
                          <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                        )}
                      </div>
                      {touchedFields.budget && formErrors.budget ? (
                        <p id="budget-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                          <AlertCircle className="w-4 h-4" aria-hidden="true" />
                          {formErrors.budget}
                        </p>
                      ) : (
                        <p id="budget-help" className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Numbers will be formatted with commas automatically
                        </p>
                      )}
                    </div>

                    {/* Theme - Card Style */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#4338CA]/30 dark:hover:border-[#6366F1]/30">
                      <label htmlFor="theme-input" className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] shadow-md" aria-hidden="true">
                          <Palette className="w-5 h-5 text-white" />
                        </div>
                        <span>Theme or Style</span>
                      </label>
                      <div className="relative mb-3">
                        <input
                          id="theme-input"
                          type="text"
                          name="theme"
                          value={formData.theme}
                          onChange={handleChange}
                          placeholder="e.g., elegant, modern, rustic, vintage"
                          aria-label="Event theme or style preference"
                          className={`w-full pl-4 pr-4 py-3.5 border-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] dark:focus:ring-[#6366F1] focus:border-[#4338CA] dark:focus:border-[#6366F1] transition-all min-h-[48px] touch-manipulation ${formData.theme
                              ? 'border-[#4338CA] dark:border-[#6366F1] bg-white dark:bg-gray-700'
                              : 'border-gray-200 dark:border-gray-600'
                            }`}
                        />
                      </div>
                      {/* Theme Suggestions */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quick select:</span>
                        {themeSuggestions.map((theme) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, theme });
                              setTouchedFields({ ...touchedFields, theme: true });
                            }}
                            aria-label={`Select ${theme} theme`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 min-h-[36px] touch-manipulation ${formData.theme === theme
                                ? 'bg-[#4338CA] dark:bg-[#6366F1] text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#4338CA]/10 dark:hover:bg-[#6366F1]/20 hover:text-[#4338CA] dark:hover:text-[#6366F1]'
                              }`}
                          >
                            <Tag className="w-3 h-3 inline mr-1" />
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences - Full Width Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#4338CA]/30 dark:hover:border-[#6366F1]/30">
                  <label className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] shadow-md">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <span>Additional Preferences</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="preferences"
                      value={formData.preferences}
                      onChange={handleChange}
                      placeholder="e.g., outdoor venue, photography included, catering service, live music"
                      className={`w-full pl-4 pr-4 py-3.5 border-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] dark:focus:ring-[#6366F1] focus:border-[#4338CA] dark:focus:border-[#6366F1] transition-all ${formData.preferences
                          ? 'border-[#4338CA] dark:border-[#6366F1] bg-white dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-600'
                        }`}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Separate multiple preferences with commas
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.type || !formData.guests || Object.values(formErrors).some(err => err)}
                    aria-label="Submit form to get personalized package recommendations"
                    aria-describedby="submit-help"
                    className="w-full px-8 py-5 bg-gradient-to-r from-[#4338CA] via-[#5B52D5] to-[#6366F1] text-white font-black text-lg rounded-2xl hover:from-[#4338CA]/90 hover:via-[#5B52D5]/90 hover:to-[#6366F1]/90 focus:outline-none focus:ring-4 focus:ring-[#4338CA]/30 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] disabled:transform-none min-h-[56px] md:min-h-[64px] touch-manipulation"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Getting Recommendations...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        <span>Get Personalized Recommendations</span>
                        <ChevronRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                  <p id="submit-help" className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <Info className="w-4 h-4 inline mr-1.5" aria-hidden="true" />
                    Fields marked with <span className="text-red-500 dark:text-red-400 font-bold">*</span> are required
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* Sticky Submit Button for Mobile - Only show when form is visible and scrolled */}
          {!submitted && (
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg p-4 safe-area-inset-bottom">
              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                disabled={loading || !formData.type || !formData.guests || Object.values(formErrors).some(err => err)}
                aria-label="Submit form to get personalized package recommendations"
                className="w-full px-6 py-4 bg-gradient-to-r from-[#4338CA] via-[#5B52D5] to-[#6366F1] text-white font-bold text-base rounded-xl focus:outline-none focus:ring-4 focus:ring-[#4338CA]/30 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg min-h-[48px] touch-manipulation"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Get Recommendations</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Comparison Bar */}
          {selectedForComparison.length > 0 && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 transition-colors duration-300">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors">
                  {selectedForComparison.length} package{selectedForComparison.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <Button
                onClick={() => setShowComparison(true)}
                className="bg-[#4338CA] hover:bg-[#4338CA]/90 dark:bg-[#6366F1] dark:hover:bg-[#6366F1]/90 text-white"
              >
                Compare Packages
              </Button>
              <Button
                onClick={() => setSelectedForComparison([])}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear
              </Button>
            </div>
          )}

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300 transition-colors">Active filters:</span>
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-[#4338CA]/10 dark:bg-[#6366F1]/20 text-[#4338CA] dark:text-[#818CF8] rounded-full text-sm font-medium transition-colors"
                >
                  {filter.label}
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="hover:bg-[#4338CA]/20 dark:hover:bg-[#6366F1]/30 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search Bar - Only show when recommendations are displayed */}
          {submitted && recommendations.length > 0 && (
            <div className="mb-6" role="search" aria-label="Search packages">
              <div className="relative max-w-2xl mx-auto">
                <label htmlFor="package-search" className="sr-only">
                  Search packages by name, description, or category
                </label>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                <input
                  id="package-search"
                  type="search"
                  placeholder="Search packages by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search packages"
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4338CA] dark:focus:ring-[#6366F1] focus:border-[#4338CA] dark:focus:border-[#6366F1] transition-all shadow-sm hover:shadow-md min-h-[48px] touch-manipulation"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Controls - Only show when recommendations are displayed */}
          {submitted && recommendations.length > 0 && (
            <div className="flex flex-col gap-6 py-6 border-y border-[#F3E9DD] dark:border-gray-700 transition-colors">
              {/* Filter Presets */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quick Filters:</span>
                <button
                  onClick={() => setFilters({ ...filters, budgetRange: '1000-5000', eventType: '', guests: '' })}
                  aria-pressed={filters.budgetRange === '1000-5000'}
                  aria-label="Filter packages under 5,000 pesos"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px] touch-manipulation ${filters.budgetRange === '1000-5000'
                      ? 'bg-[#4338CA] dark:bg-[#6366F1] text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#4338CA] dark:hover:bg-[#6366F1] hover:text-white'
                    }`}
                >
                  Under ₱5,000
                </button>
                <button
                  onClick={() => setFilters({ ...filters, budgetRange: '5000-10000', eventType: '', guests: '' })}
                  aria-pressed={filters.budgetRange === '5000-10000'}
                  aria-label="Filter packages between 5,000 and 10,000 pesos"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px] touch-manipulation ${filters.budgetRange === '5000-10000'
                      ? 'bg-[#4338CA] dark:bg-[#6366F1] text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#4338CA] dark:hover:bg-[#6366F1] hover:text-white'
                    }`}
                >
                  ₱5,000 - ₱10,000
                </button>
                <button
                  onClick={() => setFilters({ ...filters, budgetRange: '', eventType: 'wedding', guests: '' })}
                  aria-pressed={filters.eventType === 'wedding'}
                  aria-label="Filter wedding packages"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px] touch-manipulation ${filters.eventType === 'wedding'
                      ? 'bg-[#4338CA] dark:bg-[#6366F1] text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#4338CA] dark:hover:bg-[#6366F1] hover:text-white'
                    }`}
                >
                  Wedding
                </button>
                <button
                  onClick={() => setFilters({ ...filters, budgetRange: '', eventType: '', guests: '50' })}
                  aria-pressed={filters.guests === '50'}
                  aria-label="Filter packages for 50 or more guests"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px] touch-manipulation ${filters.guests === '50'
                      ? 'bg-[#4338CA] dark:bg-[#6366F1] text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#4338CA] dark:hover:bg-[#6366F1] hover:text-white'
                    }`}
                >
                  50+ Guests
                </button>
                {(filters.eventType || filters.budgetRange || filters.guests) && (
                  <button
                    onClick={() => setFilters({ eventType: '', budgetRange: '', guests: '', sortBy: 'match-score' })}
                    aria-label="Clear all filters"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px] touch-manipulation"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative">
                    <select
                      name="eventType"
                      value={filters.eventType}
                      onChange={handleFilterChange}
                      className="w-full md:w-auto appearance-none bg-white dark:bg-gray-800 border border-[#F3E9DD] dark:border-gray-600 rounded-lg py-2.5 pl-3 pr-8 text-[#2D3748] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f2a60d]/50 dark:focus:ring-[#f59e0b]/50 focus:border-[#f2a60d] dark:focus:border-[#f59e0b] transition-all"
                    >
                      <option value="">Event Type</option>
                      <option value="wedding">Wedding</option>
                      <option value="birthday">Birthday</option>
                      <option value="debut">Debut</option>
                      <option value="pageant">Pageant</option>
                      <option value="corporate">Corporate</option>
                      <option value="anniversary">Anniversary</option>
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7c60] dark:text-gray-400 pointer-events-none w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="relative">
                    <select
                      name="budgetRange"
                      value={filters.budgetRange}
                      onChange={handleFilterChange}
                      className="w-full md:w-auto appearance-none bg-white dark:bg-gray-800 border border-[#F3E9DD] dark:border-gray-600 rounded-lg py-2.5 pl-3 pr-8 text-[#2D3748] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f2a60d]/50 dark:focus:ring-[#f59e0b]/50 focus:border-[#f2a60d] dark:focus:border-[#f59e0b] transition-all"
                    >
                      <option value="">Budget Range</option>
                      <option value="1000-3000">₱1,000 - ₱3,000</option>
                      <option value="3000-5000">₱3,000 - ₱5,000</option>
                      <option value="5000-10000">₱5,000 - ₱10,000</option>
                      <option value="10000-999999">₱10,000+</option>
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7c60] dark:text-gray-400 pointer-events-none w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-[#8a7c60] dark:text-gray-300 whitespace-nowrap transition-colors" htmlFor="guests">
                      No. of Guests:
                    </label>
                    <input
                      id="guests"
                      name="guests"
                      type="number"
                      value={filters.guests}
                      onChange={handleFilterChange}
                      placeholder="e.g., 100"
                      className="w-24 bg-white dark:bg-gray-800 border border-[#F3E9DD] dark:border-gray-600 rounded-lg py-2.5 px-3 text-[#2D3748] dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f2a60d]/50 dark:focus:ring-[#f59e0b]/50 focus:border-[#f2a60d] dark:focus:border-[#f59e0b] transition-all"
                    />
                  </div>
                </div>
                <div className="relative self-start md:self-center">
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="w-full md:w-auto appearance-none bg-white dark:bg-gray-800 border border-[#F3E9DD] dark:border-gray-600 rounded-lg py-2.5 pl-3 pr-8 text-[#2D3748] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f2a60d]/50 dark:focus:ring-[#f59e0b]/50 focus:border-[#f2a60d] dark:focus:border-[#f59e0b] transition-all"
                  >
                    <option value="match-score">Sort By: Match Score</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="match-score">Match Score: High to Low</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7c60] dark:text-gray-400 pointer-events-none w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-5 space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations Grid */}
          {submitted && !loading && (
            <>
              {filteredRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {filteredRecommendations.map((pkg, index) => {
                    const packageId = pkg.id || pkg.package_id;
                    const packageName = pkg.name || pkg.package_name || 'Package';
                    const packagePrice = pkg.price || pkg.package_price;
                    const matchScore = pkg.score || pkg.match_score || 0;
                    const packageImage = getPackageImage(pkg);
                    const matchPercentage = formatMatchScore(matchScore);
                    const isSelected = selectedForComparison.some(p => (p.id || p.package_id) === packageId);
                    const justifications = parseJustification(pkg.justification);

                    return (
                      <div
                        key={packageId}
                        className="flex flex-col gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 overflow-hidden transition-all duration-300 hover:shadow-2xl dark:hover:shadow-[#4338CA]/30 hover:-translate-y-2 hover:scale-[1.02] border-2 border-transparent hover:border-[#4338CA]/30 dark:hover:border-[#6366F1]/40 group animate-fade-in-up"
                        style={{
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        {/* Image with Match Score */}
                        <div className="relative overflow-hidden rounded-t-xl">
                          <Link to={`/packages/${packageId}`}>
                            <div
                              className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover cursor-pointer transition-all duration-500 group-hover:scale-110 bg-gray-200 dark:bg-gray-700"
                              role="img"
                              aria-label={packageName}
                            >
                              <img
                                src={packageImage}
                                alt={packageName}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.classList.add('bg-gray-200', 'dark:bg-gray-700');
                                }}
                              />
                              {/* Gradient overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              {/* Quick preview text on hover */}
                              <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg px-4 py-2">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Click to view details</p>
                                </div>
                              </div>
                            </div>
                          </Link>

                          {/* Match Score Badge */}
                          <div className="absolute top-4 right-4">
                            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                              <div className="flex flex-col items-center">
                                <div className="relative w-16 h-16">
                                  <svg className="transform -rotate-90 w-16 h-16">
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="28"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      className="text-gray-200 dark:text-gray-700"
                                    />
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="28"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      strokeDasharray={`${matchPercentage * 1.76} 176`}
                                      className={`${getMatchScoreColor(matchScore)} transition-all duration-500`}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{matchPercentage}%</span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">Match</span>
                              </div>
                            </div>
                          </div>

                          {/* Comparison Checkbox */}
                          <div className="absolute top-4 left-4 z-10">
                            <button
                              onClick={() => handleComparisonToggle(pkg)}
                              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${isSelected
                                  ? 'bg-[#4338CA] dark:bg-[#6366F1] border-[#4338CA] dark:border-[#6366F1] text-white shadow-lg'
                                  : 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-400 hover:border-[#4338CA] dark:hover:border-[#6366F1] hover:bg-white dark:hover:bg-gray-800'
                                }`}
                              title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
                            >
                              {isSelected ? (
                                <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-200" />
                              ) : (
                                <span className="text-xs font-bold group-hover:text-[#4338CA] dark:group-hover:text-[#6366F1] transition-colors">+</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 flex flex-col flex-grow">
                          <Link to={`/packages/${packageId}`}>
                            <h3 className="text-[#181611] dark:text-white text-xl font-bold leading-normal mb-2 group-hover:text-[#4338CA] dark:group-hover:text-[#6366F1] transition-colors duration-300 cursor-pointer">
                              {packageName}
                            </h3>
                          </Link>

                          {/* Justification Badges */}
                          {justifications.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {justifications.slice(0, 2).map((just, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#4338CA]/10 dark:bg-[#6366F1]/20 text-[#4338CA] dark:text-[#818CF8] rounded-md text-xs font-medium transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  {just.split('(')[0].trim()}
                                </span>
                              ))}
                              {justifications.length > 2 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium transition-colors">
                                  +{justifications.length - 2} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Package Info */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[#8a7c60] dark:text-gray-400 text-sm">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold">{formatPrice(packagePrice)}</span>
                            </div>
                            {pkg.capacity && (
                              <div className="flex items-center gap-2 text-[#8a7c60] dark:text-gray-400 text-sm">
                                <Users className="w-4 h-4" />
                                <span>Capacity: {pkg.capacity} guests</span>
                              </div>
                            )}
                          </div>

                          {/* Full Justification Tooltip */}
                          {pkg.justification && (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-[#4338CA] dark:text-[#6366F1] mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed transition-colors">
                                  {pkg.justification}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-auto pt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 transition-colors">
                            {/* Feedback Buttons */}
                            <div className="flex items-center justify-center gap-4 py-2">
                              <button
                                onClick={() => handleFeedback(packageId, 'up')}
                                disabled={feedbackLoading[packageId]}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95"
                                title="This package looks good"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-sm font-medium">Like</span>
                              </button>
                              <button
                                onClick={() => handleFeedback(packageId, 'down')}
                                disabled={feedbackLoading[packageId]}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95"
                                title="Not interested"
                              >
                                <ThumbsDown className="w-4 h-4" />
                                <span className="text-sm font-medium">Dislike</span>
                              </button>
                            </div>

                            {/* Primary Actions */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Link to={`/packages/${packageId}`} className="flex-1">
                                  <button className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#4338CA] dark:bg-[#6366F1] text-white text-sm font-semibold transition-all duration-300 hover:bg-[#4338CA]/90 dark:hover:bg-[#6366F1]/90 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]">
                                    <span>View Details</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </button>
                                </Link>
                                <button
                                  onClick={() => {
                                    // TODO: Open customization request modal
                                    toast.info('Customization request feature coming soon!');
                                  }}
                                  className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#f2a60d] dark:bg-[#f59e0b] text-[#181611] dark:text-white text-sm font-semibold transition-all duration-300 hover:bg-[#f2a60d]/90 dark:hover:bg-[#f59e0b]/90 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <span>Customize</span>
                                </button>
                              </div>
                              {/* Save for Later Button */}
                              <button
                                onClick={() => handleSaveForLater(pkg)}
                                className={`w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 text-sm font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${isSaved(pkg)
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }`}
                                title={isSaved(pkg) ? 'Remove from saved' : 'Save for later'}
                              >
                                {isSaved(pkg) ? (
                                  <>
                                    <BookmarkCheck className="w-4 h-4" />
                                    <span>Saved</span>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark className="w-4 h-4" />
                                    <span>Save for Later</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="max-w-md mx-auto">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#4338CA] dark:bg-[#6366F1] rounded-full flex items-center justify-center">
                        <X className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      No Packages Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      We couldn't find any packages matching your current criteria.
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                      Try adjusting your filters or get in touch for custom package options.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => {
                          setFilters({
                            eventType: '',
                            budgetRange: '',
                            guests: '',
                            sortBy: 'match-score',
                          });
                        }}
                        className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-[#4338CA] dark:border-[#6366F1] text-[#4338CA] dark:text-[#6366F1] rounded-xl font-semibold hover:bg-[#4338CA]/10 dark:hover:bg-[#6366F1]/10 transition-colors"
                      >
                        Clear All Filters
                      </button>
                      <Link to="/contact-us">
                        <button className="px-6 py-3 bg-gradient-to-r from-[#f2a60d] to-[#f59e0b] text-[#181611] dark:text-white rounded-xl font-semibold hover:from-[#f2a60d]/90 hover:to-[#f59e0b]/90 transition-all shadow-lg">
                          Request Custom Package
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons */}
              {filteredRecommendations.length > 0 && (
                <div className="flex justify-center pt-8">
                  <div className="flex flex-col sm:flex-row flex-1 gap-4 max-w-lg justify-center">
                    <Link to="/contact-us" state={{ inquiryData: inquiryData }}>
                      <button className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-[#f2a60d] dark:bg-[#f59e0b] text-[#181611] dark:text-white text-base font-bold leading-normal tracking-[0.015em] grow transition-all hover:scale-105 hover:bg-[#f2a60d]/90 dark:hover:bg-[#f59e0b]/90 shadow-lg dark:shadow-[#f59e0b]/20">
                        <span className="truncate">Contact Us</span>
                      </button>
                    </Link>
                    {isAuthenticated ? (
                      <Link to="/booking">
                        <button className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-[#10B981] dark:bg-[#059669] text-white text-base font-bold leading-normal tracking-[0.015em] grow transition-all hover:scale-105 hover:bg-[#10B981]/90 dark:hover:bg-[#059669]/90 shadow-lg dark:shadow-[#10B981]/20">
                          <span className="truncate">Book Now</span>
                        </button>
                      </Link>
                    ) : (
                      <Link to="/login" state={{ from: '/recommendations' }}>
                        <button className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-[#10B981] dark:bg-[#059669] text-white text-base font-bold leading-normal tracking-[0.015em] grow transition-all hover:scale-105 hover:bg-[#10B981]/90 dark:hover:bg-[#059669]/90 shadow-lg dark:shadow-[#10B981]/20">
                          <span className="truncate">Book Now</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <PackageComparison
        packages={selectedForComparison}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        onRemove={(packageId) => {
          setSelectedForComparison(selectedForComparison.filter(p => (p.id || p.package_id) !== packageId));
        }}
      />
    </div>
  );
}

export default Recommendations;

