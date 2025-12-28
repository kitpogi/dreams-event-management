import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { packageService, bookingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Button, FormModal } from '../ui';
import api from '../../api/axios';

const BookingFormModal = ({ isOpen, onClose, packageId: propPackageId, packageData: propPackageData, onSuccess }) => {
  const { packageId: routePackageId } = useParams();
  const { isAuthenticated } = useAuth();
  const [packageData, setPackageData] = useState(propPackageData || null);
  const [formData, setFormData] = useState({
    event_date: '',
    event_time: '',
    number_of_guests: '',
    special_requests: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isDateAvailable, setIsDateAvailable] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);

  const finalPackageId = propPackageId || routePackageId;

  useEffect(() => {
    if (isOpen && finalPackageId && !propPackageData) {
      fetchPackage();
    } else if (propPackageData) {
      setPackageData(propPackageData);
      setLoading(false);
    }
  }, [isOpen, finalPackageId, propPackageData]);

  // Fetch available dates when modal opens
  useEffect(() => {
    if (isOpen && finalPackageId) {
      fetchAvailableDates();
    }
  }, [isOpen, finalPackageId]);

  // Check availability when date changes
  useEffect(() => {
    if (formData.event_date && finalPackageId) {
      checkDateAvailability();
    } else {
      setIsDateAvailable(null);
    }
  }, [formData.event_date, finalPackageId]);

  const fetchPackage = async () => {
    try {
      const response = await packageService.getById(finalPackageId);
      setPackageData(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async () => {
    try {
      const response = await api.get('/bookings/available-dates', {
        params: {
          package_id: finalPackageId,
          months_ahead: 3,
        },
      });
      setAvailableDates(response.data.available_dates || []);
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const checkDateAvailability = async () => {
    if (!formData.event_date || !finalPackageId) return;

    setCheckingAvailability(true);
    try {
      const response = await api.get('/bookings/check-availability', {
        params: {
          package_id: finalPackageId,
          event_date: formData.event_date,
        },
      });
      setIsDateAvailable(response.data.available);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsDateAvailable(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.event_date) newErrors.event_date = 'Event date is required';
    if (!formData.event_time) newErrors.event_time = 'Event time is required';
    if (!formData.number_of_guests || parseInt(formData.number_of_guests, 10) < 1) {
      newErrors.number_of_guests = 'Number of guests must be at least 1';
    }
    if (formData.event_date && isDateAvailable === false) {
      newErrors.event_date = 'This date is not available. Please select another date.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (!isAuthenticated) {
      toast.info('Please login to complete your booking');
      onClose();
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        package_id: finalPackageId,
        event_date: formData.event_date,
        number_of_guests: formData.number_of_guests ? parseInt(formData.number_of_guests, 10) : null,
        special_requests: formData.special_requests || null,
      };

      if (formData.event_time) {
        payload.event_time = formData.event_time;
      }

      await bookingService.create(payload);
      
      toast.success('Booking created successfully!');
      
      // Reset form
      setFormData({
        event_date: '',
        event_time: '',
        number_of_guests: '',
        special_requests: '',
      });
      
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        const mapped = Object.fromEntries(
          Object.entries(apiErrors).map(([key, val]) => [key, Array.isArray(val) ? val.join(', ') : String(val)])
        );
        setErrors((prev) => ({ ...prev, ...mapped }));
      }
      const errorMessage = error.response?.data?.message || 
        (apiErrors ? Object.values(apiErrors).flat().join(', ') : 'Failed to create booking');
      toast.error(errorMessage);
      console.error('Booking error:', error.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FormModal isOpen={isOpen} onClose={onClose} title="Complete Your Booking">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </FormModal>
    );
  }

  if (!packageData) {
    return (
      <FormModal isOpen={isOpen} onClose={onClose} title="Package Not Found">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Package not found</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </FormModal>
    );
  }

  return (
    <FormModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Complete Your Booking - ${packageData.package_name || packageData.name}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Package Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Package Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Package Name:</span>
              <p className="font-medium text-gray-900">{packageData.package_name || packageData.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Price:</span>
              <p className="font-medium text-indigo-600 text-lg">
                ₱{parseFloat(packageData.package_price || packageData.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Max Capacity:</span>
              <p className="font-medium text-gray-900">{packageData.capacity || 'N/A'} Guests</p>
            </div>
            <div>
              <span className="text-gray-500">Venue:</span>
              <p className="font-medium text-gray-900">{packageData.venue?.name || 'Included Venue'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
                Event Date *
              </label>
              <div className="relative">
                <input
                  id="event_date"
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  aria-describedby={errors.event_date ? "event_date_error" : isDateAvailable !== null ? "event_date_status" : undefined}
                  aria-invalid={errors.event_date || isDateAvailable === false ? "true" : "false"}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${
                    isDateAvailable === false ? 'border-red-300' : 
                    isDateAvailable === true ? 'border-green-300' : ''
                  }`}
                />
                {checkingAvailability && (
                  <div className="absolute right-3 top-3" aria-hidden="true">
                    <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {!checkingAvailability && isDateAvailable === true && (
                  <div className="absolute right-3 top-3" aria-hidden="true">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {!checkingAvailability && isDateAvailable === false && (
                  <div className="absolute right-3 top-3" aria-hidden="true">
                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              <div id="event_date_status" className="sr-only" aria-live="polite" aria-atomic="true">
                {checkingAvailability && "Checking availability..."}
                {!checkingAvailability && isDateAvailable === true && "This date is available"}
                {!checkingAvailability && isDateAvailable === false && "This date is not available"}
              </div>
              {errors.event_date && (
                <p id="event_date_error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
                  {errors.event_date}
                </p>
              )}
              {isDateAvailable === false && !errors.event_date && (
                <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
                  This date is already booked. Please choose another date.
                </p>
              )}
              {isDateAvailable === true && !errors.event_date && (
                <p className="mt-1 text-sm text-green-600" aria-live="polite">
                  ✓ This date is available
                </p>
              )}
            </div>

            <div>
              <label htmlFor="event_time" className="block text-sm font-medium text-gray-700 mb-1">
                Event Time *
              </label>
              <input
                id="event_time"
                type="time"
                name="event_time"
                value={formData.event_time}
                onChange={handleChange}
                required
                aria-describedby={errors.event_time ? "event_time_error" : undefined}
                aria-invalid={errors.event_time ? "true" : "false"}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
              {errors.event_time && (
                <p id="event_time_error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
                  {errors.event_time}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="number_of_guests" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Guests *
            </label>
            <input
              id="number_of_guests"
              type="number"
              name="number_of_guests"
              value={formData.number_of_guests}
              onChange={handleChange}
              required
              min="1"
              max={packageData.capacity || undefined}
              aria-describedby={errors.number_of_guests ? "number_of_guests_error" : undefined}
              aria-invalid={errors.number_of_guests ? "true" : "false"}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder={packageData.capacity ? `Max ${packageData.capacity}` : 'Enter number of guests'}
            />
              {errors.number_of_guests && (
                <p id="number_of_guests_error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
                  {errors.number_of_guests}
                </p>
              )}
          </div>

          <div>
            <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests
            </label>
            <textarea
              id="special_requests"
              name="special_requests"
              value={formData.special_requests}
              onChange={handleChange}
              rows="4"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="Any dietary requirements, color themes, or specific instructions..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </form>
      </div>
    </FormModal>
  );
};

export default BookingFormModal;

