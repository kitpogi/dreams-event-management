import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { packageService, bookingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/ui';

const BookingForm = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [formData, setFormData] = useState({
    event_date: '',
    event_time: '',
    number_of_guests: '',
    special_requests: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchPackage();
  }, [packageId, isAuthenticated]);

  const fetchPackage = async () => {
    try {
      const response = await packageService.getById(packageId);
      setPackageData(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching package:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Ensure number_of_guests is a valid number, not an empty string
      const payload = {
        package_id: packageId,
        event_date: formData.event_date,
        number_of_guests: formData.number_of_guests ? parseInt(formData.number_of_guests, 10) : null,
        special_requests: formData.special_requests || null,
      };

      // Only include event_time if it has a value
      if (formData.event_time) {
        payload.event_time = formData.event_time;
      }

      await bookingService.create(payload);
      
      toast.success('Booking created successfully!');
      navigate('/dashboard');
    } catch (error) {
      // Handle validation errors from Laravel
      const errorMessage = error.response?.data?.message || 
        (error.response?.data?.errors ? 
          Object.values(error.response.data.errors).flat().join(', ') : 
          'Failed to create booking');
      toast.error(errorMessage);
      console.error('Booking error:', error.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Package not found</h2>
        <Button onClick={() => navigate('/packages')}>Browse Packages</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Complete Your Booking
          </h1>
          <p className="mt-2 text-gray-600">
            Finalize details for {packageData.package_name || packageData.name}
          </p>
        </div>

        <Card className="mb-6">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Package Summary</h2>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Time *
                </label>
                <input
                  type="time"
                  name="event_time"
                  value={formData.event_time}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Guests *
              </label>
              <input
                type="number"
                name="number_of_guests"
                value={formData.number_of_guests}
                onChange={handleChange}
                required
                min="1"
                max={packageData.capacity || undefined}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder={packageData.capacity ? `Max ${packageData.capacity}` : 'Enter number of guests'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
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
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
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
        </Card>
      </div>
    </div>
  );
};

export default BookingForm;
