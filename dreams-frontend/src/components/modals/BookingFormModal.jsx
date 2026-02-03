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
import {
  Calendar, Clock, Users, FileText, Package, CheckCircle2,
  AlertCircle, Sparkles, ChevronRight, ChevronLeft, DollarSign,
  Phone, Palette, PartyPopper
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';

const STEPS = [
  { id: 1, title: 'Event Details', description: 'Date, time, and type' },
  { id: 2, title: 'Guests & Theme', description: 'Count and style' },
  { id: 3, title: 'Contact & Extras', description: 'Contact info and notes' },
  { id: 4, title: 'Review', description: 'Confirm details' },
];

const EVENT_TYPES = [
  'Wedding', 'Birthday', 'Corporate Event', 'Anniversary',
  'Christening', 'Debut', 'Reunion', 'Other'
];

const BUDGET_RANGES = [
  '₱50,000 - ₱100,000',
  '₱100,000 - ₱200,000',
  '₱200,000 - ₱500,000',
  '₱500,000+',
  'Flexible'
];

const BookingFormModal = ({ isOpen, onClose, packageId: propPackageId, packageData: propPackageData, onSuccess }) => {
  const { packageId: routePackageId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [packageData, setPackageData] = useState(propPackageData || null);
  const [formData, setFormData] = useState({
    event_date: null,
    event_time: '',
    event_duration: '',
    event_end_time: '',
    event_type: '',
    theme: '',
    number_of_guests: '',
    budget_range: '',
    alternate_contact: '',
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

  useEffect(() => {
    if (isOpen && finalPackageId) {
      fetchAvailableDates();
    }
  }, [isOpen, finalPackageId]);

  useEffect(() => {
    if (formData.event_date && finalPackageId) {
      checkDateAvailability();
    } else {
      setIsDateAvailable(null);
    }
  }, [formData.event_date, finalPackageId]);

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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime, durationHours) => {
    if (!startTime || !durationHours) return '';

    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const durationMinutes = Math.floor(parseFloat(durationHours) * 60);

      let endHours = hours + Math.floor(durationMinutes / 60);
      let endMinutes = minutes + (durationMinutes % 60);

      if (endMinutes >= 60) {
        endHours += 1;
        endMinutes -= 60;
      }

      // Handle day overflow (optional - you might want to prevent this)
      endHours = endHours % 24;

      return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating end time:', error);
      return '';
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, event_date: date }));
    setErrors(prev => ({ ...prev, event_date: null }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.event_date) {
        newErrors.event_date = 'Event date is required';
        isValid = false;
      } else if (formData.event_date instanceof Date && formData.event_date < new Date()) {
        newErrors.event_date = 'Event date must be in the future';
        isValid = false;
      } else if (formData.event_date && isDateAvailable === false) {
        newErrors.event_date = 'This date is not available. Please select another date.';
        isValid = false;
      }

      if (!formData.event_time) {
        newErrors.event_time = 'Event time is required';
        isValid = false;
      }

      if (!formData.event_type) {
        newErrors.event_type = 'Event type is required';
        isValid = false;
      }
    }

    if (step === 2) {
      if (!formData.number_of_guests || parseInt(formData.number_of_guests, 10) < 1) {
        newErrors.number_of_guests = 'Number of guests must be at least 1';
        isValid = false;
      }
      if (packageData?.capacity && parseInt(formData.number_of_guests, 10) > packageData.capacity) {
        newErrors.number_of_guests = `Maximum capacity is ${packageData.capacity} guests`;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

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
        event_time: formData.event_time,
        event_duration: formData.event_duration || null,
        event_end_time: formData.event_end_time || null,
        number_of_guests: formData.number_of_guests ? parseInt(formData.number_of_guests, 10) : null,
        special_requests: formData.special_requests || null,
        event_type: formData.event_type,
        theme: formData.theme,
        budget_range: formData.budget_range,
        alternate_contact: formData.alternate_contact,
      };

      const response = await bookingService.create(payload);
      const bookingData = response.data.data || response.data;
      const bookingId = bookingData.booking_id || bookingData.id;

      toast.success('Booking created successfully!');

      onClose();

      if (bookingId) {
        navigate(`/booking-confirmation/${bookingId}`, { state: { showPayment: true } });
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
        setErrors(prev => ({ ...prev, ...mapped }));
        // Also show toast for general error
        toast.error('Please check the form for errors.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create booking');
      }
      console.error('Booking error:', error.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-900/20 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a413ec] to-[#7c3aed] flex items-center justify-center shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Event Details</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">When and what are you celebrating?</p>
                </div>
              </div>

              <div className="space-y-4">
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
                      label="Event Start Time *"
                      value={formData.event_time}
                      onChange={(time) => {
                        const endTime = formData.event_duration
                          ? calculateEndTime(time, formData.event_duration)
                          : '';
                        setFormData(prev => ({
                          ...prev,
                          event_time: time,
                          event_end_time: endTime
                        }));
                        setErrors(prev => ({ ...prev, event_time: null }));
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

                {/* Duration and End Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_duration" className="text-base font-medium mb-3 block">
                      Event Duration <span className="text-sm font-normal text-gray-500">(Optional)</span>
                    </Label>
                    <select
                      id="event_duration"
                      name="event_duration"
                      value={formData.event_duration}
                      onChange={(e) => {
                        const duration = e.target.value;
                        const endTime = formData.event_time
                          ? calculateEndTime(formData.event_time, duration)
                          : '';
                        setFormData(prev => ({
                          ...prev,
                          event_duration: duration,
                          event_end_time: endTime
                        }));
                      }}
                      className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select duration</option>
                      <option value="0.5">30 minutes</option>
                      <option value="1">1 hour</option>
                      <option value="1.5">1.5 hours</option>
                      <option value="2">2 hours</option>
                      <option value="2.5">2.5 hours</option>
                      <option value="3">3 hours</option>
                      <option value="3.5">3.5 hours</option>
                      <option value="4">4 hours</option>
                      <option value="4.5">4.5 hours</option>
                      <option value="5">5 hours</option>
                      <option value="5.5">5.5 hours</option>
                      <option value="6">6 hours</option>
                      <option value="7">7 hours</option>
                      <option value="8">8 hours (full day)</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Approximate time for your event
                    </p>
                  </div>

                  {formData.event_end_time && (
                    <div>
                      <Label className="text-base font-medium mb-3 block">
                        Estimated End Time
                      </Label>
                      <div className="flex items-center gap-3 h-12 px-4 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">
                        <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                          {formData.event_end_time}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Automatically calculated from start time + duration
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="event_type" className="text-base font-medium mb-3 block">
                    Event Type *
                  </Label>
                  <select
                    id="event_type"
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleChange}
                    className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select event type</option>
                    {EVENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.event_type && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.event_type}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Guest & Theme</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tell us about your guests and style</p>
                </div>
              </div>

              <div className="space-y-4">
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

                <div>
                  <Label htmlFor="theme" className="text-base font-medium mb-3 block">
                    Event Theme / Style <span className="text-sm font-normal text-gray-500">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      placeholder="E.g., Rustic, Modern, Fairy Tale, Black & Gold"
                      className="pl-12"
                    />
                    <Palette className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="budget_range" className="text-base font-medium mb-3 block">
                    Estimated Budget <span className="text-sm font-normal text-gray-500">(Optional)</span>
                  </Label>
                  <select
                    id="budget_range"
                    name="budget_range"
                    value={formData.budget_range}
                    onChange={handleChange}
                    className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select budget range</option>
                    {BUDGET_RANGES.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/20 dark:to-orange-900/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Contact & Extras</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Additional details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="alternate_contact" className="text-base font-medium mb-3 block">
                    Alternate Contact Number <span className="text-sm font-normal text-gray-500">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="alternate_contact"
                      name="alternate_contact"
                      value={formData.alternate_contact}
                      onChange={handleChange}
                      placeholder="Secondary phone number"
                      className="pl-12"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="special_requests" className="text-base font-medium mb-3 block">
                    Special Requests <span className="text-sm font-normal text-gray-500">(Optional)</span>
                  </Label>
                  <Textarea
                    id="special_requests"
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleChange}
                    rows="5"
                    className="resize-none text-base"
                    placeholder="Any specific instructions, dietary requirements, or preferences..."
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50/50 to-violet-50/30 dark:from-indigo-900/20 dark:to-violet-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Review Booking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Please verify your details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Event Date</p>
                    <p className="font-medium">{formData.event_date ? format(formData.event_date, 'MMM dd, yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{formData.event_time || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{formData.event_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-medium">{formData.number_of_guests || '-'}</p>
                  </div>
                  {formData.theme && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Theme</p>
                      <p className="font-medium">{formData.theme}</p>
                    </div>
                  )}
                  {formData.special_requests && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Special Requests</p>
                      <p className="font-medium italic">"{formData.special_requests}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#a413ec] to-[#7c3aed] bg-clip-text text-transparent mb-2">
              Complete Your Booking
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {packageData?.package_name || packageData?.name || 'Package'}
            </p>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center bg-white dark:bg-gray-800 px-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                        ${isActive ? 'border-[#a413ec] bg-[#a413ec] text-white' :
                          isCompleted ? 'border-[#a413ec] bg-white text-[#a413ec]' :
                            'border-gray-300 bg-white text-gray-400'}`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isActive ? 'text-[#a413ec]' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepContent()}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? onClose : handleBack}
                disabled={submitting}
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#a413ec] hover:bg-[#8a0fd4]"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
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
              )}
            </div>
          </form>
        </div>

        {/* Sidebar: Package Summary */}
        <aside className="hidden lg:block lg:sticky lg:top-6 h-fit">
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

                  {formData.event_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <PartyPopper className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{formData.event_type}</span>
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
