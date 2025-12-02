import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PackageCard from '../components/PackageCard';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const Recommendations = () => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    type: '',
    budget: '',
    guests: '',
    theme: '',
    preferences: '',
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false);

    try {
      const preferencesArray = formData.preferences
        ? formData.preferences.split(',').map(p => p.trim()).filter(p => p)
        : [];

      const response = await api.post('/recommend', {
        type: formData.type || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        guests: formData.guests ? parseInt(formData.guests) : null,
        theme: formData.theme || null,
        preferences: preferencesArray,
      });

      setRecommendations(response.data.data || []);
      setSubmitted(true);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      alert(error.response?.data?.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 max-w-4xl text-center py-12">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Get Personalized Recommendations</h1>
        <p className="text-gray-600 mb-6">
          Please <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">log in</Link> to get personalized package recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Get Personalized Recommendations</h1>
      
      <Card className="mb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select type...</option>
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday</option>
                <option value="corporate">Corporate</option>
                <option value="anniversary">Anniversary</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label="Budget ($)"
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Enter your budget"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Number of Guests"
              type="number"
              name="guests"
              value={formData.guests}
              onChange={handleChange}
              min="1"
              placeholder="Number of guests"
            />

            <Input
              label="Theme"
              type="text"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              placeholder="e.g., elegant, modern, rustic"
            />
          </div>

          <Input
            label="Preferences (comma-separated keywords)"
            type="text"
            name="preferences"
            value={formData.preferences}
            onChange={handleChange}
            placeholder="e.g., outdoor, photography, catering"
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
          </Button>
        </form>
      </Card>

      {submitted && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Top 5 Recommended Packages</h2>
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((pkg) => (
                <div key={pkg.id} className="relative">
                  <PackageCard package={pkg} />
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-semibold text-indigo-900 mb-2">
                      Score: <span className="text-indigo-600">{pkg.score}</span>
                    </p>
                    <p className="text-xs text-gray-700">{pkg.justification}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No packages match your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommendations;

