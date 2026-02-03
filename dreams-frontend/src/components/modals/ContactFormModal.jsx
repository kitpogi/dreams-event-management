import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { Button, FormModal } from '../ui';
import { STORAGE_KEY } from '../../constants/eventFormConstants';
import { cn } from '../../lib/utils';

// Debug to verify cn is imported
console.log('Debug: ContactFormModal - cn function is', typeof cn === 'function' ? 'defined' : 'undefined');

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
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [fetchingServices, setFetchingServices] = useState(false);
  const [isCustomPackage, setIsCustomPackage] = useState(false);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      if (!isOpen) return;
      setFetchingServices(true);
      try {
        const response = await api.get('/services');
        setAvailableServices(response.data.data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setFetchingServices(false);
      }
    };
    fetchServices();
  }, [isOpen]);

  // Populate form with initialData when modal opens (only once, not after submission)
  useEffect(() => {
    if (isOpen && initialData && Object.keys(initialData).length > 0 && !hasSubmitted) {
      if (initialData.from === 'set-an-event' || initialData.custom_package) {
        setIsCustomPackage(true);
      }

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

      // We'll handle the "custom package" line dynamically based on selection

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

  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
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
      // Construct final message with selected services
      let finalMessage = formData.message;
      if (isCustomPackage) {
        const selectedTitles = availableServices
          .filter(s => selectedServices.includes(s.id))
          .map(s => s.title);

        if (selectedTitles.length > 0) {
          finalMessage += `\n\n--- Custom Package Request ---\nSelected Services:\n- ${selectedTitles.join('\n- ')}`;
        } else {
          finalMessage += '\n\nI would like to request a custom package tailored to my needs.';
        }
      }

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email,
        mobile_number: formData.mobile_number,
        event_type: formData.event_type,
        date_of_event: formData.date_of_event,
        preferred_venue: formData.preferred_venue,
        budget: formData.budget ? String(formData.budget) : null,
        estimated_guests: formData.estimated_guests ? parseInt(formData.estimated_guests) : null,
        message: finalMessage,
      };

      console.log('Submission Payload:', payload);
      await api.post('/contact', payload);

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
      setSelectedServices([]);
      setErrors({});

      // Clear SetAnEvent form data from sessionStorage after successful contact submission
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
        console.log('Validation Errors:', apiErrors);
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
      <div className="space-y-8">
        {submitSuccess && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
              <p className="text-green-800 dark:text-green-200 font-medium">
                Thank you for your inquiry! We have received your message and will contact you soon.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Personal Info */}
          <section className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-amber-600">person</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
                />
                {errors.first_name && <p className="text-xs text-red-500 font-medium mt-1">{errors.first_name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
                />
                {errors.last_name && <p className="text-xs text-red-500 font-medium mt-1">{errors.last_name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
                />
                {errors.email && <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  required
                  placeholder="0917-123-4567"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
                />
                {errors.mobile_number && <p className="text-xs text-red-500 font-medium mt-1">{errors.mobile_number}</p>}
              </div>
            </div>
          </section>

          {/* Section: Event Info */}
          <section className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-amber-600">event</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Event Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Event Type *</label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
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
                {errors.event_type && <p className="text-xs text-red-500 font-medium mt-1">{errors.event_type}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date of Event *</label>
                <input
                  type="date"
                  name="date_of_event"
                  value={formData.date_of_event}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
                />
                {errors.date_of_event && <p className="text-xs text-red-500 font-medium mt-1">{errors.date_of_event}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preferred Venue *</label>
                <input
                  type="text"
                  name="preferred_venue"
                  value={formData.preferred_venue}
                  onChange={handleChange}
                  required
                  placeholder="Venue Name / Location"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
                />
                {errors.preferred_venue && <p className="text-xs text-red-500 font-medium mt-1">{errors.preferred_venue}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Budget (₱) *</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="50000"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
                  />
                  {errors.budget && <p className="text-xs text-red-500 font-medium mt-1">{errors.budget}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Guests *</label>
                  <input
                    type="number"
                    name="estimated_guests"
                    value={formData.estimated_guests}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="100"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white"
                  />
                  {errors.estimated_guests && <p className="text-xs text-red-500 font-medium mt-1">{errors.estimated_guests}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Custom Package Section */}
          <section className="bg-amber-50/30 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">inventory_2</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Custom Package Request</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isCustomPackage}
                  onChange={(e) => setIsCustomPackage(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Customize</span>
              </label>
            </div>

            {isCustomPackage && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <p className="text-sm text-gray-600 dark:text-gray-400">Select the services you'd like to include in your custom package:</p>
                {fetchingServices ? (
                  <div className="py-4 flex justify-center">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableServices.length > 0 ? (
                      availableServices.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-2 group",
                            selectedServices.includes(service.id)
                              ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/20"
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-800"
                          )}
                        >
                          <span className={cn(
                            "material-symbols-outlined text-2xl transition-colors",
                            selectedServices.includes(service.id) ? "text-white" : "text-amber-600"
                          )}>
                            {service.icon || 'settings'}
                          </span>
                          <span className="text-xs font-bold leading-tight">{service.title}</span>
                          {selectedServices.includes(service.id) && (
                            <div className="absolute top-1 right-1">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="col-span-full text-center text-sm text-gray-500 py-4">No services available to select.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section: Message */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional Information / Special Message *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Tell us more about your dream event..."
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white resize-none"
            />
            {errors.message && <p className="text-xs text-red-500 font-medium mt-1">{errors.message}</p>}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl font-bold border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 transition-all hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Submit Inquiry</span>
                  <span className="material-symbols-outlined text-lg">send</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </FormModal>
  );
};

export default ContactFormModal;

