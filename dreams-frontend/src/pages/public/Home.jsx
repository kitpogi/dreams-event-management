import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Calendar, Award, Star, ArrowRight, CheckCircle, Users, Clock, TrendingUp, Play, Pause } from 'lucide-react';
import api from '../../api/axios';
import { PackageCard, ParticlesBackground, NewsletterSignup } from '../../components/features';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../../components/ui';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useCounterAnimation } from '../../hooks/useCounterAnimation';
import heroLogo from '../../assets/hero-banner.jpg';
import { useAuth } from '../../context/AuthContext';
import { getAllServices } from '../../data/services';

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
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const services = getAllServices();
  
  // Scroll animations
  const servicesRef = useScrollAnimation({ threshold: 0.2 });
  const packagesRef = useScrollAnimation({ threshold: 0.2 });
  const portfolioRef = useScrollAnimation({ threshold: 0.2 });
  const reviewsRef = useScrollAnimation({ threshold: 0.2 });
  
  // Counter animations for statistics
  const happyClients = useCounterAnimation(500, 2000, statsVisible);
  const eventsPlanned = useCounterAnimation(1000, 2000, statsVisible);
  const avgRatingCount = useCounterAnimation(4.9, 2000, statsVisible);
  const yearsExp = useCounterAnimation(15, 2000, statsVisible);
  
  // Parallax effect
  const heroRef = useRef(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);

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

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setParallaxOffset(scrollY * 0.5);
      
      // Trigger stats animation when stats section is visible
      if (scrollY > 200 && !statsVisible) {
        setStatsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [statsVisible]);

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

  // Statistics data with animated values
  const stats = [
    { icon: Users, value: `${happyClients}+`, label: 'Happy Clients', target: 500 },
    { icon: Calendar, value: `${eventsPlanned}+`, label: 'Events Planned', target: 1000 },
    { icon: Star, value: avgRatingCount.toFixed(1), label: 'Average Rating', target: 4.9 },
    { icon: Award, value: `${yearsExp}+`, label: 'Years Experience', target: 15 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7F0] to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Login Required</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Please log in or sign up to set an event and access our packages.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => navigate('/login', { state: { from: '/packages' } })}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg hover:from-[#4a37d8] hover:to-[#6d28d9] transition-all font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2.5 border-2 border-[#5A45F2] text-[#5A45F2] rounded-lg hover:bg-[#5A45F2] hover:text-white transition-all font-medium"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Hero Section */}
      <section 
        ref={heroRef}
        className="relative w-full bg-gradient-to-br from-[#050b23] via-[#0f172a] to-[#050b23] overflow-hidden" 
        id="home"
      >
        {/* Particles Background */}
        <ParticlesBackground 
          particleCount={60}
          particleColor="rgba(122, 69, 242, 0.6)"
          lineColor="rgba(126, 229, 255, 0.3)"
          speed={0.3}
        />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-20 left-10 w-72 h-72 bg-[#5A45F2] opacity-10 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
          ></div>
          <div 
            className="absolute bottom-20 right-10 w-96 h-96 bg-[#7ee5ff] opacity-10 rounded-full blur-3xl animate-pulse delay-1000"
            style={{ transform: `translateY(${-parallaxOffset * 0.3}px)` }}
          ></div>
        </div>
        
        {/* Video Background Option (optional) */}
        {videoPlaying && (
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-20"
            >
              {/* Add video source here when available */}
              <source src="" type="video/mp4" />
            </video>
          </div>
        )}

        <div 
          className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 py-20 md:flex-row md:py-32 lg:px-8 z-10"
          style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
        >
          <div className="flex flex-1 justify-center md:justify-start z-10">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#5A45F2] to-[#7ee5ff] rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            <img
              src={heroLogo}
              alt="D'Dreams Events and Styles logo"
                className="relative h-auto max-w-xs text-white drop-shadow-2xl md:max-w-sm transform hover:scale-105 transition-transform duration-300"
            />
            </div>
          </div>
          
          {/* Video Toggle Button */}
          <button
            onClick={() => setVideoPlaying(!videoPlaying)}
            className="absolute top-4 right-4 z-20 p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white hover:bg-white/20 transition-all"
            aria-label="Toggle video background"
          >
            {videoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left z-10">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-[#5A45F2]/20 backdrop-blur-sm rounded-full border border-[#5A45F2]/30">
              <Sparkles className="w-4 h-4 text-[#7ee5ff]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[#7ee5ff]">
              Premier Event Planning Studio
            </span>
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
              We design the{' '}
              <span className="bg-gradient-to-r from-[#7ee5ff] to-[#5A45F2] bg-clip-text text-transparent">
                event of your dreams
              </span>
            </h1>
            
            <p className="mt-4 max-w-lg text-lg md:text-xl text-gray-300 leading-relaxed">
              From intimate gatherings to grand celebrations, we bring your vision to life with creativity, elegance, and meticulous attention to detail.
            </p>
            
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button 
                onClick={handleSetEventClick}
                className="group flex items-center justify-center gap-2 min-w-[84px] cursor-pointer overflow-hidden rounded-lg bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
              >
                <span className="truncate">Set an Event</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link to="/recommendations">
                <button className="flex items-center justify-center gap-2 min-w-[84px] cursor-pointer overflow-hidden rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-white/20 hover:border-white/50">
                  <span className="truncate">Get Recommendations</span>
                  <TrendingUp className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section with Counter Animation */}
      <section className="relative -mt-16 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8 transition-colors duration-300">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`text-center group transition-all duration-700 ${
                    statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Preview Section with Scroll Animation */}
      <section 
        ref={servicesRef.ref}
        className={`max-w-7xl mx-auto px-4 py-20 md:py-28 transition-all duration-700 ${
          servicesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        id="services"
      >
        <div className="flex flex-col gap-4 text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#5A45F2]" />
            <span className="text-sm font-bold uppercase tracking-wider text-[#5A45F2]">Our Services</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            What We Offer
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mx-auto max-w-2xl text-lg">
            Comprehensive event planning services tailored to make your special moments unforgettable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link
              key={service.id}
              to={service.link}
              className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-[#5A45F2]/20 transform hover:-translate-y-2 hover:scale-105 ${
                servicesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">{service.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#5A45F2] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[#5A45F2] font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#5A45F2]/0 to-[#7c3aed]/0 group-hover:from-[#5A45F2]/5 group-hover:to-[#7c3aed]/5 transition-all duration-300 pointer-events-none"></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Packages Section with Scroll Animation */}
      <section 
        ref={packagesRef.ref}
        className={`w-full bg-gradient-to-b from-white to-[#f9f5ff] dark:from-gray-800 dark:to-gray-900 py-20 md:py-28 transition-all duration-700 ${
          packagesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        id="packages"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-[#5A45F2]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[#5A45F2]">Featured Packages</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Our Premium Packages
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mx-auto max-w-2xl text-lg">
              From meticulous planning to breathtaking design, we handle every detail to bring your vision to life.
            </p>
          </div>

          {packageLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#5A45F2] border-t-transparent"></div>
              <p className="mt-6 text-gray-600 dark:text-gray-300 text-lg">Loading packages...</p>
          </div>
        ) : featuredPackages.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredPackages.slice(0, 6).map((pkg) => (
              <PackageCard key={pkg.package_id || pkg.id} package={pkg} />
            ))}
          </div>
              <div className="flex justify-center mt-12">
                <Link to="/packages">
                  <button className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <span>View All Packages</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </>
        ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
              No featured packages available at the moment. Please check back soon.
            </p>
          </div>
        )}
        </div>
      </section>

      {/* Portfolio Section with Scroll Animation */}
      <section 
        ref={portfolioRef.ref}
        className={`w-full bg-white dark:bg-gray-900 py-20 md:py-28 transition-all duration-700 ${
          portfolioRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        id="portfolio"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#5A45F2]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[#5A45F2]">Our Portfolio</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Explore Our Past Creations
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mx-auto max-w-2xl text-lg">
              A glimpse into the magical moments we&apos;ve helped create.
            </p>
          </div>
          
          {portfolioLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#5A45F2] border-t-transparent"></div>
            </div>
          ) : featuredPortfolio.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <Award className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
              No featured portfolio entries yet. Check back soon!
            </p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPortfolio.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                  <img
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={item.image_url || item.image_path}
                    alt={item.title}
                  />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                        {item.description && (
                          <p className="text-white/90 text-sm line-clamp-2">{item.description}</p>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          <div className="flex justify-center mt-12">
            <Link to="/portfolio">
                  <button className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <span>View Full Portfolio</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
            </>
          )}
        </div>
      </section>

      {/* Reviews Section with Carousel */}
      <section 
        ref={reviewsRef.ref}
        className={`w-full bg-gradient-to-b from-[#f9f5ff] to-white dark:from-gray-900 dark:to-gray-800 py-20 md:py-28 transition-all duration-700 ${
          reviewsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        id="reviews"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-[#5A45F2]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[#5A45F2]">Testimonials</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            What Our Clients Say
          </h2>
            <p className="text-gray-600 dark:text-gray-300 mx-auto max-w-2xl text-lg">
              Don&apos;t just take our word for it - hear from our satisfied clients
            </p>
        </div>
          
        {reviewsLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#5A45F2] border-t-transparent"></div>
          </div>
        ) : featuredReviews.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <Heart className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">
            No featured testimonials yet. Collect reviews from your clients to showcase them here.
          </p>
            </div>
        ) : (
            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {featuredReviews.map((review) => (
                    <CarouselItem key={review.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                      <div className="group flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#fbbf24] text-[#fbbf24]" />
                          ))}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed flex-grow italic">
                          &quot;{review.message}&quot;
                        </p>
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          {review.avatar_url ? (
                            <img
                              src={review.avatar_url}
                              alt={review.client_name}
                              className="h-12 w-12 rounded-full object-cover border-2 border-[#5A45F2]/20"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] flex items-center justify-center text-white font-bold shadow-md">
                              {review.client_initials || getInitials(review.client_name)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">{review.client_name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{review.event_type || 'Event Client'}</p>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-12" />
                <CarouselNext className="hidden md:flex -right-12" />
              </Carousel>
              <div className="flex justify-center mt-12">
                <Link to="/reviews">
                  <button className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <span>View All Reviews</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section className="w-full bg-gradient-to-br from-[#050b23] to-[#0f172a] py-20 md:py-28" id="contact">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#7ee5ff]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[#7ee5ff]">Get In Touch</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Let&apos;s Create Something Beautiful Together
            </h2>
            <p className="text-gray-300 mx-auto max-w-2xl text-lg">
              Have an idea for an event? We&apos;d love to hear about it. Fill out the form below for a personalized quote.
            </p>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-6 p-6 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl text-green-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6" />
                <p className="font-bold text-lg">Thank you for your message!</p>
              </div>
              <p className="text-sm">We will get back to you soon.</p>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-6 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-100 text-center">
              <p className="font-medium">Oops! Something went wrong.</p>
              <p className="text-sm mt-1">{submitError}</p>
            </div>
          )}

          <form className="space-y-6 text-left bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-white/20" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  className="block w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 px-4 py-3 focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#7ee5ff]/20 focus:outline-none transition-all"
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  className="block w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 px-4 py-3 focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#7ee5ff]/20 focus:outline-none transition-all"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2" htmlFor="event-type">
                Event Type
              </label>
              <select
                className="block w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white px-4 py-3 focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#7ee5ff]/20 focus:outline-none transition-all"
                id="event-type"
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                required
              >
                <option value="" className="bg-[#050b23]">Select an event type</option>
                <option value="debut" className="bg-[#050b23]">Debut</option>
                <option value="wedding" className="bg-[#050b23]">Wedding</option>
                <option value="birthday" className="bg-[#050b23]">Birthday</option>
                <option value="pageant" className="bg-[#050b23]">Pageant</option>
                <option value="other" className="bg-[#050b23]">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2" htmlFor="message">
                Message
              </label>
              <textarea
                className="block w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 px-4 py-3 focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#7ee5ff]/20 focus:outline-none transition-all resize-none"
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us about your event vision..."
                required
              ></textarea>
            </div>
            <div>
              <button
                className="w-full group flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-lg shadow-lg text-base font-bold text-white bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] hover:from-[#4a37d8] hover:to-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A45F2] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <NewsletterSignup />
    </div>
  );
};

export default Home;
