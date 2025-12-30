import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { packageService, bookingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Button, FormModal } from '../ui';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/Input';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Calendar, Clock, Users, FileText, Package, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';

const BookingFormModal = ({ isOpen, onClose, packageId: propPackageId, packageData: propPackageData, onSuccess }) => {
  const { packageId: routePackageId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packageData, setPackageData] = useState(propPackageData || null);
  const [formData, setFormData] = useState({
    event_date: null, // Changed to Date object for DatePicker
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

  // Convert Date object to string format for API
  const formatDateForAPI = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  };

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
      // Silently fail - availability checking is optional
      // The user can still proceed with booking
      setAvailableDates([]);
    }
  };

  const checkDateAvailability = async () => {
    if (!formData.event_date || !finalPackageId) return;

    setCheckingAvailability(true);
    try {
      const dateString = formatDateForAPI(formData.event_date);
      const response = await api.get('/bookings/check-availability', {
        params: {
          package_id: finalPackageId,
          event_date: dateString,
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

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      event_date: date,
    });
    setErrors((prev) => ({ ...prev, event_date: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    } else if (formData.event_date instanceof Date && formData.event_date < new Date()) {
      newErrors.event_date = 'Event date must be in the future';
    }
    if (!formData.event_time) newErrors.event_time = 'Event time is required';
    if (!formData.number_of_guests || parseInt(formData.number_of_guests, 10) < 1) {
      newErrors.number_of_guests = 'Number of guests must be at least 1';
    }
    if (packageData?.capacity && parseInt(formData.number_of_guests, 10) > packageData.capacity) {
      newErrors.number_of_guests = `Maximum capacity is ${packageData.capacity} guests`;
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
        event_date: formatDateForAPI(formData.event_date),
        number_of_guests: formData.number_of_guests ? parseInt(formData.number_of_guests, 10) : null,
        special_requests: formData.special_requests || null,
      };

      if (formData.event_time) {
        payload.event_time = formData.event_time;
      }

      const response = await bookingService.create(payload);
      const bookingData = response.data.data || response.data;
      const bookingId = bookingData.booking_id || bookingData.id;
      
      toast.success('Booking created successfully!');
      
      // Reset form
      setFormData({
        event_date: null,
        event_time: '',
        number_of_guests: '',
        special_requests: '',
      });
      
      onClose();
      
      // Navigate to confirmation page if booking ID is available
      if (bookingId) {
        navigate(`/booking-confirmation/${bookingId}`);
      } else if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
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

  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <FormModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title=""
      size="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Main Form Content */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#a413ec] to-[#7c3aed] bg-clip-text text-transparent mb-2">
              Complete Your Booking
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {packageData?.package_name || packageData?.name || 'Package'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Date & Time Section */}
            <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-900/20 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a413ec] to-[#7c3aed] flex items-center justify-center shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Event Date & Time</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Select when your event will take place</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    label="Event Date *"
                    value={formData.event_date}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    placeholder="Select event date"
                    error={errors.event_date}
                    description="Choose a date for your event"
                    dateFormat="PPP"
                    className="w-full"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    {checkingAvailability && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#a413ec] border-t-transparent"></div>
                        <span>Checking availability...</span>
                      </div>
                    )}
                    {!checkingAvailability && isDateAvailable === true && formData.event_date && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>This date is available</span>
                      </div>
                    )}
                    {!checkingAvailability && isDateAvailable === false && formData.event_date && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <span>This date is not available</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <TimePicker
                    label="Event Time *"
                    value={formData.event_time}
                    onChange={(time) => {
                      setFormData({ ...formData, event_time: time });
                      setErrors((prev) => ({ ...prev, event_time: null }));
                    }}
                    error={errors.event_time}
                    description="Select the start time"
                    minTime="06:00"
                    maxTime="23:00"
                    step={30}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Guest Information Section */}
            <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Guest Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tell us how many guests will attend</p>
                </div>
              </div>

              <div>
                <Label htmlFor="number_of_guests" className="text-base font-medium mb-3 block">
                  Number of Guests *
                </Label>
                <div className="relative">
                  <Input
                    id="number_of_guests"
                    type="number"
                    name="number_of_guests"
                    value={formData.number_of_guests}
                    onChange={handleChange}
                    min="1"
                    max={packageData?.capacity || undefined}
                    placeholder={packageData?.capacity ? `Max ${packageData.capacity}` : 'Enter number of guests'}
                    className={`text-lg h-14 pl-12 ${errors.number_of_guests ? 'border-red-300 dark:border-red-700' : ''}`}
                  />
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.number_of_guests && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.number_of_guests}
                  </p>
                )}
                {packageData?.capacity && !errors.number_of_guests && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Maximum capacity: <strong>{packageData.capacity}</strong> guests</span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests Section */}
            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/20 dark:to-orange-900/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Special Requests</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Any additional details or requirements?</p>
                </div>
              </div>

              <div>
                <Label htmlFor="special_requests" className="text-base font-medium mb-3 block">
                  Additional Information <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </Label>
                <Textarea
                  id="special_requests"
                  name="special_requests"
                  value={formData.special_requests}
                  onChange={handleChange}
                  rows="5"
                  className="resize-none text-base"
                  placeholder="E.g., Dietary requirements, color themes, decoration preferences, timeline adjustments, or any specific instructions..."
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  This information helps us prepare your event exactly as you envision it.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-[#a413ec] to-[#7c3aed] hover:from-[#9010d0] hover:to-[#6d28d9] min-w-[160px]"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar: Package Summary */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <Card className="border-purple-200/50 dark:border-purple-800/50 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a413ec] to-[#7c3aed] flex items-center justify-center shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg">Package Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Package Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {packageData?.package_name || packageData?.name || 'N/A'}
                </p>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Price</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-[#a413ec] to-[#7c3aed] bg-clip-text text-transparent">
                  {formatPrice(packageData?.package_price || packageData?.price || 0)}
                </p>
              </div>

              {packageData?.capacity && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Max Capacity</p>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#a413ec]" />
                    {packageData.capacity} guests
                  </p>
                </div>
              )}

              {packageData?.venue?.name && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Venue</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {packageData.venue.name}
                  </p>
                </div>
              )}

              {/* Booking Preview */}
              {(formData.event_date || formData.event_time || formData.number_of_guests) && (
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#a413ec]" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Your Booking</p>
                  </div>
                  
                  {formData.event_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {formData.event_date instanceof Date 
                          ? format(formData.event_date, 'MMM dd, yyyy')
                          : formatDateForAPI(formData.event_date)
                        }
                      </span>
                    </div>
                  )}
                  
                  {formData.event_time && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{formData.event_time}</span>
                    </div>
                  )}
                  
                  {formData.number_of_guests && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {formData.number_of_guests} {formData.number_of_guests === '1' ? 'guest' : 'guests'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </FormModal>
  );
};

export default BookingFormModal;

