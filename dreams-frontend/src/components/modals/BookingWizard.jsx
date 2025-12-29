import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { packageService, bookingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Progress } from '../ui/progress';
import { CheckCircle2, Calendar, Users, FileText, CreditCard } from 'lucide-react';
import api from '../../api/axios';

const steps = [
  { id: 1, name: 'Event Details', icon: Calendar, description: 'Select date and time' },
  { id: 2, name: 'Guest Information', icon: Users, description: 'Number of guests' },
  { id: 3, name: 'Special Requests', icon: FileText, description: 'Additional details' },
  { id: 4, name: 'Review & Confirm', icon: CheckCircle2, description: 'Review your booking' },
];

const BookingWizard = ({ isOpen, onClose, packageId: propPackageId, packageData: propPackageData, onSuccess }) => {
  const { packageId: routePackageId } = useParams();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
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

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.event_date) newErrors.event_date = 'Event date is required';
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
    if (!validateStep(4)) return;
    
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
        number_of_guests: parseInt(formData.number_of_guests, 10),
        special_requests: formData.special_requests || null,
        event_time: formData.event_time,
      };

      await bookingService.create(payload);
      toast.success('Booking created successfully!');
      
      setFormData({
        event_date: '',
        event_time: '',
        number_of_guests: '',
        special_requests: '',
      });
      setCurrentStep(1);
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
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
              </label>
              <div className="relative">
                <Input
                  id="event_date"
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.event_date || isDateAvailable === false ? 'border-red-300' : ''}
                />
                {checkingAvailability && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  </div>
                )}
                {!checkingAvailability && isDateAvailable === true && (
                  <div className="absolute right-3 top-3 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
              </div>
              {errors.event_date && (
                <p className="mt-1 text-sm text-red-600">{errors.event_date}</p>
              )}
              {isDateAvailable === true && !errors.event_date && (
                <p className="mt-1 text-sm text-green-600">✓ This date is available</p>
              )}
            </div>
            <div>
              <label htmlFor="event_time" className="block text-sm font-medium text-gray-700 mb-2">
                Event Time *
              </label>
              <Input
                id="event_time"
                type="time"
                name="event_time"
                value={formData.event_time}
                onChange={handleChange}
                className={errors.event_time ? 'border-red-300' : ''}
              />
              {errors.event_time && (
                <p className="mt-1 text-sm text-red-600">{errors.event_time}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="number_of_guests" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests *
              </label>
              <Input
                id="number_of_guests"
                type="number"
                name="number_of_guests"
                value={formData.number_of_guests}
                onChange={handleChange}
                min="1"
                max={packageData.capacity || undefined}
                placeholder={packageData.capacity ? `Max ${packageData.capacity}` : 'Enter number of guests'}
                className={errors.number_of_guests ? 'border-red-300' : ''}
              />
              {errors.number_of_guests && (
                <p className="mt-1 text-sm text-red-600">{errors.number_of_guests}</p>
              )}
              {packageData.capacity && (
                <p className="mt-1 text-sm text-gray-500">Maximum capacity: {packageData.capacity} guests</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                id="special_requests"
                name="special_requests"
                value={formData.special_requests}
                onChange={handleChange}
                rows="6"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="Any dietary requirements, color themes, or specific instructions..."
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Package:</span>
                  <p className="font-medium text-gray-900">{packageData.package_name || packageData.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Price:</span>
                  <p className="font-medium text-indigo-600 text-lg">
                    ₱{parseFloat(packageData.package_price || packageData.price || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Event Date:</span>
                  <p className="font-medium text-gray-900">{formData.event_date}</p>
                </div>
                <div>
                  <span className="text-gray-500">Event Time:</span>
                  <p className="font-medium text-gray-900">{formData.event_time}</p>
                </div>
                <div>
                  <span className="text-gray-500">Number of Guests:</span>
                  <p className="font-medium text-gray-900">{formData.number_of_guests}</p>
                </div>
                {formData.special_requests && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Special Requests:</span>
                    <p className="font-medium text-gray-900">{formData.special_requests}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
        </DialogHeader>
        
        {/* Progress Indicator */}
        <div className="space-y-4 mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : isActive
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-4">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? onClose : handleBack}
            disabled={submitting}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={submitting}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Processing...' : 'Confirm Booking'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingWizard;

