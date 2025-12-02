import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackageDetails();
  }, [id]);

  const fetchPackageDetails = async () => {
    try {
      const response = await api.get(`/packages/${id}`);
      setPackageData(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching package details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/booking/${id}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!packageData) {
    return <div>Package not found</div>;
  }

  return (
    <div className="package-details">
      <div className="package-details-header">
        <h1>{packageData.name}</h1>
        <p className="package-price">${packageData.price}</p>
      </div>

      {packageData.images && packageData.images.length > 0 && (
        <div className="package-images">
          {packageData.images.map((image, index) => (
            <img
              key={index}
              src={image.image_url}
              alt={`${packageData.name} - Image ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="package-info">
        <h2>Description</h2>
        <p>{packageData.description}</p>

        <div className="package-specs">
          <div className="spec-item">
            <strong>Capacity:</strong> {packageData.capacity} guests
          </div>
          <div className="spec-item">
            <strong>Venue:</strong> {packageData.venue?.name || 'N/A'}
          </div>
          <div className="spec-item">
            <strong>Location:</strong> {packageData.venue?.location || 'N/A'}
          </div>
        </div>

        <button onClick={handleBookNow} className="book-now-btn">
          Book Now
        </button>
      </div>
    </div>
  );
};

export default PackageDetails;

