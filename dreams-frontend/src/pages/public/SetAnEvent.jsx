import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { bookingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { User, Mail, Phone, Calendar, Clock, MapPin, Users, CheckCircle2, AlertCircle, Star, Package, ArrowLeft, ArrowRight, Check, Sparkles, Info, Filter, SortAsc, SortDesc, HelpCircle, MessageCircle } from 'lucide-react';
import { getEventTheme } from '../../constants/eventThemes';
import { validateField, validateForm } from '../../utils/eventFormValidation';
import { formatPhoneNumber, formatBudget, formatPrice, formatMatchScore, getPackageImage } from '../../utils/eventFormFormatting';
import { MOTIFS_OPTIONS, STORAGE_KEY, getMotifsForEventType } from '../../constants/eventFormConstants';
import StepIndicator from '../../components/events/StepIndicator';

const SetAnEvent = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Load saved form data from sessionStorage on mount
  const loadSavedFormData = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
    return null;
  };
  
  // Initialize state with saved data or defaults
  const savedData = loadSavedFormData();
  const [currentStep, setCurrentStep] = useState(savedData?.currentStep || 1);
  const [formData, setFormData] = useState(savedData?.formData || {
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    event_date: '',
    event_time: '',
    venue: '',
    event_type: '',
    motifs: [],
    guest_range: '',
    budget_range: '',
  });
  const [formErrors, setFormErrors] = useState(savedData?.formErrors || {});
  const [touched, setTouched] = useState(savedData?.touched || {});
  const [recommendations, setRecommendations] = useState(savedData?.recommendations || []);
  const [filteredRecommendations, setFilteredRecommendations] = useState(savedData?.filteredRecommendations || []);
  const [selectedPackage, setSelectedPackage] = useState(savedData?.selectedPackage || null);
  const [specialRequests, setSpecialRequests] = useState(savedData?.specialRequests || '');
  const [loading, setLoading] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [sortBy, setSortBy] = useState(savedData?.sortBy || 'match-score'); // 'match-score', 'price-low', 'price-high'
  const [priceFilter, setPriceFilter] = useState(savedData?.priceFilter || 'all'); // 'all', 'within-budget', 'over-budget'
  
  // Get current theme based on event type (after formData is initialized)
  const theme = getEventTheme(formData.event_type);
  const ThemeIcon = theme.icon;
  
  // Get available motifs based on event type
  const availableMotifs = useMemo(() => {
    return getMotifsForEventType(formData.event_type || 'other');
  }, [formData.event_type]);
  
  // Clear invalid motifs when event type changes
  useEffect(() => {
    if (formData.event_type && formData.motifs.length > 0) {
      const validMotifs = formData.motifs.filter(motif => 
        availableMotifs.includes(motif)
      );
      if (validMotifs.length !== formData.motifs.length) {
        setFormData(prev => ({
          ...prev,
          motifs: validMotifs,
        }));
        if (validMotifs.length === 0) {
          setFormErrors(prev => ({
            ...prev,
            motifs: '',
          }));
        }
      }
    }
  }, [formData.event_type, availableMotifs]);
  
  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      const dataToSave = {
        currentStep,
        formData,
        formErrors,
        touched,
        recommendations,
        filteredRecommendations,
        selectedPackage,
        specialRequests,
        sortBy,
        priceFilter,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [currentStep, formData, formErrors, touched, recommendations, filteredRecommendations, selectedPackage, specialRequests, sortBy, priceFilter]);
  
  // Clear saved data after successful booking
  const clearSavedData = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };


  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setFormErrors({ ...formErrors, [name]: error });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'motifs') {
        if (checked) {
          if (formData.motifs.length < 3) {
            setFormData({
              ...formData,
              motifs: [...formData.motifs, value],
            });
            setFormErrors({ ...formErrors, motifs: '' });
          } else {
            toast.warning('You can only select a maximum of 3 motifs');
            e.target.checked = false;
          }
        } else {
          setFormData({
            ...formData,
            motifs: formData.motifs.filter((m) => m !== value),
          });
        }
      }
    } else {
      let processedValue = value;
      
      // Format phone number
      if (name === 'phone_number') {
        processedValue = formatPhoneNumber(value);
      }
      
      // Format budget
      if (name === 'budget_range' && value) {
        processedValue = formatBudget(value);
      }
      
      setFormData({
        ...formData,
        [name]: processedValue,
      });
      
      // Validate on change if field has been touched
      if (touched[name]) {
        const error = validateField(name, processedValue, formData);
        setFormErrors({ ...formErrors, [name]: error });
      }
    }
  };

  const validateFormStep1 = () => {
    const errors = validateForm(formData);
    setFormErrors(errors);
    const allTouched = {
      first_name: true,
      last_name: true,
      email: true,
      phone_number: true,
      event_date: true,
      event_time: true,
      venue: true,
      event_type: true,
      guest_range: true,
      budget_range: true,
      motifs: true,
    };
    setTouched(allTouched);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateFormStep1()) {
      toast.error('Please fix the errors in the form');
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0] || Object.keys(validateForm())[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }
    
    setLoading(true);

    try {
      // Submit to recommendations endpoint with all the data
      const response = await api.post('/recommend', {
        type: formData.event_type || null,
        budget: formData.budget_range ? parseFloat(formData.budget_range.replace(/,/g, '')) : null,
        guests: formData.guest_range ? parseInt(formData.guest_range) : null,
        theme: formData.motifs.join(', ') || null,
        preferences: [],
        // Additional fields for event submission (will save as contact inquiry)
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.replace(/\D/g, ''),
        event_date: formData.event_date,
        event_time: formData.event_time,
        venue: formData.venue.trim(),
      });

      // Store recommendations and move to Step 2
      const recs = response.data.data || [];
      
      // Filter packages to only show those matching the selected event type
      const filteredRecs = formData.event_type 
        ? recs.filter(pkg => {
            const packageCategory = (pkg.category || pkg.package_category || '').toLowerCase();
            const eventType = formData.event_type.toLowerCase();
            return packageCategory === eventType;
          })
        : recs;
      
      setRecommendations(filteredRecs);
      setFilteredRecommendations(filteredRecs);
      setCurrentStep(2);
      
      if (filteredRecs.length === 0) {
        toast.warning('No packages found for your event type. Showing all available packages.');
        setRecommendations(recs);
        setFilteredRecommendations(recs);
      } else {
        toast.success('We found some perfect matches for you!');
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      toast.error(error.response?.data?.message || 'Failed to submit event details');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setCurrentStep(3);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.info('Please login to complete your booking');
      // Save current state before navigating to login
      navigate('/login', { state: { from: '/set-an-event' } });
      return;
    }

    setSubmittingBooking(true);

    try {
      const baseSpecialRequests = `Event Time: ${formData.event_time || 'Not specified'}\nVenue: ${formData.venue || 'Not specified'}\nMotifs: ${formData.motifs.join(', ')}`;
      
      const payload = {
        package_id: selectedPackage.id || selectedPackage.package_id,
        event_date: formData.event_date,
        number_of_guests: parseInt(formData.guest_range),
        special_requests: specialRequests ? `${baseSpecialRequests}\n\nAdditional Requests: ${specialRequests}` : baseSpecialRequests,
      };

      if (formData.event_time) {
        payload.event_time = formData.event_time;
      }

      await bookingService.create(payload);
      
      // Clear saved form data after successful booking
      clearSavedData();
      
      toast.success('Booking created successfully! We will contact you soon.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || 
        (error.response?.data?.errors ? 
          Object.values(error.response.data.errors).flat().join(', ') : 
          'Failed to create booking');
      toast.error(errorMessage);
    } finally {
      setSubmittingBooking(false);
    }
  };


  // Filter and sort recommendations
  useEffect(() => {
    if (recommendations.length === 0) {
      setFilteredRecommendations([]);
      return;
    }

    let filtered = [...recommendations];

    // Apply price filter
    if (priceFilter === 'within-budget' && formData.budget_range) {
      const budget = parseFloat(formData.budget_range.replace(/,/g, ''));
      filtered = filtered.filter(pkg => {
        const price = parseFloat(pkg.price || pkg.package_price || 0);
        return price <= budget;
      });
    } else if (priceFilter === 'over-budget' && formData.budget_range) {
      const budget = parseFloat(formData.budget_range.replace(/,/g, ''));
      filtered = filtered.filter(pkg => {
        const price = parseFloat(pkg.price || pkg.package_price || 0);
        return price > budget && price <= budget * 1.2; // Within 20% over budget
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const scoreA = parseFloat(a.score || a.match_score || 0);
      const scoreB = parseFloat(b.score || b.match_score || 0);
      const priceA = parseFloat(a.price || a.package_price || 0);
      const priceB = parseFloat(b.price || b.package_price || 0);

      switch (sortBy) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'match-score':
        default:
          return scoreB - scoreA; // Higher score first
      }
    });

    setFilteredRecommendations(filtered);
  }, [sortBy, priceFilter, recommendations, formData.budget_range]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-all duration-500`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            {formData.event_type && (
              <div className={`p-3 rounded-full bg-gradient-to-r ${theme.primary} shadow-lg transform transition-all duration-300 hover:scale-110`}>
                <ThemeIcon className="w-8 h-8 text-white" />
              </div>
            )}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              {formData.event_type ? `Plan Your ${theme.name} Event` : 'Set An Event with Us'}
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">
            {formData.event_type 
              ? `Let's create an unforgettable ${theme.name.toLowerCase()} celebration` 
              : 'The small details make the difference'}
          </p>
        </div>

        {/* How to get started section */}
        <StepIndicator currentStep={currentStep} theme={theme} />

        {/* Step 1: Form Section */}
        {currentStep === 1 && (
          <div className="rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center transition-colors duration-300">Step 1: Tell us your vision</h2>
            
            <form onSubmit={handleStep1Submit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 ${theme.primaryLight} rounded-lg transition-all duration-300`}>
                    <User className={`w-5 h-5 ${theme.primaryText} transition-colors duration-300`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      First Name *
                    </label>
                    <div className="relative">
                      <input
                        id="first_name"
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="John"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.first_name && touched.first_name
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {formErrors.first_name && touched.first_name && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.first_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Last Name *
                    </label>
                    <div className="relative">
                      <input
                        id="last_name"
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="Doe"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.last_name && touched.last_name
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {formErrors.last_name && touched.last_name && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.last_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="john.doe@example.com"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.email && touched.email
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {formErrors.email && touched.email && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        id="phone_number"
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="123-456-7890"
                        maxLength={14}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.phone_number && touched.phone_number
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {formErrors.phone_number && touched.phone_number && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.phone_number}</span>
                        </div>
                      )}
                      {!formErrors.phone_number && touched.phone_number && formData.phone_number && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Format: 123-456-7890</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 ${theme.primaryLight} rounded-lg transition-all duration-300`}>
                    <Calendar className={`w-5 h-5 ${theme.primaryText} transition-colors duration-300`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">Event Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Event Date *
                    </label>
                    <div className="relative">
                      <input
                        id="event_date"
                        type="date"
                        name="event_date"
                        value={formData.event_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.event_date && touched.event_date
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {formErrors.event_date && touched.event_date && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.event_date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="event_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Event Time *
                    </label>
                    <div className="relative">
                      <input
                        id="event_time"
                        type="time"
                        name="event_time"
                        value={formData.event_time}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.event_time && touched.event_time
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {formErrors.event_time && touched.event_time && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.event_time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Venue *
                    </label>
                    <div className="relative">
                      <input
                        id="venue"
                        type="text"
                        name="venue"
                        value={formData.venue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="e.g., Grand Ballroom, Garden Venue"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.venue && touched.venue
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {formErrors.venue && touched.venue && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Event Type *
                    </label>
                    <div className="relative">
                      <select
                        id="event_type"
                        name="event_type"
                        value={formData.event_type}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 appearance-none ${
                          formErrors.event_type && touched.event_type
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      >
                        <option value="">Choose Event Type</option>
                        <option value="wedding">Wedding</option>
                        <option value="debut">Debut</option>
                        <option value="birthday">Birthday</option>
                        <option value="pageant">Pageant</option>
                        <option value="corporate">Corporate</option>
                        <option value="anniversary">Anniversary</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      {formErrors.event_type && touched.event_type && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.event_type}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Motifs Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">
                    Select Motifs (Max 3) *
                  </label>
                  {!formData.event_type ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Please select an event type first to see available motifs
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableMotifs.map((motif) => (
                      <label 
                        key={motif} 
                        className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ${
                          formData.motifs.includes(motif)
                            ? `${theme.primaryBorder} ${theme.primaryLight}`
                            : `border-gray-200 dark:border-gray-700 ${theme.primaryBorder.replace('border-', 'hover:border-')}`
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="motifs"
                          value={motif}
                          checked={formData.motifs.includes(motif)}
                          onChange={handleChange}
                          className={`w-4 h-4 ${theme.primaryText} border-gray-300 dark:border-gray-600 rounded ${theme.primaryRing.replace('focus:', 'focus:')} dark:bg-gray-800`}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">{motif}</span>
                        {formData.motifs.includes(motif) && (
                          <CheckCircle2 className={`w-4 h-4 ${theme.primaryText} ml-auto transition-colors duration-300`} />
                        )}
                      </label>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      {formErrors.motifs && touched.motifs && (
                        <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.motifs}</span>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs font-medium transition-colors duration-300 ${
                      formData.motifs.length === 3 
                        ? theme.primaryText
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Selected: {formData.motifs.length}/3
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest and Budget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 ${theme.primaryLight} rounded-lg transition-all duration-300`}>
                    <Users className={`w-5 h-5 ${theme.primaryText} transition-colors duration-300`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">Guest and Budget</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guest_range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Number of Guests *
                    </label>
                    <div className="relative">
                      <input
                        id="guest_range"
                        type="number"
                        name="guest_range"
                        value={formData.guest_range}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        min="1"
                        max="10000"
                        placeholder="50"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.guest_range && touched.guest_range
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {formErrors.guest_range && touched.guest_range && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.guest_range}</span>
                        </div>
                      )}
                      {!formErrors.guest_range && touched.guest_range && formData.guest_range && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Expected number of attendees</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="budget_range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                      Budget Range *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">₱</div>
                      <input
                        id="budget_range"
                        type="text"
                        name="budget_range"
                        value={formData.budget_range}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="100,000"
                        className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          formErrors.budget_range && touched.budget_range
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                            : `border-gray-300 dark:border-gray-600 ${theme.primaryRing}`
                        } dark:bg-gray-800 dark:text-white`}
                      />
                      {formErrors.budget_range && touched.budget_range && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{formErrors.budget_range}</span>
                        </div>
                      )}
                      {!formErrors.budget_range && touched.budget_range && formData.budget_range && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum: ₱1,000</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    * Required fields must be completed
                  </p>
                  <Button
                    type="submit"
                    disabled={loading || formData.motifs.length === 0}
                    className={`w-full sm:w-auto min-w-[200px] bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white py-3 px-8 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Finding Perfect Matches...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Continue to Step 2
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Recommendations Section */}
        {currentStep === 2 && (
          <div>
            <div className="mb-8 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.primaryLight} mb-4 transition-all duration-300`}>
                <Sparkles className={`w-8 h-8 ${theme.primaryText} transition-colors duration-300`} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">Step 2: Discover Perfect Matches</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300 max-w-2xl mx-auto">
                We've found the top packages tailored to your needs. Each package is scored based on how well it matches your preferences.
              </p>
            </div>

            {recommendations.length > 0 ? (
              <>
                {/* Filters and Sort Controls */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-[#e2dbe6] dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
                      </div>
                      <select
                        value={priceFilter}
                        onChange={(e) => setPriceFilter(e.target.value)}
                        className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 ${theme.primaryRing}`}
                      >
                        <option value="all">All Packages</option>
                        <option value="within-budget">Within Budget</option>
                        <option value="over-budget">Slightly Over Budget</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <SortAsc className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</span>
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 ${theme.primaryRing}`}
                      >
                        <option value="match-score">Match Score (High to Low)</option>
                        <option value="price-low">Price (Low to High)</option>
                        <option value="price-high">Price (High to Low)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing <span className={`font-semibold ${theme.primaryText}`}>{filteredRecommendations.length}</span> of <span className="font-semibold">{recommendations.length}</span> {recommendations.length === 1 ? 'package' : 'packages'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Info className="w-4 h-4" />
                      <span>Packages sorted by {sortBy === 'match-score' ? 'match score' : sortBy === 'price-low' ? 'price (low to high)' : 'price (high to low)'}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredRecommendations.map((pkg, index) => {
                    const packageId = pkg.id || pkg.package_id;
                    const packageName = pkg.name || pkg.package_name || 'Package';
                    const packagePrice = pkg.price || pkg.package_price;
                    const matchScore = pkg.score || pkg.match_score || 0;
                    const packageImage = getPackageImage(pkg);
                    const matchPercentage = Math.round(parseFloat(matchScore) * 100);

                    return (
                      <div
                        key={packageId}
                        className="group flex flex-col rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
                      >
                        {/* Badge for top match */}
                        {index === 0 && matchPercentage >= 80 && (
                          <div className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-3 py-1 bg-gradient-to-r ${theme.primary} text-white text-xs font-bold rounded-full shadow-lg`}>
                            <Star className="w-3 h-3 fill-current" />
                            <span>Best Match</span>
                          </div>
                        )}
                        
                        <div className="relative overflow-hidden h-64">
                          {packageImage ? (
                            <img
                              src={packageImage}
                              alt={packageName}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          {!packageImage && (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Package className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                          
                          {/* Match Score Badge */}
                          <div className={`absolute top-4 right-4 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${theme.primary} text-white shadow-xl border-4 border-white dark:border-gray-800`}>
                            <span className="text-xs font-semibold opacity-90">Match</span>
                            <p className="text-2xl font-bold leading-none">{matchPercentage}%</p>
                          </div>
                        </div>
                        
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors duration-300 flex-1">
                              {packageName}
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <p className={`text-2xl font-bold ${theme.primaryText} transition-colors duration-300`}>
                              {formatPrice(packagePrice)}
                            </p>
                          </div>

                          {/* Match Score Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Match Score</span>
                              <span className={`text-xs font-bold ${theme.primaryText}`}>{matchPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${theme.primary} transition-all duration-500 rounded-full`}
                                style={{ width: `${matchPercentage}%` }}
                              />
                            </div>
                          </div>

                          {pkg.capacity && (
                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>Up to {pkg.capacity} guests</span>
                            </div>
                          )}

                          <div className="mt-auto pt-4 space-y-2">
                            <button
                              onClick={() => handlePackageSelect(pkg)}
                              className={`w-full flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white text-base font-bold leading-normal shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105`}
                            >
                              <Package className="w-5 h-5" />
                              <span className="truncate">Select Package</span>
                              <ArrowRight className="w-5 h-5" />
                            </button>
                            <Link
                              to={`/packages/${packageId}`}
                              className={`block w-full text-center text-sm ${theme.primaryText} hover:opacity-80 font-medium transition-colors`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredRecommendations.length === 0 && recommendations.length > 0 && (
                  <div className="rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 p-12 shadow-sm transition-all duration-300 text-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-20 h-20 rounded-full ${theme.primaryLight} flex items-center justify-center mb-4 transition-all duration-300`}>
                        <Filter className={`w-10 h-10 ${theme.primaryText} transition-colors duration-300`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No packages match your filters</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                        Try adjusting your filter options to see more packages.
                      </p>
                      <Button
                        onClick={() => {
                          setPriceFilter('all');
                          setSortBy('match-score');
                        }}
                        variant="outline"
                        className="px-6"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 p-12 shadow-sm transition-all duration-300 hover:shadow-lg text-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No packages found</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                    We couldn't find packages matching your criteria. Contact us to create a custom package tailored to your needs.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/contact-us">
                      <Button className={`bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white px-6`}>
                        Contact Us for Custom Packages
                      </Button>
                    </Link>
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="px-6"
                    >
                      Modify Search Criteria
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Section - Options when user doesn't like the packages */}
            {recommendations.length > 0 && (
              <div className="mt-8 rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${theme.primaryLight} flex-shrink-0`}>
                    <HelpCircle className={`w-6 h-6 ${theme.primaryText}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Not finding what you're looking for?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      We're here to help! Our team can create a custom package tailored specifically to your vision and requirements.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to="/contact-us" state={{ 
                        from: 'set-an-event',
                        // Personal Information
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        mobile_number: formData.phone_number,
                        // Event Details
                        event_type: formData.event_type,
                        date_of_event: formData.event_date,
                        preferred_venue: formData.venue,
                        budget: formData.budget_range ? formData.budget_range.replace(/,/g, '') : '',
                        estimated_guests: formData.guest_range,
                        // Additional info for message
                        motifs: formData.motifs.join(', '),
                        event_time: formData.event_time,
                      }}>
                        <Button className={`bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white px-6 flex items-center gap-2`}>
                          <MessageCircle className="w-4 h-4" />
                          Request Custom Package
                        </Button>
                      </Link>
                      <Link to="/packages">
                        <Button variant="outline" className="px-6 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Browse All Packages
                        </Button>
                      </Link>
                      <Button
                        onClick={() => setCurrentStep(1)}
                        variant="outline"
                        className="px-6 flex items-center gap-2"
                      >
                        <Filter className="w-4 h-4" />
                        Modify Search
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="px-6 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Step 1
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Booking Confirmation Section */}
        {currentStep === 3 && selectedPackage && (
          <div>
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">Step 3: Complete Your Booking</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300 max-w-2xl mx-auto">
                Review your selection and finalize your event booking. We'll contact you soon to confirm the details.
              </p>
            </div>

            <div className="space-y-6">
              {/* Selected Package Card */}
              <div className="rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 ${theme.primaryLight} rounded-lg transition-all duration-300`}>
                    <Package className={`w-6 h-6 ${theme.primaryText} transition-colors duration-300`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 transition-colors duration-300">Selected Package</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Package Name</span>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 transition-colors duration-300">
                        {selectedPackage.name || selectedPackage.package_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-2xl font-bold ${theme.primaryText} transition-colors duration-300`}>
                          {formatPrice(selectedPackage.price || selectedPackage.package_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Match Score</span>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${theme.primary} rounded-full`}
                            style={{ width: `${Math.round(parseFloat(selectedPackage.score || selectedPackage.match_score || 0) * 100)}%` }}
                          />
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">
                          {formatMatchScore(selectedPackage.score || selectedPackage.match_score)}
                        </p>
                      </div>
                    </div>
                    {selectedPackage.capacity && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Max Capacity</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                            {selectedPackage.capacity} Guests
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Details Card */}
              <div className="rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 transition-colors duration-300">Event Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Event Date</span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                        {new Date(formData.event_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Event Time</span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                        {formData.event_time || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Venue</span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                        {formData.venue}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Number of Guests</span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                        {formData.guest_range} {parseInt(formData.guest_range) === 1 ? 'Guest' : 'Guests'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Motifs</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.motifs.map((motif, idx) => (
                          <span 
                            key={idx}
                            className={`px-3 py-1 ${theme.primaryLight} ${theme.primaryText} text-sm font-medium rounded-full border ${theme.primaryBorder}`}
                          >
                            {motif}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests & Actions */}
              <div className="rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
                {isAuthenticated ? (
                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <label className="text-base font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
                          Special Requests (Optional)
                        </label>
                      </div>
                      <textarea
                        name="special_requests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows="5"
                        placeholder="Any additional requirements, special requests, or notes for your event..."
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 ${theme.primaryRing} transition-colors duration-300 resize-none`}
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Let us know if you have any specific requirements or preferences for your event.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="px-6 flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Packages
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingBooking}
                        className={`px-8 py-3 bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none flex items-center gap-2`}
                      >
                        {submittingBooking ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Confirm Booking
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto transition-colors duration-300">
                      Please login to complete your booking, or contact us directly to discuss your event.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      <Button
                        onClick={() => setCurrentStep(2)}
                        variant="outline"
                        className="px-6 flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Packages
                      </Button>
                      <Link to="/login" state={{ from: '/set-an-event' }}>
                        <Button className={`px-6 bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white flex items-center gap-2`}>
                          <User className="w-4 h-4" />
                          Login to Book
                        </Button>
                      </Link>
                      <Link to="/contact-us">
                        <Button className="px-6 bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact Us
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetAnEvent;
