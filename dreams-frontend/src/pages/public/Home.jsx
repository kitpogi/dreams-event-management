import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PackageCard } from '../../components/features';
import heroLogo from '../../assets/hero-banner.jpg';
import { useAuth } from '../../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [packageLoading, setPackageLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    eventType: '',
    message: ''
  });
  const [featuredPortfolio, setFeaturedPortfolio] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchFeaturedPackages = async () => {
      try {
        const response = await api.get('/packages');
        setFeaturedPackages(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setPackageLoading(false);
      }
    };

    const fetchPortfolio = async () => {
      try {
        const response = await api.get('/portfolio-items', {
          params: { featured: true, limit: 6 }
        });
        setFeaturedPortfolio(response.data.data || response.data || []);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setPortfolioLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await api.get('/testimonials', {
          params: { featured: true, limit: 6 }
        });
        setFeaturedReviews(response.data.data || response.data || []);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchFeaturedPackages();
    fetchPortfolio();
    fetchReviews();
  }, []);
  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'DD';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await api.post('/contact', {
        name: formData.name,
        email: formData.email,
        event_type: formData.eventType,
        message: formData.message
      });

      if (response.data.success) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', eventType: '', message: '' });
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to submit inquiry. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSetEventClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setTimeout(() => {
        navigate('/login', { state: { from: '/packages' } });
      }, 2000);
    } else {
      navigate('/packages');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7F0]">
      {/* Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-[#5A45F2] rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-4xl">lock</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Login Required</h3>
              <p className="text-gray-600">
                Please log in or sign up to set an event and access our packages.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => navigate('/login', { state: { from: '/packages' } })}
                  className="px-6 py-2 bg-[#5A45F2] text-white rounded-md hover:bg-[#4a37d8] transition-colors font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2 border-2 border-[#5A45F2] text-[#5A45F2] rounded-md hover:bg-[#5A45F2] hover:text-white transition-colors font-medium"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero section */}
      <section className="w-full bg-[#050b23]" id="home">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 py-16 md:flex-row md:py-24 lg:px-8">
          <div className="flex flex-1 justify-center md:justify-start">
            <img
              src={heroLogo}
              alt="D'Dreams Events and Styles logo"
              className="h-auto max-w-xs text-white drop-shadow-lg md:max-w-sm"
            />
          </div>

          <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
            <span className="mb-4 text-sm font-bold uppercase tracking-wider text-[#7ee5ff]">
              Premier Event Planning Studio
            </span>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              We design the event of your dreams.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-gray-200">
              From intimate gatherings to grand celebrations, we bring your vision to life with creativity, elegance, and meticulous attention to detail.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button 
                onClick={handleSetEventClick}
                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md bg-[#5A45F2] px-6 py-3 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#4a37d8]"
              >
                <span className="truncate">Set an Event</span>
              </button>
              <Link to="/recommendations">
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-white bg-transparent px-6 py-3 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-white hover:text-[#050b23]">
                  <span className="truncate">Get Recommendations</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Packages Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24" id="services">
        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1f2933] sm:text-4xl">
            Featured Packages
          </h2>
          <p className="text-[#4b5563] mx-auto max-w-2xl text-base leading-normal">
            From meticulous planning to breathtaking design, we handle every detail to bring your vision to life.
          </p>
        </div>

        {packageLoading ? (
          <div className="text-center py-12 mt-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A45F2]"></div>
            <p className="mt-4 text-[#4b5563]">Loading packages...</p>
          </div>
        ) : featuredPackages.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredPackages.slice(0, 6).map((pkg) => (
              <PackageCard key={pkg.package_id || pkg.id} package={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mt-12">
            <p className="text-[#4b5563]">
              No featured packages available at the moment. Please check back soon.
            </p>
          </div>
        )}
      </section>

      {/* Portfolio Section */}
      <section className="w-full bg-[#f9f5ff] py-16 sm:py-24" id="portfolio">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-[#1f2933] sm:text-4xl">
              Explore Our Past Creations
            </h2>
            <p className="text-[#4b5563] mx-auto max-w-2xl text-base">
              A glimpse into the magical moments we&apos;ve helped create.
            </p>
          </div>
          {portfolioLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#5A45F2]"></div>
            </div>
          ) : featuredPortfolio.length === 0 ? (
            <p className="text-center text-[#4b5563] py-8">
              No featured portfolio entries yet. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPortfolio.map((item) => (
                <div key={item.id} className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl shadow-md">
                  <img
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    src={item.image_url || item.image_path}
                    alt={item.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-xl font-bold text-white">{item.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Full Portfolio Button */}
          <div className="flex justify-center mt-12">
            <Link to="/portfolio">
              <button className="flex min-w-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-md bg-[#5A45F2] px-8 py-3 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#4a37d8]">
                <span className="truncate">View Full Portfolio</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24" id="reviews">
        <div className="flex flex-col gap-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-[#1f2933] sm:text-4xl">
            What Our Clients Say
          </h2>
        </div>
        {reviewsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#5A45F2]"></div>
          </div>
        ) : featuredReviews.length === 0 ? (
          <p className="text-center text-[#4b5563]">
            No featured testimonials yet. Collect reviews from your clients to showcase them here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredReviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-4 rounded-xl border border-[#e7dbcf] bg-white p-6 shadow-sm">
                <p className="text-[#4b5563] italic">
                  &quot;{review.message}&quot;
                </p>
                <div className="flex items-center gap-4 mt-2">
                  {review.avatar_url ? (
                    <img
                      src={review.avatar_url}
                      alt={review.client_name}
                      className="h-12 w-12 rounded-full object-cover border border-[#e7dbcf]"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#5A45F2] flex items-center justify-center text-white font-bold">
                      {review.client_initials || getInitials(review.client_name)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-[#1f2933]">{review.client_name}</h4>
                    <p className="text-sm text-[#4b5563]">{review.event_type || '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Reviews Button */}
        <div className="flex justify-center mt-12">
          <Link to="/reviews">
            <button className="flex min-w-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-md bg-[#5A45F2] px-8 py-3 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#4a37d8]">
              <span className="truncate">View All Reviews</span>
            </button>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="w-full bg-[#f9f5ff] py-16 sm:py-24" id="contact">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex flex-col gap-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-[#1f2933] sm:text-4xl">
              Let&apos;s Create Something Beautiful Together
            </h2>
            <p className="text-[#4b5563] mx-auto max-w-2xl text-base">
              Have an idea for an event? We&apos;d love to hear about it. Fill out the form below for a personalized quote.
            </p>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
              <p className="font-medium">Thank you for your message!</p>
              <p className="text-sm">We will get back to you soon.</p>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              <p className="font-medium">Oops! Something went wrong.</p>
              <p className="text-sm">{submitError}</p>
            </div>
          )}

          <form className="space-y-6 text-left" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-1" htmlFor="name">
                  Name
                </label>
                <input
                  className="block w-full rounded-lg border border-[#e7dbcf] bg-white px-4 py-2 focus:border-[#5A45F2] focus:ring-[#5A45F2] focus:outline-none"
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  className="block w-full rounded-lg border border-[#e7dbcf] bg-white px-4 py-2 focus:border-[#5A45F2] focus:ring-[#5A45F2] focus:outline-none"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4b5563] mb-1" htmlFor="event-type">
                Event Type
              </label>
              <select
                className="block w-full rounded-lg border border-[#e7dbcf] bg-white px-4 py-2 focus:border-[#5A45F2] focus:ring-[#5A45F2] focus:outline-none"
                id="event-type"
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                required
              >
                <option value="">Select an event type</option>
                <option value="debut">Debut</option>
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday</option>
                <option value="pageant">Pageant</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4b5563] mb-1" htmlFor="message">
                Message
              </label>
              <textarea
                className="block w-full rounded-lg border border-[#e7dbcf] bg-white px-4 py-2 focus:border-[#5A45F2] focus:ring-[#5A45F2] focus:outline-none"
                id="message"
                name="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <div>
              <button
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#5A45F2] hover:bg-[#4a37d8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A45F2] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;

