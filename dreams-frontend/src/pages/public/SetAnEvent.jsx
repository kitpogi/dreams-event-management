import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { bookingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Button, LoadingSpinner } from '../../components/ui';
import { User, Mail, Phone, Calendar, Clock, MapPin, Users, CheckCircle2, AlertCircle, Star, Package, ArrowLeft, ArrowRight, Check, Sparkles, Info, Filter, SortAsc, SortDesc, HelpCircle, MessageCircle, ChevronDown } from 'lucide-react';
import { getEventTheme } from '../../constants/eventThemes';
import { validateField, validateForm } from '../../utils/eventFormValidation';
import { formatPhoneNumber, formatBudget, formatPrice, formatMatchScore, getPackageImage } from '../../utils/eventFormFormatting';
import { MOTIFS_OPTIONS, STORAGE_KEY, getMotifsForEventType } from '../../constants/eventFormConstants';
import StepIndicator from '../../components/events/StepIndicator';
import { AnimatedBackground, ParticlesBackground } from '../../components/features';
import { eventThemes } from '../../constants/eventThemes';
import { venueService } from '../../api/services/venueService';

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
  const [fallbackInfo, setFallbackInfo] = useState(savedData?.fallbackInfo || null); // Info about fallback when no exact matches
  const [availableCategories, setAvailableCategories] = useState([]); // Available package categories
  const [isEventTypeOpen, setIsEventTypeOpen] = useState(false);
  const [isVenueOpen, setIsVenueOpen] = useState(false);
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [isCustomVenue, setIsCustomVenue] = useState(false);
  const dropdownRef = React.useRef(null);
  const venueDropdownRef = React.useRef(null);

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

  // Click outside listener for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsEventTypeOpen(false);
      }
      if (venueDropdownRef.current && !venueDropdownRef.current.contains(event.target)) {
        setIsVenueOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await venueService.getAll();
        setVenues(response.data.data || response.data || []);
      } catch (error) {
        console.error('Error fetching venues:', error);
      } finally {
        setLoadingVenues(false);
      }
    };
    fetchVenues();
  }, []);

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
        fallbackInfo,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [currentStep, formData, formErrors, touched, recommendations, filteredRecommendations, selectedPackage, specialRequests, sortBy, priceFilter, fallbackInfo]);

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

  /**
   * Handles Step 1 form submission
   * 
   * Flow:
   * 1. Validates form data
   * 2. Submits to /recommend endpoint (creates contact inquiry automatically)
   * 3. Receives package recommendations
   * 4. Filters by event type if specified
   * 5. Moves to Step 2 (Recommendations)
   * 
   * If no packages found:
   * - Shows all available packages as fallback
   * - User can still proceed or choose alternative options
   */
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
      // Note: This automatically creates a contact inquiry in the backend
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
      const fallbackUsed = response.data.fallback_used || false;
      const exactMatch = response.data.exact_match || false;
      const requestedType = response.data.requested_type || formData.event_type;
      const categories = response.data.available_categories || [];

      // Store fallback info for UI display
      setFallbackInfo({
        fallbackUsed,
        exactMatch,
        requestedType,
        message: response.data.message,
      });
      setAvailableCategories(categories);

      // If using fallback, don't filter - show all recommendations
      // If exact match found, keep all results (they're already filtered by backend)
      setRecommendations(recs);
      setFilteredRecommendations(recs);
      setCurrentStep(2);

      if (fallbackUsed && requestedType) {
        toast.warning(`No ${requestedType} packages available yet. Showing alternative options.`);
      } else if (recs.length === 0) {
        toast.warning('No packages found. Please contact us for custom options.');
      } else if (exactMatch) {
        toast.success('We found some perfect matches for you!');
      } else {
        toast.success('Here are our recommended packages!');
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

      const response = await bookingService.create(payload);
      const bookingData = response.data.data || response.data;
      const bookingId = bookingData.booking_id || bookingData.id;

      // Clear saved form data after successful booking
      clearSavedData();

      toast.success('Booking created successfully! Redirecting to confirmation page...');

      // Navigate to booking confirmation page with payment modal option
      if (bookingId) {
        navigate(`/booking-confirmation/${bookingId}`, {
          state: {
            showPayment: true,
            from: 'set-an-event'
          }
        });
      } else {
        // Fallback to dashboard if booking ID is not available
        navigate('/dashboard');
      }
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
    <div className="bg-[#0a0a1a] min-h-screen relative overflow-hidden flex flex-col w-full pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-50">
          <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
        </div>
        <ParticlesBackground particleCount={15} particleColor="rgba(126, 229, 255, 0.3)" speed={0.03} interactive={false} />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Header - Compact Version */}
        <div className="mb-8 px-4">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-4">
            {formData.event_type ? (
              <div className={`p-3 md:p-4 rounded-2xl bg-gradient-to-br ${theme.primary} shadow-[0_0_30px_rgba(90,69,242,0.3)] transform transition-all duration-500 hover:scale-105 border border-white/20`}>
                <ThemeIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            ) : (
              <div className="p-3 md:p-4 rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10 transform transition-all duration-500 hover:scale-105">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-[#7ee5ff]" />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black text-white leading-tight tracking-tight uppercase mb-1">
                {formData.event_type ? `Plan Your ${theme.name}` : 'Set An Event'}
              </h1>
              <p className="text-base md:text-lg text-gray-400 font-light leading-relaxed">
                {formData.event_type
                  ? `Let's create an unforgettable ${theme.name.toLowerCase()} celebration.`
                  : 'Tell us about your dream celebration.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sidebar Info & Step Indicator */}
          <div className={`lg:col-span-4 space-y-6 lg:sticky lg:top-8 ${currentStep === 2 ? 'lg:hidden' : ''}`}>
            <div className="hidden lg:block">
              <StepIndicator currentStep={currentStep} theme={theme} isSidebar={true} />
            </div>
            <div className="lg:hidden mb-8">
              <StepIndicator currentStep={currentStep} theme={theme} isSidebar={false} />
            </div>

            {/* Context Info Card */}
            <div className="hidden lg:block rounded-2xl border border-white/10 bg-[#0f172a]/40 backdrop-blur-md p-6">
              <h4 className="text-[#7ee5ff] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Tips for Step {currentStep}
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed italic">
                {currentStep === 1
                  ? "Be as specific as possible with your motif and venue to help our AI find the absolute best match for your vision."
                  : currentStep === 2
                    ? "Comparing packages? Look at the 'Match Score' to see which one aligns most closely with your specific requirements."
                    : "Finalize your booking by adding any special requests. Our team will contact you shortly to confirm all details."}
              </p>
            </div>
          </div>

          {/* Right Column: Main Form Area */}
          <div className={currentStep === 2 ? "lg:col-span-12" : "lg:col-span-8"}>

            {/* Step 1: Form Section */}
            {currentStep === 1 && (
              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(90,69,242,0.3)]">
                <div className="flex items-center gap-3 mb-8">
                  <div className={`p-2 rounded-lg ${theme.primary} shadow-lg shadow-blue-500/20`}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Step 1: Your Vision</h2>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-8">
                  {/* Section 1: Personal Information */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${theme.primary} rounded-lg shadow-lg`}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="first_name" className="text-sm font-bold text-gray-400 ml-1">First Name *</label>
                        <div className="relative">
                          <input
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            placeholder="First Name"
                            className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.first_name && touched.first_name ? 'border-red-500/50 focus:ring-red-500/20' : `border-white/10 ${theme.primaryRing}`}`}
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          {formErrors.first_name && touched.first_name && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.first_name}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="last_name" className="text-sm font-bold text-gray-400 ml-1">Last Name *</label>
                        <div className="relative">
                          <input
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            placeholder="Last Name"
                            className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.last_name && touched.last_name ? 'border-red-500/50 focus:ring-red-500/20' : `border-white/10 ${theme.primaryRing}`}`}
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          {formErrors.last_name && touched.last_name && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.last_name}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-bold text-gray-400 ml-1">Email *</label>
                        <div className="relative">
                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            placeholder="Email Address"
                            className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.email && touched.email ? 'border-red-500/50 focus:ring-red-500/20' : `border-white/10 ${theme.primaryRing}`}`}
                          />
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          {formErrors.email && touched.email && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.email}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phone_number" className="text-sm font-bold text-gray-400 ml-1">Phone *</label>
                        <div className="relative">
                          <input
                            id="phone_number"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            placeholder="Phone Number"
                            className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.phone_number && touched.phone_number ? 'border-red-500/50 focus:ring-red-500/20' : `border-white/10 ${theme.primaryRing}`}`}
                          />
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          {formErrors.phone_number && touched.phone_number && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.phone_number}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Event Logistics */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-br ${theme.primary} rounded-lg shadow-lg`}>
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">Time & Venue</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="event_date" className="text-sm font-bold text-gray-400 ml-1">Date *</label>
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
                            className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.event_date && touched.event_date ? 'border-red-500/50 focus:ring-red-500/20' : `border-white/10 ${theme.primaryRing}`}`}
                          />
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          {formErrors.event_date && touched.event_date && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.event_date}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="event_time" className="text-sm font-bold text-gray-400 ml-1">Time *</label>
                        <div className="relative">
                          <input
                            id="event_time"
                            type="time"
                            name="event_time"
                            value={formData.event_time}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.event_time && touched.event_time ? 'border-red-500/50 focus:ring-red-500/20' : `border-white/10 ${theme.primaryRing}`}`}
                          />
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          {formErrors.event_time && touched.event_time && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.event_time}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="venue" className="text-sm font-bold text-gray-400 ml-1">Venue *</label>
                        <div className="relative" ref={venueDropdownRef}>
                          {!isCustomVenue ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setIsVenueOpen(!isVenueOpen)}
                                className={`w-full flex items-center justify-between pl-10 pr-4 py-3 border rounded-xl bg-gray-800/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.venue && touched.venue
                                  ? 'border-red-500 focus:ring-red-500'
                                  : isVenueOpen
                                    ? `border-[#7ee5ff] ring-2 ring-[#7ee5ff]/20`
                                    : `border-white/10 ${theme.primaryRing} focus:border-transparent`
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  {formData.venue ? (
                                    <span className="font-medium">{formData.venue}</span>
                                  ) : (
                                    <span className="text-gray-500 font-medium">Select Partner Venue</span>
                                  )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isVenueOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Venue Dropdown Content */}
                              {isVenueOpen && (
                                <div className="absolute z-[110] mt-2 w-full bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top">
                                  <div className="p-2 max-h-64 overflow-y-auto no-scrollbar">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 mb-1">
                                      Our Partner Venues
                                    </div>
                                    {loadingVenues ? (
                                      <div className="px-4 py-3 text-sm text-gray-500 italic">Loading venues...</div>
                                    ) : venues.length > 0 ? (
                                      venues.map((venue) => (
                                        <button
                                          key={venue.id}
                                          type="button"
                                          onClick={() => {
                                            handleChange({ target: { name: 'venue', value: venue.name } });
                                            setIsVenueOpen(false);
                                          }}
                                          className={`w-full flex flex-col items-start gap-1 px-4 py-3 rounded-lg transition-all duration-300 ${formData.venue === venue.name
                                            ? `bg-white/10 text-white`
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                          <span className={`font-bold ${formData.venue === venue.name ? 'text-[#7ee5ff]' : ''}`}>{venue.name}</span>
                                          <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {venue.location}</span>
                                            <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Up to {venue.capacity}</span>
                                          </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="px-4 py-3 text-sm text-gray-500 italic">No partner venues available</div>
                                    )}

                                    <div className="border-t border-white/5 mt-1 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsCustomVenue(true);
                                          setIsVenueOpen(false);
                                          handleChange({ target: { name: 'venue', value: '' } });
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-300"
                                      >
                                        <div className="p-1.5 rounded-md bg-gray-800">
                                          <MapPin className="w-3.5 h-3.5 text-[#7ee5ff]" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                          <span className="font-bold text-sm">Use Other Venue</span>
                                          <span className="text-[10px] text-gray-500 italic">Click to type custom location</span>
                                        </div>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="relative">
                                <input
                                  id="venue"
                                  type="text"
                                  name="venue"
                                  value={formData.venue}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  required
                                  placeholder="Enter venue name & address"
                                  autoFocus
                                  className={`w-full pl-10 pr-12 py-3 border rounded-xl bg-gray-800/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.venue && touched.venue
                                    ? 'border-red-500 focus:ring-red-500'
                                    : `border-white/10 ${theme.primaryRing} focus:border-transparent`
                                    } placeholder:text-gray-500`}
                                />
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCustomVenue(false);
                                    handleChange({ target: { name: 'venue', value: '' } });
                                  }}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[10px] font-bold text-[#7ee5ff] hover:text-white transition-colors uppercase tracking-widest bg-gray-800 px-2 py-1 rounded-md border border-[#7ee5ff]/30"
                                >
                                  Back
                                </button>
                              </div>
                            </div>
                          )}

                          {!isCustomVenue && <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />}

                          {formErrors.venue && touched.venue && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>{formErrors.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Style & Motifs */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-br ${theme.primary} rounded-lg shadow-lg`}>
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">Style & Motifs</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="event_type" className="text-sm font-bold text-gray-400 ml-1">What are we celebrating? *</label>
                        <div className="relative" ref={dropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsEventTypeOpen(!isEventTypeOpen)}
                            className={`w-full flex items-center justify-between pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.event_type && touched.event_type ? 'border-red-500/50 focus:ring-red-500/20' : isEventTypeOpen ? `border-[#7ee5ff] ring-2 ring-[#7ee5ff]/20` : `border-white/10 ${theme.primaryRing}`}`}
                          >
                            <div className="flex items-center gap-3">
                              {formData.event_type ? (
                                <>
                                  <div className={`p-1.5 rounded-md bg-gradient-to-br ${getEventTheme(formData.event_type).primary}`}>
                                    {React.createElement(getEventTheme(formData.event_type).icon, { className: "w-3.5 h-3.5 text-white" })}
                                  </div>
                                  <span className="font-bold text-sm tracking-wide">{getEventTheme(formData.event_type).name}</span>
                                </>
                              ) : (
                                <span className="text-gray-500 font-medium">Choose Celebration Type</span>
                              )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isEventTypeOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Sparkles className="w-4 h-4 text-gray-500" />
                          </div>

                          {isEventTypeOpen && (
                            <div className="absolute z-[100] mt-2 w-full bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top">
                              <div className="p-2 max-h-60 overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {Object.entries(eventThemes).map(([key, config]) => {
                                  const Icon = config.icon;
                                  const isSelected = formData.event_type === key;
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => {
                                        handleChange({ target: { name: 'event_type', value: key } });
                                        setIsEventTypeOpen(false);
                                      }}
                                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${isSelected ? `bg-white/10 text-white shadow-lg` : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                      <div className={`p-2 rounded-lg ${isSelected ? `bg-gradient-to-br ${config.primary} shadow-lg shadow-${config.primary.split('-')[1]}/20` : 'bg-gray-800'}`}>
                                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                                      </div>
                                      <span className="font-bold text-xs">{config.name}</span>
                                      {isSelected && <Check className="ml-auto w-3 h-3 text-[#7ee5ff]" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        {formErrors.event_type && touched.event_type && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.event_type}</p>}
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-widest text-[10px]">Color Motifs (Select up to 3)</label>
                        {!formData.event_type ? (
                          <div className="p-6 bg-[#0a0a1a]/40 border border-white/5 rounded-xl flex items-center justify-center gap-3 italic text-gray-500 text-xs text-center leading-relaxed">
                            <Info className="w-4 h-4" /> Please select an event type first
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                            {availableMotifs.map((motif) => (
                              <label
                                key={motif}
                                className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all duration-300 ${formData.motifs.includes(motif)
                                  ? `border-transparent bg-gradient-to-br ${theme.primary} shadow-lg scale-[1.02] text-white`
                                  : `border-white/5 bg-white/5 text-gray-400 hover:border-white/10 hover:bg-white/10`
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  name="motifs"
                                  value={motif}
                                  checked={formData.motifs.includes(motif)}
                                  onChange={handleChange}
                                  className="hidden"
                                />
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${formData.motifs.includes(motif) ? 'bg-white/20 border-white/50' : 'bg-black/20 border-white/10'}`}>
                                  {formData.motifs.includes(motif) && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="text-xs font-bold leading-none truncate">{motif}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between px-1">
                          {formErrors.motifs && touched.motifs ? <p className="text-[10px] text-red-500">{formErrors.motifs}</p> : <div />}
                          <p className={`text-[10px] font-black uppercase tracking-widest ${formData.motifs.length === 3 ? 'text-[#7ee5ff]' : 'text-gray-600'}`}>
                            Selected: {formData.motifs.length}/3
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Capacity & Budget */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-br ${theme.primary} rounded-lg shadow-lg`}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">Capacity & Budget</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="guest_range" className="text-sm font-bold text-gray-400 ml-1">Expected Guests *</label>
                        <div className="relative">
                          <input
                            id="guest_range"
                            type="number"
                            name="guest_range"
                            value={formData.guest_range}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            placeholder="e.g. 150"
                            className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.guest_range && touched.guest_range ? 'border-red-500/50 focus:ring-red-500/20' : `border-white/10 ${theme.primaryRing}`}`}
                          />
                          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          {formErrors.guest_range && touched.guest_range && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.guest_range}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="budget_range" className="text-sm font-bold text-gray-400 ml-1">Budget Allocation *</label>
                        <div className="relative">
                          <input
                            id="budget_range"
                            name="budget_range"
                            value={formData.budget_range}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            placeholder="e.g. 500,000"
                            className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-[#0a0a1a]/50 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${formErrors.budget_range && touched.budget_range ? 'border-red-500/50 focus:ring-red-500/20' : `border-white/10 ${theme.primaryRing}`}`}
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-500">₱</div>
                          {formErrors.budget_range && touched.budget_range && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.budget_range}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Info className="w-4 h-4" />
                        <p className="text-xs font-medium">Please ensure all required fields (*) are completed.</p>
                      </div>
                      <Button
                        type="submit"
                        disabled={loading || formData.motifs.length === 0}
                        className={`w-full sm:w-auto min-w-[240px] relative group overflow-hidden bg-gradient-to-r ${theme.primary} text-white py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(90,69,242,0.5)] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3`}
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        {loading ? (
                          <span className="flex items-center gap-3 relative z-10">
                            <LoadingSpinner size="sm" />
                            Analyzing Requirements...
                          </span>
                        ) : (
                          <span className="flex items-center gap-3 relative z-10">
                            Find Perfect Matches
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="max-w-4xl mx-auto mb-16">
                  <StepIndicator currentStep={currentStep} theme={theme} isSidebar={false} />
                </div>

                <div className="mb-12 text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 mb-6 transition-all duration-300 shadow-xl`}>
                    <Sparkles className={`w-10 h-10 ${theme.primaryText} transition-colors duration-300 animate-pulse`} />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4 tracking-tight uppercase">Step 2: Discover Matches</h2>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                    We've curated the following packages based on your unique vision.
                  </p>
                </div>

                {/* Fallback / No Exact Match Banner */}
                {fallbackInfo?.fallbackUsed && fallbackInfo?.requestedType && (
                  <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl p-8 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-all duration-700" />
                    <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                          <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-amber-500 mb-2 uppercase tracking-tight">
                          No {fallbackInfo.requestedType} Packages Available Yet
                        </h3>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                          We don't currently have pre-built packages for <strong className="text-white capitalize">{fallbackInfo.requestedType}</strong>.
                          However, your vision is our priority. Here are your next steps:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Link
                            to="/contact-us"
                            state={{
                              from: 'set-an-event',
                              first_name: formData.first_name,
                              last_name: formData.last_name,
                              email: formData.email,
                              mobile_number: formData.phone_number,
                              event_type: formData.event_type,
                              date_of_event: formData.event_date,
                              preferred_venue: formData.venue,
                              budget: formData.budget_range ? formData.budget_range.replace(/,/g, '') : '',
                              estimated_guests: formData.guest_range,
                              motifs: formData.motifs.join(', '),
                              event_time: formData.event_time,
                              message: `I'm interested in a custom package for my ${formData.event_type} event. My vision involves ${formData.motifs.join(', ')} at ${formData.venue}.`
                            }}
                            className="flex items-start gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all duration-300 group/item"
                          >
                            <div className="p-2 rounded-lg bg-amber-500/10 group-hover/item:bg-amber-500/20 transition-colors">
                              <MessageCircle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm uppercase tracking-wide">Request Customization</p>
                              <p className="text-xs text-gray-500 mt-1">Our team will design a package specifically for you.</p>
                            </div>
                          </Link>
                          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Package className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm uppercase tracking-wide">Explore Alternatives</p>
                              <p className="text-xs text-gray-500 mt-1">Check out our other packages below; they are highly adaptable.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optimization / Help Bar */}
                {recommendations.length > 0 && !fallbackInfo?.fallbackUsed && (
                  <div className="mb-8 rounded-2xl border border-white/5 bg-[#0f172a]/80 backdrop-blur-xl p-5 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl bg-white/5 border border-white/10`}>
                          <HelpCircle className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-white uppercase tracking-tight">Vision not perfectly matched?</p>
                          <p className="text-xs text-gray-500">We can tailor any inclusion to your specific requirements.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-all px-4 py-2"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Modify Search
                        </button>
                        <div className="w-px h-6 bg-white/5" />
                        <Link
                          to="/contact-us"
                          state={{
                            from: 'set-an-event',
                            first_name: formData.first_name,
                            last_name: formData.last_name,
                            email: formData.email,
                            mobile_number: formData.phone_number,
                            event_type: formData.event_type,
                            date_of_event: formData.event_date,
                            preferred_venue: formData.venue,
                            budget: formData.budget_range ? formData.budget_range.replace(/,/g, '') : '',
                            estimated_guests: formData.guest_range,
                            motifs: formData.motifs.join(', '),
                            event_time: formData.event_time,
                            message: `I'd like to discuss custom options for my ${formData.event_type} event. Basic details are provided, but I'm looking for something more specific.`
                          }}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.primary} text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Consult Coordinator
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {recommendations.length > 0 ? (
                  <>
                    {/* Filters and Sort Controls */}
                    <div className="mb-10 bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7ee5ff]/20 to-transparent" />
                      <div className="flex flex-col lg:flex-row gap-8 lg:items-center justify-between relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#7ee5ff]/10">
                              <Filter className="w-4 h-4 text-[#7ee5ff]" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Filter Experience</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={priceFilter}
                              onChange={(e) => setPriceFilter(e.target.value)}
                              className={`w-full sm:w-auto min-w-[180px] px-5 py-3 bg-[#0a0a1a]/50 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 ${theme.primaryRing} cursor-pointer transition-all hover:bg-[#0a0a1a]/80 appearance-none`}
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                            >
                              <option value="all">Display All Plans</option>
                              <option value="within-budget">Within My Budget</option>
                              <option value="over-budget">Next Tier Up</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                              <SortAsc className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Priority Order</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className={`w-full sm:w-auto min-w-[220px] px-5 py-3 bg-[#0a0a1a]/50 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 ${theme.primaryRing} cursor-pointer transition-all hover:bg-[#0a0a1a]/80 appearance-none`}
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                            >
                              <option value="match-score">By Vision Match (Best)</option>
                              <option value="price-low">By Investment (Low-High)</option>
                              <option value="price-high">By Investment (High-Low)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Showcasing <span className="text-white">{filteredRecommendations.length}</span> of <span className="text-white">{recommendations.length}</span> curated results
                        </p>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                          <Info className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Global Currency: PHP</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
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
                            className="group relative flex flex-col rounded-3xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_60px_-15px_rgba(90,69,242,0.4)] hover:-translate-y-4"
                          >
                            {/* Best Match Ribbon */}
                            {index === 0 && matchPercentage >= 80 && (
                              <div className="absolute top-0 right-0 z-20">
                                <div className={`px-8 py-1.5 bg-gradient-to-r ${theme.primary} text-white text-[10px] font-black uppercase tracking-[0.2em] transform rotate-45 translate-x-[2.5rem] translate-y-[0.8rem] shadow-xl`}>
                                  Top Choice
                                </div>
                              </div>
                            )}

                            {/* Image Header */}
                            <div className="relative h-64 overflow-hidden">
                              {packageImage ? (
                                <img
                                  src={packageImage}
                                  alt={packageName}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                  <Package className="w-16 h-16 text-slate-700" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-60" />

                              {/* Floating Price & Match Percentage */}
                              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Invest Now</span>
                                  <p className="text-2xl font-black text-white">{formatPrice(packagePrice)}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse bg-[#7ee5ff]`} />
                                    <span className="text-sm font-black text-white">{matchPercentage}% Match</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Content Middle */}
                            <div className="p-8 flex flex-col flex-grow space-y-6">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-0.5 bg-gradient-to-r ${theme.primary} rounded-full`} />
                                  <span className="text-[10px] font-bold text-[#7ee5ff] uppercase tracking-[0.3em]">Curated Package</span>
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight">{packageName}</h3>
                              </div>

                              {/* Key Features / Quick Stats */}
                              <div className="grid grid-cols-2 gap-3 pb-6 border-b border-white/5">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                  <Users className="w-4 h-4 text-purple-400" />
                                  <span className="text-[10px] font-bold text-gray-500 uppercase">Capacity</span>
                                  <p className="text-xs font-bold text-white tracking-wide">{pkg.capacity || 'Flexible'} Attendees</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                  <Sparkles className="w-4 h-4 text-[#7ee5ff]" />
                                  <span className="text-[10px] font-bold text-gray-500 uppercase">Score</span>
                                  <p className="text-xs font-bold text-white tracking-wide">{matchPercentage}% Alignment</p>
                                </div>
                              </div>

                              {/* Selection Footer */}
                              <div className="mt-auto pt-2 space-y-4">
                                <button
                                  onClick={() => handlePackageSelect(pkg)}
                                  className={`group/btn w-full relative flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-r ${theme.primary} p-[1px] transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-[0_15px_30px_-10px_rgba(90,69,242,0.4)]`}
                                >
                                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                  <span className="relative z-10 text-sm font-black text-white uppercase tracking-widest">Select Plan</span>
                                  <ArrowRight className="relative z-10 w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                                <Link
                                  to={`/packages/${packageId}`}
                                  className="flex items-center justify-center gap-2 text-[10px] font-black text-white/30 hover:text-white uppercase tracking-[0.2em] transition-all"
                                >
                                  Explore Inclusions
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {filteredRecommendations.length === 0 && recommendations.length > 0 && (
                      <div className="rounded-3xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-xl p-16 shadow-2xl text-center transform transition-all duration-500">
                        <div className="flex flex-col items-center">
                          <div className={`w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-xl`}>
                            <Filter className={`w-12 h-12 text-gray-500`} />
                          </div>
                          <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Expansion Needed</h3>
                          <p className="text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
                            No packages met those specific criteria. Try broadening your budget or vision to see more possibilities.
                          </p>
                          <Button
                            onClick={() => {
                              setPriceFilter('all');
                              setSortBy('match-score');
                            }}
                            className={`px-10 py-4 bg-gradient-to-r ${theme.primary} text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-transform hover:scale-105`}
                          >
                            Reset Global Filters
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl p-20 shadow-2xl text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-3xl bg-[#0a0a1a] border border-white/10 flex items-center justify-center mb-10 shadow-2xl">
                        <Package className="w-12 h-12 text-gray-700" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Vision Uncharted</h3>
                      <p className="text-gray-400 mb-4 max-w-lg mx-auto leading-relaxed">
                        We currently don't have a pre-defined plan matching your specific metrics.
                      </p>
                      <p className="text-sm text-gray-600 mb-12 max-w-md mx-auto italic">
                        Rest assured, your inquiry has been logged. A luxury coordinator will contact you to build a completely custom experience.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-2xl">
                        <Link
                          to="/contact-us"
                          state={{
                            from: 'set-an-event',
                            first_name: formData.first_name,
                            last_name: formData.last_name,
                            email: formData.email,
                            mobile_number: formData.phone_number,
                            event_type: formData.event_type,
                            date_of_event: formData.event_date,
                            preferred_venue: formData.venue,
                            budget: formData.budget_range ? formData.budget_range.replace(/,/g, '') : '',
                            estimated_guests: formData.guest_range,
                            motifs: formData.motifs.join(', '),
                            event_time: formData.event_time,
                            message: `I couldn't find a package matching my criteria for a ${formData.event_type} event. I have a budget of ₱${formData.budget_range} for ${formData.guest_range} guests.`
                          }}
                          className="flex-1"
                        >
                          <Button className={`w-full py-5 bg-gradient-to-r ${theme.primary} text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl transition-transform hover:scale-[1.02]`}>
                            <MessageCircle className="w-5 h-5" />
                            Request Custom Design
                          </Button>
                        </Link>
                        <Link to="/packages" className="flex-1">
                          <Button className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                            <Package className="w-5 h-5" />
                            Browse High-Tier Plans
                          </Button>
                        </Link>
                      </div>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="mt-10 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-2 mx-auto"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Refine My Requirement
                      </button>
                    </div>
                  </div>
                )}

                {/* Help Section - Options when user doesn't like the packages */}
                {recommendations.length > 0 && (
                  <div className="mt-16 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl p-10 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-transparent via-[#7ee5ff]/30 to-transparent h-full" />
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                      <div className={`p-5 rounded-2xl bg-[#0a0a1a] border border-white/10 flex-shrink-0 shadow-2xl`}>
                        <HelpCircle className={`w-10 h-10 ${theme.primaryText} animate-pulse`} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">
                          Missing a specific detail?
                        </h3>
                        <p className="text-gray-400 mb-10 max-w-2xl leading-relaxed text-lg font-light">
                          Our packages are frameworks, not boundaries. Our expert coordinators can adapt any inclusion or create a
                          unique concept specifically for your milestone.
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-6">
                          <Link
                            to="/contact-us"
                            state={{
                              from: 'set-an-event',
                              first_name: formData.first_name,
                              last_name: formData.last_name,
                              email: formData.email,
                              mobile_number: formData.phone_number,
                              event_type: formData.event_type,
                              date_of_event: formData.event_date,
                              preferred_venue: formData.venue,
                              budget: formData.budget_range ? formData.budget_range.replace(/,/g, '') : '',
                              estimated_guests: formData.guest_range,
                              motifs: formData.motifs.join(', '),
                              event_time: formData.event_time,
                              message: `I'm interested in personalizing one of your packages for my ${formData.event_type}. Please contact me to discuss how we can adapt your services to my vision.`
                            }}
                          >
                            <Button className={`bg-gradient-to-r ${theme.primary} text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-transform hover:scale-105 shadow-2xl`}>
                              <MessageCircle className="w-5 h-5" />
                              Custom Consultation
                            </Button>
                          </Link>
                          <Link to="/packages">
                            <Button className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-white/10 transition-all shadow-xl">
                              <Package className="w-5 h-5" />
                              View Hierarchy
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-6 mt-12 pt-10 border-t border-white/5">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-3 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-all group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Return to Vision Setup
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Booking Confirmation Section */}
            {currentStep === 3 && selectedPackage && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-500/10 backdrop-blur-md border border-green-500/20 mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4 tracking-tight uppercase">Step 3: Finalize</h2>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                    Review your selections and prepare for an unforgettable celebration.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Selected Package Card */}
                  <div className="rounded-2xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(90,69,242,0.3)]">
                    <div className="flex items-center gap-3 mb-8">
                      <div className={`p-2 bg-gradient-to-br ${theme.primary} rounded-lg shadow-lg shadow-blue-500/20`}>
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">Selected Package</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Package Identity</span>
                          <p className="text-2xl font-black text-white leading-tight">
                            {selectedPackage.name || selectedPackage.package_name}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Financial Investment</span>
                          <p className={`text-3xl font-black ${theme.primaryText}`}>
                            {formatPrice(selectedPackage.price || selectedPackage.package_price)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Vision Alignment</span>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
                              <div
                                className={`h-full bg-gradient-to-r ${theme.primary} rounded-full shadow-[0_0_10px_rgba(90,69,242,0.5)]`}
                                style={{ width: `${Math.round(parseFloat(selectedPackage.score || selectedPackage.match_score || 0) * 100)}%` }}
                              />
                            </div>
                            <p className="text-lg font-black text-white">
                              {formatMatchScore(selectedPackage.score || selectedPackage.match_score)}
                            </p>
                          </div>
                        </div>
                        {selectedPackage.capacity && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Guest Allowance</span>
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-[#7ee5ff]" />
                              <p className="text-lg font-bold text-white">
                                Up to {selectedPackage.capacity} Guests
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Event Details Card */}
                  <div className="rounded-2xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(90,69,242,0.3)]">
                    <div className="flex items-center gap-3 mb-8">
                      <div className={`p-2 bg-gradient-to-br ${theme.primary} rounded-lg shadow-lg shadow-blue-500/20`}>
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">Event Logistics</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="group transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-[#7ee5ff]" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Celebration Date</span>
                          </div>
                          <p className="text-lg font-bold text-white group-hover:text-[#7ee5ff] transition-colors">
                            {new Date(formData.event_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="group transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-[#7ee5ff]" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Scheduled Time</span>
                          </div>
                          <p className="text-lg font-bold text-white group-hover:text-[#7ee5ff] transition-colors">
                            {formData.event_time || 'Not specified'}
                          </p>
                        </div>
                        <div className="group transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-[#7ee5ff]" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Venue Location</span>
                          </div>
                          <p className="text-lg font-bold text-white group-hover:text-[#7ee5ff] transition-colors">
                            {formData.venue}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="group transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-[#7ee5ff]" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Estimated Guests</span>
                          </div>
                          <p className="text-lg font-bold text-white group-hover:text-[#7ee5ff] transition-colors">
                            {formData.guest_range} {parseInt(formData.guest_range) === 1 ? 'Guest' : 'Guests'}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-[#7ee5ff]" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Color Motifs</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.motifs.map((motif, idx) => (
                              <span
                                key={idx}
                                className={`px-4 py-1.5 bg-white/5 text-xs font-black uppercase tracking-widest text-[#7ee5ff] rounded-xl border border-white/10 shadow-lg`}
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
                  <div className="rounded-2xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(90,69,242,0.3)]">
                    {isAuthenticated ? (
                      <form onSubmit={handleBookingSubmit} className="space-y-8">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 bg-gradient-to-br ${theme.primary} rounded-lg`}>
                              <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <label className="text-xl font-bold text-white uppercase tracking-tight">
                              Special Requests
                            </label>
                          </div>
                          <textarea
                            name="special_requests"
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                            rows="4"
                            placeholder="Tell us about any specific requirements, dietary needs, or special touches you'd like to include..."
                            className={`w-full px-6 py-4 border border-white/10 bg-[#0a0a1a]/50 text-white rounded-2xl focus:outline-none focus:ring-2 ${theme.primaryRing} transition-all duration-300 resize-none placeholder:text-gray-600 text-sm leading-relaxed`}
                          />
                          <div className="flex items-center gap-2 mt-3 px-1">
                            <Info className="w-3.5 h-3.5 text-gray-600" />
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                              Our coordinators will review these details immediately.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="group flex items-center gap-3 text-sm font-black text-gray-500 hover:text-white uppercase tracking-widest transition-all"
                          >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Packages
                          </button>
                          <Button
                            type="submit"
                            disabled={submittingBooking}
                            className={`w-full sm:w-auto min-w-[240px] relative group overflow-hidden bg-gradient-to-r ${theme.primary} text-white py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(34,197,94,0.5)] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3`}
                          >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            {submittingBooking ? (
                              <span className="flex items-center gap-3 relative z-10">
                                <LoadingSpinner size="sm" />
                                Processing Order...
                              </span>
                            ) : (
                              <span className="flex items-center gap-3 relative z-10">
                                Confirm Your Booking
                                <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              </span>
                            )}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center mb-16 pt-24">
                        <div className="w-20 h-20 rounded-2xl bg-blue-500/10 backdrop-blur-md border border-blue-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <User className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Login Required</h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                          Please login to complete your booking, or contact us directly to discuss your event.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                          <Button
                            onClick={() => setCurrentStep(2)}
                            variant="outline"
                            className="px-8 py-3 rounded-xl border-white/10 text-white hover:bg-white/5 transition-all flex items-center gap-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Packages
                          </Button>
                          <Link to="/login" state={{ from: '/set-an-event' }} className="w-full sm:w-auto">
                            <Button className={`w-full px-8 py-3 bg-gradient-to-r ${theme.primary} text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2`}>
                              <User className="w-4 h-4" />
                              Login to Book
                            </Button>
                          </Link>
                          <Link to="/contact-us" className="w-full sm:w-auto">
                            <Button className="w-full px-8 py-3 bg-gray-600/20 border border-white/10 text-white rounded-xl font-bold hover:bg-gray-600/30 transition-all flex items-center justify-center gap-2">
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
      </div>
    </div>
  );
};

export default SetAnEvent;
