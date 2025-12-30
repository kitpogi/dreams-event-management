import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { packageService, bookingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CheckCircle2, Calendar, Users, FileText, CreditCard, Package, Clock, AlertCircle, Sparkles, ArrowRight, ArrowLeft, Lock, Shield } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';

const steps = [
  { id: 1, name: 'Event Details', icon: Calendar, description: 'Select date and time' },
  { id: 2, name: 'Guest Information', icon: Users, description: 'Number of guests' },
  { id: 3, name: 'Special Requests', icon: FileText, description: 'Additional details' },
  { id: 4, name: 'Payment', icon: CreditCard, description: 'Payment method' },
  { id: 5, name: 'Review & Confirm', icon: CheckCircle2, description: 'Review your booking' },
];

const BookingWizard = ({ isOpen, onClose, packageId: propPackageId, packageData: propPackageData, onSuccess }) => {
  const { packageId: routePackageId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [packageData, setPackageData] = useState(propPackageData || null);
  const [formData, setFormData] = useState({
    event_date: null, // Changed to Date object for DatePicker
    event_time: '',
    number_of_guests: '',
    special_requests: '',
    payment_method: 'deposit', // 'deposit', 'full', 'later'
    payment_amount: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isDateAvailable, setIsDateAvailable] = useState(null);

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

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.event_date) {
        newErrors.event_date = 'Event date is required';
      } else if (formData.event_date instanceof Date && formData.event_date < new Date()) {
        newErrors.event_date = 'Event date must be in the future';
      }
      if (!formData.event_time) newErrors.event_time = 'Event time is required';
      if (formData.event_date && isDateAvailable === false) {
        newErrors.event_date = 'This date is not available';
      }
    } else if (step === 2) {
      if (!formData.number_of_guests || parseInt(formData.number_of_guests, 10) < 1) {
        newErrors.number_of_guests = 'Number of guests must be at least 1';
      }
      if (packageData?.capacity && parseInt(formData.number_of_guests, 10) > packageData.capacity) {
        newErrors.number_of_guests = `Maximum capacity is ${packageData.capacity} guests`;
      }
    } else if (step === 4) {
      if (!formData.payment_method) {
        newErrors.payment_method = 'Please select a payment method';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

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
        number_of_guests: parseInt(formData.number_of_guests, 10),
        special_requests: formData.special_requests || null,
        event_time: formData.event_time,
        payment_method: formData.payment_method || 'later',
        payment_amount: formData.payment_amount || null,
      };

      const response = await bookingService.create(payload);
      const bookingData = response.data.data || response.data;
      const bookingId = bookingData.booking_id || bookingData.id;

      toast.success('Booking created successfully!');

      setFormData({
        event_date: null,
        event_time: '',
        number_of_guests: '',
        special_requests: '',
        payment_method: 'deposit',
        payment_amount: null,
      });
      setCurrentStep(1);
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
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!packageData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Package Not Found</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Package not found</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
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
                  <h3 className="font-semibold text-gray-900 dark:text-white">Event Date & Time</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Select when your event will take place</p>
                </div>
              </div>

              <div className="space-y-6">
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
                    description="Select the start time for your event"
                    minTime="06:00"
                    maxTime="23:00"
                    step={30}
                    className="w-full"
                  />
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
                    max={packageData.capacity || undefined}
                    placeholder={packageData.capacity ? `Max ${packageData.capacity}` : 'Enter number of guests'}
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
                {packageData.capacity && !errors.number_of_guests && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Maximum capacity: <strong>{packageData.capacity}</strong> guests</span>
                  </div>
                )}
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
                  rows="6"
                  className="resize-none text-base"
                  placeholder="E.g., Dietary requirements, color themes, decoration preferences, timeline adjustments, or any specific instructions..."
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  This information helps us prepare your event exactly as you envision it.
                </p>
              </div>
            </div>
          </div>
        );
      case 4:
        const totalPrice = parseFloat(packageData?.package_price || packageData?.price || 0);
        const depositAmount = totalPrice * 0.3; // 30% deposit
        const calculatePaymentAmount = () => {
          if (formData.payment_method === 'deposit') return depositAmount;
          if (formData.payment_method === 'full') return totalPrice;
          return 0;
        };
        
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-900/20 dark:to-purple-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose your payment option</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">Payment Method *</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, payment_method: 'deposit', payment_amount: depositAmount });
                        setErrors((prev) => ({ ...prev, payment_method: null }));
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.payment_method === 'deposit'
                          ? 'border-[#a413ec] bg-[#a413ec]/10 dark:bg-[#7c3aed]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#a413ec]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Pay Deposit (30%)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Secure your booking with a deposit. Balance due before event.
                          </p>
                          <p className="text-lg font-bold text-[#a413ec] mt-2">
                            {formatPrice(depositAmount)}
                          </p>
                        </div>
                        {formData.payment_method === 'deposit' && (
                          <CheckCircle2 className="h-6 w-6 text-[#a413ec]" />
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, payment_method: 'full', payment_amount: totalPrice });
                        setErrors((prev) => ({ ...prev, payment_method: null }));
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.payment_method === 'full'
                          ? 'border-[#a413ec] bg-[#a413ec]/10 dark:bg-[#7c3aed]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#a413ec]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Pay in Full</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Pay the complete amount now.
                          </p>
                          <p className="text-lg font-bold text-[#a413ec] mt-2">
                            {formatPrice(totalPrice)}
                          </p>
                        </div>
                        {formData.payment_method === 'full' && (
                          <CheckCircle2 className="h-6 w-6 text-[#a413ec]" />
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, payment_method: 'later', payment_amount: 0 });
                        setErrors((prev) => ({ ...prev, payment_method: null }));
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.payment_method === 'later'
                          ? 'border-[#a413ec] bg-[#a413ec]/10 dark:bg-[#7c3aed]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#a413ec]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Pay Later</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            We'll contact you to arrange payment.
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Payment details will be discussed
                          </p>
                        </div>
                        {formData.payment_method === 'later' && (
                          <CheckCircle2 className="h-6 w-6 text-[#a413ec]" />
                        )}
                      </div>
                    </button>
                  </div>
                  {errors.payment_method && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.payment_method}
                    </p>
                  )}
                </div>

                {/* Security Notice */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800 dark:text-green-200">
                      <p className="font-semibold mb-1">Secure Payment</p>
                      <p>Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.</p>
                    </div>
                  </div>
                </div>

                {formData.payment_method && formData.payment_method !== 'later' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold mb-1">Payment Processing</p>
                        <p>Payment will be processed securely after booking confirmation. You'll receive a payment link via email.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-900/20 dark:to-emerald-900/10 rounded-2xl p-6 border border-green-100 dark:border-green-800/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Your Booking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Please review all details before confirming</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Package Info */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Package</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {packageData.package_name || packageData.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Price</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-[#a413ec] to-[#7c3aed] bg-clip-text text-transparent">
                          {formatPrice(packageData.package_price || packageData.price || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Event Details */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#a413ec]" />
                      Event Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Event Date
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.event_date
                          ? (formData.event_date instanceof Date
                            ? format(formData.event_date, 'EEEE, MMMM dd, yyyy')
                            : format(new Date(formData.event_date), 'EEEE, MMMM dd, yyyy'))
                          : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Event Time
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.event_time || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Number of Guests
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.number_of_guests || 'Not set'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Special Requests */}
                {formData.special_requests && (
                  <Card className="border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#a413ec]" />
                        Special Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {formData.special_requests}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Summary */}
                {formData.payment_method && (
                  <Card className="border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#a413ec]" />
                        Payment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {formData.payment_method === 'deposit' ? 'Deposit (30%)' : formData.payment_method === 'full' ? 'Full Payment' : 'Pay Later'}
                        </span>
                      </div>
                      {formData.payment_method !== 'later' && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Amount to Pay</span>
                          <span className="text-lg font-bold text-[#a413ec]">
                            {formatPrice(formData.payment_amount || 0)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Important Note */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-semibold mb-1">Important</p>
                      <p>After confirming, our team will review your booking and contact you within 24-48 hours to finalize the details.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px]">

          {/* Main Content Area */}
          <div className="p-6 lg:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#a413ec] to-[#7c3aed] bg-clip-text text-transparent">
                Complete Your Booking
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Follow the steps below to book your event package
              </DialogDescription>
            </DialogHeader>

            {/* Enhanced Progress Indicator */}
            <div className="space-y-6 mb-8">
              <Progress value={progress} className="h-2.5" />
              <div className="flex justify-between relative">
                {/* Connection Lines */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
                  <div
                    className="h-full bg-gradient-to-r from-[#a413ec] to-[#7c3aed] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-lg ${isCompleted
                            ? 'bg-gradient-to-br from-[#a413ec] to-[#7c3aed] border-[#a413ec] text-white scale-110'
                            : isActive
                              ? 'border-[#a413ec] bg-gradient-to-br from-[#a413ec]/10 to-[#7c3aed]/10 text-[#a413ec] scale-105 ring-4 ring-[#a413ec]/20'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <StepIcon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="mt-3 text-center max-w-[100px]">
                        <p className={`text-xs font-semibold transition-colors ${isActive
                            ? 'text-[#a413ec] dark:text-[#7c3aed]'
                            : isCompleted
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                          {step.name}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isActive ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[350px] py-4">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? onClose : handleBack}
                disabled={submitting}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Button>
              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#a413ec] to-[#7c3aed] hover:from-[#9010d0] hover:to-[#6d28d9] gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#a413ec] to-[#7c3aed] hover:from-[#9010d0] hover:to-[#6d28d9] gap-2 min-w-[160px]"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar: Package Summary */}
          <aside className="bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-white dark:from-gray-900/90 dark:via-purple-900/20 dark:to-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 lg:p-8">
            <div className="sticky top-6">
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

                  {/* Comprehensive Booking Summary */}
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-[#a413ec]" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Booking Summary</p>
                    </div>

                    {/* Event Date */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Event Date
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formData.event_date
                          ? (formData.event_date instanceof Date
                            ? format(formData.event_date, 'MMM dd, yyyy')
                            : formatDateForAPI(formData.event_date))
                          : 'Not selected'}
                      </p>
                    </div>

                    {/* Event Time */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Event Time
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formData.event_time || 'Not selected'}
                      </p>
                    </div>

                    {/* Number of Guests */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Guests
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formData.number_of_guests
                          ? `${formData.number_of_guests} ${formData.number_of_guests === '1' ? 'guest' : 'guests'}`
                          : 'Not specified'}
                      </p>
                    </div>

                    {/* Payment Method */}
                    {formData.payment_method && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" />
                          Payment
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {formData.payment_method === 'deposit' ? 'Deposit (30%)' : formData.payment_method === 'full' ? 'Full Payment' : 'Pay Later'}
                        </p>
                        {formData.payment_method !== 'later' && formData.payment_amount && (
                          <p className="text-xs font-semibold text-[#a413ec]">
                            {formatPrice(formData.payment_amount)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Special Requests Preview */}
                    {formData.special_requests && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          Special Requests
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {formData.special_requests}
                        </p>
                      </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                        <p className="text-xs font-semibold text-[#a413ec]">
                          {currentStep} of {steps.length}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-[#a413ec] to-[#7c3aed] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingWizard;

