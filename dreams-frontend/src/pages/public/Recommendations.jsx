import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input } from '../../components/ui';

const Recommendations = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    type: '',
    budget: '',
    guests: '',
    theme: '',
    preferences: '',
  });
  const [recommendations, setRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryData, setInquiryData] = useState(null);
  const [filters, setFilters] = useState({
    eventType: '',
    budgetRange: '',
    guests: '',
    sortBy: 'match-score',
  });

  // Check if recommendations were passed from SetAnEvent page
  useEffect(() => {
    if (location.state?.recommendations) {
      setRecommendations(location.state.recommendations);
      setFilteredRecommendations(location.state.recommendations);
      setSubmitted(true);
      setInquiryData(location.state.inquiryData);
    }
  }, [location.state]);

  // Apply filters and sorting when recommendations or filters change
  useEffect(() => {
    if (recommendations.length > 0) {
      let filtered = [...recommendations];

      // Filter by event type
      if (filters.eventType) {
        filtered = filtered.filter(pkg => {
          const category = (pkg.category || pkg.package_category || '').toLowerCase();
          return category.includes(filters.eventType.toLowerCase());
        });
      }

      // Filter by budget range
      if (filters.budgetRange) {
        const [min, max] = filters.budgetRange.split('-').map(v => parseFloat(v.replace(/[^0-9.]/g, '')));
        filtered = filtered.filter(pkg => {
          const price = parseFloat(pkg.price || pkg.package_price || 0);
          if (max) {
            return price >= min && price <= max;
          } else {
            return price >= min;
          }
        });
      }

      // Filter by guests
      if (filters.guests) {
        const guestCount = parseInt(filters.guests);
        filtered = filtered.filter(pkg => {
          // Assuming packages have a capacity field, adjust as needed
          const capacity = pkg.capacity || pkg.venue?.capacity || 9999;
          return capacity >= guestCount;
        });
      }

      // Sort
      switch (filters.sortBy) {
        case 'price-low':
          filtered.sort((a, b) => (a.price || a.package_price || 0) - (b.price || b.package_price || 0));
          break;
        case 'price-high':
          filtered.sort((a, b) => (b.price || b.package_price || 0) - (a.price || a.package_price || 0));
          break;
        case 'match-score':
        default:
          filtered.sort((a, b) => (b.score || b.match_score || 0) - (a.score || a.match_score || 0));
          break;
      }

      setFilteredRecommendations(filtered);
    }
  }, [recommendations, filters]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
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

      const recs = response.data.data || [];
      setRecommendations(recs);
      setFilteredRecommendations(recs);
      setSubmitted(true);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error(error.response?.data?.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `Starting from ₱${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMatchScore = (score) => {
    if (!score) return '0%';
    const percentage = Math.round(parseFloat(score) * 100);
    return `${percentage}%`;
  };

  const getPackageImage = (pkg) => {
    if (pkg.images && pkg.images.length > 0) {
      return pkg.images[0].image_url;
    }
    if (pkg.package_image) {
      return pkg.package_image;
    }
    // Fallback placeholder - Simple gray SVG
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EPackage Image%3C/text%3E%3C/svg%3E";
  };

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-[#FFF7F0] min-h-[calc(100vh-200px)]">
      <div className="flex flex-1 justify-center py-10 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col max-w-6xl w-full flex-1 gap-8 md:gap-12">
          {/* Success Banner - Only show if coming from SetAnEvent */}
          {submitted && location.state?.recommendations && (
            <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-base font-medium text-green-800 dark:text-green-200">Success!</p>
                <p className="text-sm text-green-700 dark:text-green-300">Here are your personalized event packages.</p>
              </div>
            </div>
          )}

          {/* Page Heading */}
          <div className="flex flex-col items-center text-center gap-3">
            <h1 className="text-[#181611] dark:text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
              {submitted ? 'Recommended Packages for You' : 'Get Personalized Recommendations'}
            </h1>
            <p className="text-[#8a7c60] dark:text-gray-400 text-base font-normal leading-normal max-w-2xl">
              {submitted 
                ? "Based on your preferences, we've curated a selection of packages that we think you'll love. Explore the options below to find the perfect fit for your special occasion."
                : "Fill out the form below to get personalized package recommendations tailored to your event needs."}
            </p>
          </div>

          {/* Form - Only show if not submitted or if no recommendations from SetAnEvent */}
          {!submitted && (
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Type
                      </label>
                      <div className="relative">
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="w-full appearance-none px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-[#4338CA] transition-colors"
                        >
                          <option value="">Select type...</option>
                          <option value="wedding">Wedding</option>
                          <option value="birthday">Birthday</option>
                          <option value="corporate">Corporate</option>
                          <option value="anniversary">Anniversary</option>
                          <option value="debut">Debut</option>
                          <option value="pageant">Pageant</option>
                          <option value="other">Other</option>
                        </select>
                        <svg
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Number of Guests */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Guests
                      </label>
                      <input
                        type="number"
                        name="guests"
                        value={formData.guests}
                        onChange={handleChange}
                        min="1"
                        placeholder="Number of guests"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-[#4338CA] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget ($)
                      </label>
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="Enter your budget"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-[#4338CA] transition-colors"
                      />
                    </div>

                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <input
                        type="text"
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        placeholder="e.g., elegant, modern, rustic"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-[#4338CA] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences - Full Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferences (comma-separated keywords)
                  </label>
                  <input
                    type="text"
                    name="preferences"
                    value={formData.preferences}
                    onChange={handleChange}
                    placeholder="e.g., outdoor, photography, catering"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-[#4338CA] transition-colors"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-[#4338CA] text-white font-semibold rounded-lg hover:bg-[#4338CA]/90 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
                </button>
              </form>
            </div>
          )}

          {/* Filter Controls - Only show when recommendations are displayed */}
          {submitted && recommendations.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between py-6 border-y border-[#F3E9DD] dark:border-[#4B402B]">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <select
                    name="eventType"
                    value={filters.eventType}
                    onChange={handleFilterChange}
                    className="w-full md:w-auto appearance-none bg-white dark:bg-background-dark/50 border border-[#F3E9DD] dark:border-[#4B402B] rounded-lg py-2 pl-3 pr-8 text-[#2D3748] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f2a60d]/50 focus:border-[#f2a60d]"
                  >
                    <option value="">Event Type</option>
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday</option>
                    <option value="debut">Debut</option>
                    <option value="pageant">Pageant</option>
                    <option value="corporate">Corporate</option>
                    <option value="anniversary">Anniversary</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7c60] pointer-events-none w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="relative">
                  <select
                    name="budgetRange"
                    value={filters.budgetRange}
                    onChange={handleFilterChange}
                    className="w-full md:w-auto appearance-none bg-white dark:bg-background-dark/50 border border-[#F3E9DD] dark:border-[#4B402B] rounded-lg py-2 pl-3 pr-8 text-[#2D3748] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f2a60d]/50 focus:border-[#f2a60d]"
                  >
                    <option value="">Budget Range</option>
                    <option value="1000-3000">$1,000 - $3,000</option>
                    <option value="3000-5000">$3,000 - $5,000</option>
                    <option value="5000-10000">$5,000 - $10,000</option>
                    <option value="10000-999999">$10,000+</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7c60] pointer-events-none w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#8a7c60] dark:text-gray-400 whitespace-nowrap" htmlFor="guests">
                    No. of Guests:
                  </label>
                  <input
                    id="guests"
                    name="guests"
                    type="number"
                    value={filters.guests}
                    onChange={handleFilterChange}
                    placeholder="e.g., 100"
                    className="w-24 bg-white dark:bg-background-dark/50 border border-[#F3E9DD] dark:border-[#4B402B] rounded-lg py-2 px-3 text-[#2D3748] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f2a60d]/50 focus:border-[#f2a60d]"
                  />
                </div>
              </div>
              <div className="relative self-start md:self-center">
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full md:w-auto appearance-none bg-white dark:bg-background-dark/50 border border-[#F3E9DD] dark:border-[#4B402B] rounded-lg py-2 pl-3 pr-8 text-[#2D3748] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f2a60d]/50 focus:border-[#f2a60d]"
                >
                  <option value="match-score">Sort By: Match Score</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="match-score">Match Score: High to Low</option>
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7c60] pointer-events-none w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          {/* Recommendations Grid */}
          {submitted && (
            <>
              {filteredRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {filteredRecommendations.map((pkg) => {
                    const packageId = pkg.id || pkg.package_id;
                    const packageName = pkg.name || pkg.package_name || 'Package';
                    const packagePrice = pkg.price || pkg.package_price;
                    const matchScore = pkg.score || pkg.match_score || 0;
                    const packageImage = getPackageImage(pkg);

                    return (
                      <div
                        key={packageId}
                        className="flex flex-col gap-4 bg-white dark:bg-background-dark/50 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1"
                      >
                        <div className="relative">
                          <Link to={`/packages/${packageId}`}>
                            <div
                              className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-200"
                              style={{ backgroundImage: `url("${packageImage}")` }}
                              role="img"
                              aria-label={packageName}
                            />
                          </Link>
                          <div className="absolute top-4 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-[#f2a60d] text-white shadow-md">
                            <p className="text-xl font-bold">{formatMatchScore(matchScore)}</p>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="text-[#181611] dark:text-white text-xl font-bold leading-normal">
                            {packageName}
                          </h3>
                          <p className="text-[#8a7c60] dark:text-gray-400 text-base font-normal leading-normal mt-1">
                            {formatPrice(packagePrice)}
                          </p>
                          <div className="mt-auto pt-6">
                            <Link to={`/packages/${packageId}`}>
                              <button className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-[#4338CA] text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#4338CA]/90">
                                <span className="truncate">View Details</span>
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No packages match your criteria.</p>
                  <Link to="/contact-us">
                    <Button className="bg-[#f2a60d] hover:bg-[#f2a60d]/90 text-[#181611]">
                      Contact Us for Custom Packages
                    </Button>
                  </Link>
                </div>
              )}

              {/* Bottom Action Buttons */}
              {filteredRecommendations.length > 0 && (
                <div className="flex justify-center pt-8">
                  <div className="flex flex-col sm:flex-row flex-1 gap-4 max-w-lg justify-center">
                    <Link to="/contact-us" state={{ inquiryData: inquiryData }}>
                      <button className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-[#f2a60d] text-[#181611] text-base font-bold leading-normal tracking-[0.015em] grow transition-transform hover:scale-105">
                        <span className="truncate">Contact Us</span>
                      </button>
                    </Link>
                    {isAuthenticated ? (
                      <Link to="/booking">
                        <button className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-[#10B981] text-white text-base font-bold leading-normal tracking-[0.015em] grow transition-transform hover:scale-105">
                          <span className="truncate">Book Now</span>
                        </button>
                      </Link>
                    ) : (
                      <Link to="/login" state={{ from: '/recommendations' }}>
                        <button className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-[#10B981] text-white text-base font-bold leading-normal tracking-[0.015em] grow transition-transform hover:scale-105">
                          <span className="truncate">Book Now</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;

