import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { Button, Card } from '../../components/ui';

const SetAnEvent = () => {
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit to recommendations endpoint with all the data
      // This will both get recommendations AND save as contact inquiry
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

      // Navigate to recommendations page with the results
      navigate('/recommendations', { 
        state: { 
          recommendations: response.data.data || [],
          formData: formData,
          fromSetAnEvent: true
        } 
      });
    } catch (error) {
      console.error('Error submitting event:', error);
      toast.error(error.response?.data?.message || 'Failed to submit event details');
    } finally {
      setLoading(false);
    }
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
            <div className="text-center">
              <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Tell us your vision</h3>
              <p className="text-gray-600">Share your event dreams and ideas in our easy form.</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Discover perfect matches</h3>
              <p className="text-gray-600">We'll recommend the top packages tailored to your needs.</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Book with ease</h3>
              <p className="text-gray-600">Choose your package and we'll contact you as soon as possible.</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Step 1: Tell us your vision</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                {loading ? 'Submitting...' : 'Submit Event Details'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SetAnEvent;

