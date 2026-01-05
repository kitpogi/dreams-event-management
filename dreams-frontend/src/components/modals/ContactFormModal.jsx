import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { Button, FormModal } from '../ui';
import { STORAGE_KEY } from '../../constants/eventFormConstants';

const ContactFormModal = ({ isOpen, onClose, onSuccess, initialData = {} }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    event_type: '',
    date_of_event: '',
    preferred_venue: '',
    budget: '',
    estimated_guests: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Populate form with initialData when modal opens (only once, not after submission)
  useEffect(() => {
    if (isOpen && initialData && Object.keys(initialData).length > 0 && !hasSubmitted) {
      // Build message from available data
      let message = '';
      if (initialData.motifs) {
        message += `Selected Motifs: ${initialData.motifs}\n`;
      }
      if (initialData.event_time) {
        message += `Event Time: ${initialData.event_time}\n`;
      }
      if (initialData.message) {
        message += initialData.message;
      }
      if (message || initialData.from === 'set-an-event') {
        message += '\n\nI would like to request a custom package tailored to my needs.';
      }

      setFormData({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email || '',
        mobile_number: initialData.mobile_number || '',
        event_type: initialData.event_type || '',
        date_of_event: initialData.date_of_event || '',
        preferred_venue: initialData.preferred_venue || '',
        budget: initialData.budget || '',
        estimated_guests: initialData.estimated_guests || '',
        message: message.trim(),
      });
    }
  }, [isOpen, initialData, hasSubmitted]);

  // Reset form and submission state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasSubmitted(false);
      setSubmitSuccess(false);
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!formData.mobile_number) newErrors.mobile_number = 'Mobile number is required';
    if (!formData.event_type) newErrors.event_type = 'Event type is required';
    if (!formData.date_of_event) newErrors.date_of_event = 'Date of event is required';
    if (!formData.preferred_venue) newErrors.preferred_venue = 'Preferred venue is required';
    if (formData.budget === '' || formData.budget === null) {
      newErrors.budget = 'Budget is required';
    } else if (parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Budget must be 0 or more';
    }
    if (!formData.estimated_guests || parseInt(formData.estimated_guests, 10) < 1) {
      newErrors.estimated_guests = 'Estimated guests must be at least 1';
    }
    if (!formData.message) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitSuccess(false);

    try {
      await api.post('/contact', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email,
        mobile_number: formData.mobile_number,
        event_type: formData.event_type,
        date_of_event: formData.date_of_event,
        preferred_venue: formData.preferred_venue,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        estimated_guests: formData.estimated_guests ? parseInt(formData.estimated_guests) : null,
        message: formData.message,
      });

      setSubmitSuccess(true);
      setHasSubmitted(true);
      
      // Clear form data after successful submission
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        mobile_number: '',
        event_type: '',
        date_of_event: '',
        preferred_venue: '',
        budget: '',
        estimated_guests: '',
        message: '',
      });
      setErrors({});

      // Clear SetAnEvent form data from sessionStorage after successful contact submission
      // This prevents the form from persisting after the user has submitted their inquiry
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing SetAnEvent form data:', error);
      }

      // Show success message and close modal after 2 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        const mapped = Object.fromEntries(
          Object.entries(apiErrors).map(([key, val]) => [key, Array.isArray(val) ? val.join(', ') : String(val)])
        );
        setErrors((prev) => ({ ...prev, ...mapped }));
      }
      toast.error(error.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Contact Us"
      size="lg"
    >
      <div className="space-y-6">
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              Thank you for your inquiry! We have received your message and will contact you soon.
            </p>
          </div>
        )}

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
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
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
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
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
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  required
                  placeholder="Mobile Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              {errors.mobile_number && <p className="mt-1 text-sm text-red-600">{errors.mobile_number}</p>}
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {errors.event_type && <p className="mt-1 text-sm text-red-600">{errors.event_type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Event *
                </label>
                <input
                  type="date"
                  name="date_of_event"
                  value={formData.date_of_event}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {errors.date_of_event && <p className="mt-1 text-sm text-red-600">{errors.date_of_event}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Reception/Celebration Venue *
                </label>
                <input
                  type="text"
                  name="preferred_venue"
                  value={formData.preferred_venue}
                  onChange={handleChange}
                  required
                  placeholder="Preferred Venue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {errors.preferred_venue && <p className="mt-1 text-sm text-red-600">{errors.preferred_venue}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget *
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Budget (₱)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Number of Guests *
                </label>
                <input
                  type="number"
                  name="estimated_guests"
                  value={formData.estimated_guests}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="Number of guests"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {errors.estimated_guests && <p className="mt-1 text-sm text-red-600">{errors.estimated_guests}</p>}
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Information / Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Tell us more about your event, special requirements, or any questions you have..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Inquiry'}
            </Button>
          </div>
        </form>
      </div>
    </FormModal>
  );
};

export default ContactFormModal;

