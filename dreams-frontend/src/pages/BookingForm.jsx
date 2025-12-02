import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BookingForm = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
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
      const response = await api.get(`/packages/${packageId}`);
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
      const response = await api.post('/bookings', {
        package_id: packageId,
        ...formData,
      });
      
      alert('Booking created successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="booking-form">
      <h1>Book Package: {packageData?.name}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Date</label>
          <input
            type="date"
            name="event_date"
            value={formData.event_date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label>Event Time</label>
          <input
            type="time"
            name="event_time"
            value={formData.event_time}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Number of Guests</label>
          <input
            type="number"
            name="number_of_guests"
            value={formData.number_of_guests}
            onChange={handleChange}
            required
            min="1"
            max={packageData?.capacity}
          />
        </div>

        <div className="form-group">
          <label>Special Requests</label>
          <textarea
            name="special_requests"
            value={formData.special_requests}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="form-summary">
          <p><strong>Package:</strong> {packageData?.name}</p>
          <p><strong>Price:</strong> ${packageData?.price}</p>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;

