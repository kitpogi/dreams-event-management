import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { bookingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Button, Card } from '../../components/ui';

const SetAnEvent = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
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
  const [recommendations, setRecommendations] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const motifsOptions = [
    'Whimsic',
    'Vintage',
    'Civil',
    'Tradition',
    'Micro',
    'Elopeme',
    'Modern',
    'Interfaith',
  ];

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
          } else {
            toast.warning('You can only select a maximum of 3 motifs');
            e.target.checked = false; // Prevent checking
          }
        } else {
          setFormData({
            ...formData,
            motifs: formData.motifs.filter((m) => m !== value),
          });
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit to recommendations endpoint with all the data
      const response = await api.post('/recommend', {
        type: formData.event_type || null,
        budget: formData.budget_range ? parseFloat(formData.budget_range) : null,
        guests: formData.guest_range ? parseInt(formData.guest_range) : null,
        theme: formData.motifs.join(', ') || null,
        preferences: [],
        // Additional fields for event submission (will save as contact inquiry)
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        event_date: formData.event_date,
        event_time: formData.event_time,
        venue: formData.venue,
      });

      // Store recommendations and move to Step 2
      setRecommendations(response.data.data || []);
      setCurrentStep(2);
      toast.success('We found some perfect matches for you!');
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

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `₱${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMatchScore = (score) => {
    if (!score) return '0%';
    const percentage = Math.round(parseFloat(score) * 100);
    return `${percentage}%`;
  };

  const getPackageImage = (pkg) => {
    if (pkg.images && pkg.images.length > 0) {
      return pkg.images[0].image_url;
    }
    if (pkg.package_image) {
      return pkg.package_image;
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EPackage Image%3C/text%3E%3C/svg%3E";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Set An Event with Us</h1>
          <p className="text-lg text-gray-600">The small details make the difference</p>
        </div>

        {/* How to get started section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How to get started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`text-center ${currentStep >= 1 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${currentStep === 1 ? 'bg-amber-600' : currentStep > 1 ? 'bg-green-500' : 'bg-amber-100'}`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Tell us your vision</h3>
              <p className="text-gray-600">Share your event dreams and ideas in our easy form.</p>
            </div>
            <div className={`text-center ${currentStep >= 2 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${currentStep === 2 ? 'bg-amber-600' : currentStep > 2 ? 'bg-green-500' : 'bg-amber-100'}`}>
                <svg className={`w-8 h-8 ${currentStep >= 2 ? 'text-white' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Discover perfect matches</h3>
              <p className="text-gray-600">We'll recommend the top packages tailored to your needs.</p>
            </div>
            <div className={`text-center ${currentStep >= 3 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${currentStep === 3 ? 'bg-amber-600' : currentStep > 3 ? 'bg-green-500' : 'bg-amber-100'}`}>
                <svg className={`w-8 h-8 ${currentStep >= 3 ? 'text-white' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Book with ease</h3>
              <p className="text-gray-600">Choose your package and we'll contact you as soon as possible.</p>
            </div>
          </div>
        </div>

        {/* Step 1: Form Section */}
        {currentStep === 1 && (
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Step 1: Tell us your vision</h2>
            
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      placeholder="First Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      placeholder="Last Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                      placeholder="Phone Number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="event_date"
                        value={formData.event_date}
                        onChange={handleChange}
                        required
                        placeholder="dd/mm/yyyy"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Time *
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        name="event_time"
                        value={formData.event_time}
                        onChange={handleChange}
                        required
                        placeholder="--:--"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue *
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      required
                      placeholder="Reception/Celebration Venue"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type *
                    </label>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                  </div>
                </div>

                {/* Motifs Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Motifs (Max 3) *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {motifsOptions.map((motif) => (
                      <label key={motif} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="motifs"
                          value={motif}
                          checked={formData.motifs.includes(motif)}
                          onChange={handleChange}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">{motif}</span>
                      </label>
                    ))}
                  </div>
                  {formData.motifs.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {formData.motifs.length}/3
                    </p>
                  )}
                </div>
              </div>

              {/* Guest and Budget */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Guest and Budget</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guest Range *
                    </label>
                    <input
                      type="number"
                      name="guest_range"
                      value={formData.guest_range}
                      onChange={handleChange}
                      required
                      min="1"
                      placeholder="Number of guests"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Range *
                    </label>
                    <input
                      type="number"
                      name="budget_range"
                      value={formData.budget_range}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Budget amount (₱)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={loading || formData.motifs.length === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Finding Perfect Matches...' : 'Continue to Step 2'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Step 2: Recommendations Section */}
        {currentStep === 2 && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Discover perfect matches</h2>
              <p className="text-gray-600">We've found the top packages tailored to your needs</p>
            </div>

            {recommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {recommendations.map((pkg) => {
                  const packageId = pkg.id || pkg.package_id;
                  const packageName = pkg.name || pkg.package_name || 'Package';
                  const packagePrice = pkg.price || pkg.package_price;
                  const matchScore = pkg.score || pkg.match_score || 0;
                  const packageImage = getPackageImage(pkg);

                  return (
                    <div
                      key={packageId}
                      className="flex flex-col gap-4 bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1"
                    >
                      <div className="relative">
                        <div
                          className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover bg-gray-200"
                          style={{ backgroundImage: `url("${packageImage}")` }}
                          role="img"
                          aria-label={packageName}
                        />
                        <div className="absolute top-4 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
                          <p className="text-xl font-bold">{formatMatchScore(matchScore)}</p>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-gray-900 text-xl font-bold leading-normal">
                          {packageName}
                        </h3>
                        <p className="text-gray-600 text-base font-normal leading-normal mt-1">
                          {formatPrice(packagePrice)}
                        </p>
                        <div className="mt-auto pt-6">
                          <button
                            onClick={() => handlePackageSelect(pkg)}
                            className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-amber-600 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-amber-700"
                          >
                            <span className="truncate">Select This Package</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12">
                <p className="text-gray-600 mb-4">No packages match your criteria.</p>
                <Link to="/contact-us">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    Contact Us for Custom Packages
                  </Button>
                </Link>
              </Card>
            )}

            <div className="flex justify-center gap-4">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="px-6"
              >
                Back to Step 1
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Booking Confirmation Section */}
        {currentStep === 3 && selectedPackage && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 3: Book with ease</h2>
              <p className="text-gray-600">Review your selection and complete your booking</p>
            </div>

            <Card>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Selected Package</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 text-sm">Package Name:</span>
                      <p className="font-medium text-gray-900">{selectedPackage.name || selectedPackage.package_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Price:</span>
                      <p className="font-medium text-amber-600 text-lg">
                        {formatPrice(selectedPackage.price || selectedPackage.package_price)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Match Score:</span>
                      <p className="font-medium text-gray-900">
                        {formatMatchScore(selectedPackage.score || selectedPackage.match_score)}
                      </p>
                    </div>
                    {selectedPackage.capacity && (
                      <div>
                        <span className="text-gray-500 text-sm">Max Capacity:</span>
                        <p className="font-medium text-gray-900">{selectedPackage.capacity} Guests</p>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 text-sm">Event Date:</span>
                      <p className="font-medium text-gray-900">{formData.event_date}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Event Time:</span>
                      <p className="font-medium text-gray-900">{formData.event_time || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Venue:</span>
                      <p className="font-medium text-gray-900">{formData.venue}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Number of Guests:</span>
                      <p className="font-medium text-gray-900">{formData.guest_range}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-500 text-sm">Motifs:</span>
                      <p className="font-medium text-gray-900">{formData.motifs.join(', ')}</p>
                    </div>
                  </div>
                </div>

                {isAuthenticated ? (
                  <form onSubmit={handleBookingSubmit}>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        name="special_requests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows="4"
                        placeholder="Any additional requirements or special requests..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>

                    <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="px-6"
                      >
                        Back to Packages
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingBooking}
                        className="px-6 bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {submittingBooking ? 'Processing...' : 'Confirm Booking'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">
                      Please login to complete your booking, or contact us directly.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={() => setCurrentStep(2)}
                        variant="outline"
                        className="px-6"
                      >
                        Back to Packages
                      </Button>
                      <Link to="/login" state={{ from: '/set-an-event' }}>
                        <Button className="px-6 bg-amber-600 hover:bg-amber-700 text-white">
                          Login to Book
                        </Button>
                      </Link>
                      <Link to="/contact-us">
                        <Button className="px-6 bg-gray-600 hover:bg-gray-700 text-white">
                          Contact Us
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetAnEvent;
