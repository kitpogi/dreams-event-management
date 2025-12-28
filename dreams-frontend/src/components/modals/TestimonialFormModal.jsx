import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button, FormModal } from '../ui';

const TestimonialFormModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    booking_id: '',
    event_type: '',
    event_date: '',
    rating: 5,
    message: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCompletedBookings();
    }
  }, [isOpen]);

  const fetchCompletedBookings = async () => {
    try {
      const response = await api.get('/bookings');
      const completedBookings = (response.data.data || response.data || []).filter(
        b => b.booking_status === 'Completed' || 
             b.booking_status === 'Approved' ||
             b.status === 'completed' ||
             b.status === 'approved'
      );
      setBookings(completedBookings);
      
      if (completedBookings.length > 0) {
        const firstBooking = completedBookings[0];
        setFormData(prev => ({
          ...prev,
          booking_id: firstBooking.booking_id || firstBooking.id,
          event_type: firstBooking.package?.package_category || '',
          event_date: firstBooking.event_date || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const data = new FormData();
      data.append('client_name', user?.name || '');
      data.append('event_type', formData.event_type);
      data.append('event_date', formData.event_date);
      data.append('rating', formData.rating);
      data.append('message', formData.message);
      
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      await api.post('/testimonials/submit', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setFormData({
        booking_id: '',
        event_type: '',
        event_date: '',
        rating: 5,
        message: '',
      });
      setAvatarFile(null);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to submit testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Submit Your Testimonial"
      size="lg"
    >
      <div className="space-y-6">
        <p className="text-gray-600">
          Share your experience and help others discover our services!
        </p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✓ Thank you for your testimonial! It will be reviewed before being published.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {bookings.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Event (Optional)
              </label>
              <select
                name="booking_id"
                value={formData.booking_id}
                onChange={(e) => {
                  const selectedBooking = bookings.find(b => 
                    (b.booking_id || b.id) === e.target.value
                  );
                  setFormData({
                    ...formData,
                    booking_id: e.target.value,
                    event_type: selectedBooking?.package?.package_category || formData.event_type,
                    event_date: selectedBooking?.event_date || formData.event_date,
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select an event...</option>
                {bookings.map((booking) => (
                  <option key={booking.booking_id || booking.id} value={booking.booking_id || booking.id}>
                    {booking.package?.package_name || 'Package'} - {new Date(booking.event_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <input
                type="text"
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                required
                placeholder="e.g., Wedding, Birthday"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating *
            </label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="5">5 Stars - Excellent</option>
              <option value="4">4 Stars - Very Good</option>
              <option value="3">3 Stars - Good</option>
              <option value="2">2 Stars - Fair</option>
              <option value="1">1 Star - Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Testimonial *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Share your experience with our services..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div className="flex gap-4 pt-4">
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
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Testimonial'}
            </Button>
          </div>
        </form>
      </div>
    </FormModal>
  );
};

export default TestimonialFormModal;

