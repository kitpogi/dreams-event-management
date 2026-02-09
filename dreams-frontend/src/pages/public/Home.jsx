import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Calendar, Award, Star, ArrowRight, CheckCircle, Users, ChevronLeft, ChevronRight, Phone, MessageCircle, Lightbulb, Palette, PartyPopper, ShoppingCart, Play } from 'lucide-react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/ui';
import { ParticlesBackground, AnimatedBackground, NewsletterSignup } from '../../components/features';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useCounterAnimation } from '../../hooks/useCounterAnimation';
import heroLogo from '../../assets/hero-banner.jpg';
import { getAllServices } from '../../data/services';

// How It Works Steps
const howItWorksSteps = [
  { icon: MessageCircle, title: "Book a Consultation", description: "Schedule a free consultation to discuss your event vision and requirements." },
  { icon: Lightbulb, title: "Share Your Vision", description: "Tell us about your dream event - theme, style, budget, and all the special details." },
  { icon: Palette, title: "We Plan Everything", description: "Our expert team handles all the planning, vendor coordination, and logistics." },
  { icon: PartyPopper, title: "Enjoy Your Event", description: "Relax and enjoy your perfectly executed celebration while we handle everything." }
];

// Team members data
const teamMembers = [
  { initials: 'JD', name: 'Jane Doe', role: 'Founder & Lead Planner', gradient: 'from-[#5A45F2] to-[#7c3aed]' },
  { initials: 'MS', name: 'Maria Santos', role: 'Creative Director', gradient: 'from-[#7ee5ff] to-[#5A45F2]' },
  { initials: 'AC', name: 'Ana Cruz', role: 'Event Coordinator', gradient: 'from-[#7c3aed] to-[#7ee5ff]' },
  { initials: 'RG', name: 'Ramon Garcia', role: 'Decor Specialist', gradient: 'from-[#5A45F2] to-[#7c3aed]' }
];

// Service categories
const serviceCategories = ['All Services', 'Weddings', 'Debuts', 'Birthdays', 'Corporate', 'Pageants'];

const Home = () => {
  const navigate = useNavigate();
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [packageLoading, setPackageLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', eventType: '', eventDate: '', budget: '', message: '' });
  const [featuredPortfolio, setFeaturedPortfolio] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Services');
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [dbServices, setDbServices] = useState([]);
  const [dbTeam, setDbTeam] = useState([]);
  const [dbStats, setDbStats] = useState({ happy_clients: 500, events_planned: 1000, years_experience: 15, avg_rating: 4.9 });
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const packagesScrollRef = useRef(null);

  // Scroll animations
  const howItWorksRef = useScrollAnimation({ threshold: 0.2 });
  const servicesRef = useScrollAnimation({ threshold: 0.2 });
  const packagesRef = useScrollAnimation({ threshold: 0.2 });
  const portfolioRef = useScrollAnimation({ threshold: 0.2 });
  const reviewsRef = useScrollAnimation({ threshold: 0.2 });
  const teamRef = useScrollAnimation({ threshold: 0.2 });

  // Counter animations
  const happyClients = useCounterAnimation(dbStats.happy_clients || 500, 2000, statsVisible);
  const eventsPlanned = useCounterAnimation(dbStats.events_planned || 1000, 2000, statsVisible);
  const avgRatingCount = useCounterAnimation(dbStats.avg_rating || 4.9, 2000, statsVisible);
  const yearsExp = useCounterAnimation(dbStats.years_experience || 15, 2000, statsVisible);

  const heroRef = useRef(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesRes, portfolioRes, reviewsRes, servicesRes, teamRes, statsRes] = await Promise.all([
          api.get('/packages'),
          api.get('/portfolio-items', { params: { featured: true, limit: 6 } }),
          api.get('/testimonials', { params: { featured: true, limit: 6 } }),
          api.get('/services'),
          api.get('/team-members'),
          api.get('/public-stats')
        ]);

        setFeaturedPackages(packagesRes.data.data || packagesRes.data);
        setFeaturedPortfolio(portfolioRes.data.data || portfolioRes.data || []);
        setFeaturedReviews(reviewsRes.data.data || reviewsRes.data || []);
        setDbServices(servicesRes.data.data || servicesRes.data || []);
        setDbTeam(teamRes.data.data || teamRes.data || []);
        setDbStats(statsRes.data.data || statsRes.data || statsRes.data.stats || dbStats);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setPackageLoading(false);
        setPortfolioLoading(false);
        setReviewsLoading(false);
        setLoadingServices(false);
        setLoadingTeam(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setParallaxOffset(window.scrollY * 0.5);
      if (window.scrollY > 200 && !statsVisible) setStatsVisible(true);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [statsVisible]);

  const getInitials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'DD';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    try {
      const response = await api.post('/contact', {
        name: formData.name, email: formData.email, mobile_number: formData.phone || null,
        event_type: formData.eventType, date_of_event: formData.eventDate || null,
        preferred_venue: 'TBD', budget: formData.budget ? formData.budget.replace(/[^0-9]/g, '') : null, message: formData.message
      });
      if (response.data.success) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', phone: '', eventType: '', eventDate: '', budget: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSetEventClick = () => navigate('/set-an-event');
  const scrollPackages = (dir) => packagesScrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  const nextReview = () => setCurrentReviewIndex((p) => (p + 1) % Math.max(1, featuredReviews.length - 2));
  const prevReview = () => setCurrentReviewIndex((p) => (p - 1 + Math.max(1, featuredReviews.length - 2)) % Math.max(1, featuredReviews.length - 2));

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Sample high-quality background images
  const backgroundImages = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80', // Wedding scene
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80', // Elegant table setting
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80', // Party celebration
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80'  // Event lightings
  ];

  // Carousel timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Changed to 5 seconds as 1 second is too fast for transitions
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { icon: Users, value: `${happyClients}+`, label: 'Happy Clients' },
    { icon: Calendar, value: `${eventsPlanned}+`, label: 'Events Planned' },
    { icon: Award, value: `${yearsExp}+`, label: 'Years Experience' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {/* ========== HERO SECTION ========== */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image Carousel */}
        <div className="absolute inset-0 z-0">
          {backgroundImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBgIndex ? 'opacity-40' : 'opacity-0'
                }`}
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
          {/* Main Overlay for readability and depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0a0a1a]/80 to-transparent z-0" />
        </div>

        <AnimatedBackground type="mesh" colors={['#5A45F2', '#7c3aed', '#7ee5ff']} speed={0.5} direction="diagonal" blur={true} />
        <ParticlesBackground particleCount={80} particleColor="rgba(122, 69, 242, 0.5)" lineColor="rgba(126, 229, 255, 0.2)" speed={0.3} interactive={true} />

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-[10%] w-64 h-64 bg-[#5A45F2] opacity-20 rounded-full blur-[100px] animate-pulse" style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }} />
          <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-[#7ee5ff] opacity-15 rounded-full blur-[120px] animate-pulse" style={{ transform: `translateY(${-parallaxOffset * 0.2}px)` }} />
        </div>

        <div className="grid lg:grid-cols-2 min-h-screen w-full z-10">
          {/* Left Side: Editorial Content */}
          <div className="flex flex-col justify-center px-8 md:px-20 py-20 bg-[#0a0a1a] relative overflow-hidden">
            {/* Background elements for left side */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-[#5A45F2] rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 mb-12">
                <div className="w-12 h-px bg-[#7ee5ff]/50" />
                <span className="text-xs md:text-sm font-bold tracking-[0.5em] uppercase text-[#7ee5ff] animate-pulse">D'Dreams Studio</span>
              </div>

              <div className="relative h-40 md:h-56 mb-12">
                {backgroundImages.map((_, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-1000 transform ${index === currentBgIndex ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
                      }`}
                  >
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white leading-[0.9] tracking-tighter">
                      {index === 0 && "Pure\nElegance"}
                      {index === 1 && "Visionary\nDesign"}
                      {index === 2 && "Perfect\nDetails"}
                      {index === 3 && "Magic\nEvents"}
                    </h1>
                  </div>
                ))}
              </div>

              <p className="text-xl md:text-2xl text-gray-400 font-light max-w-md mb-12 leading-relaxed">
                Curating high-end experiences that define your most precious moments.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <button
                  onClick={() => {
                    const el = document.getElementById('contact');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-10 py-5 bg-[#5A45F2] text-white font-bold rounded-full hover:bg-[#7ee5ff] hover:text-[#0a0a1a] transition-all duration-500 shadow-xl shadow-[#5A45F2]/20"
                >
                  Start Planning
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('portfolio');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-10 py-5 bg-transparent text-white font-bold rounded-full border border-white/20 hover:bg-white hover:text-[#0a0a1a] transition-all duration-500"
                >
                  Our Portfolio
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Cinematic Carousel */}
          <div className="relative min-h-[50vh] lg:min-h-full overflow-hidden group">
            {backgroundImages.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${index === currentBgIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
              >
                <div
                  className={`w-full h-full bg-cover bg-center transition-transform [transition-duration:5000ms] ease-out ${index === currentBgIndex ? 'scale-110' : 'scale-100'}`}
                  style={{ backgroundImage: `url(${img})` }}
                />
              </div>
            ))}
            {/* Visual overlay for the image side */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a1a] to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-12 right-12 z-30 flex items-center gap-4">
              <span className="text-white/40 text-sm font-bold tracking-widest">{currentBgIndex + 1} / {backgroundImages.length}</span>
              <div className="w-12 h-px bg-white/20" />
            </div>
          </div>
        </div>

        {/* Scroll indicator overlay - Refactored to prevent layout shifts */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 hidden lg:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1.5 backdrop-blur-sm">
            <div className="w-1 h-2 bg-[#7ee5ff] rounded-full animate-[scroll-dot_2s_infinite_ease-in-out]" />
          </div>
        </div>
      </section>



      {/* ========== HOW IT WORKS - White Background ========== */}
      <section ref={howItWorksRef.ref} className={`py-24 bg-white dark:bg-gray-900 transition-all duration-700 ${howItWorksRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/10 text-[#5A45F2] text-sm font-semibold rounded-full mb-4">Simple Process</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Our streamlined 4-step process makes planning your dream event effortless</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-[#5A45F2]/20 via-[#5A45F2] to-[#5A45F2]/20" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorksSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className={`relative text-center transition-all duration-700 ${howItWorksRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 150}ms` }}>
                    <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                      <Icon className="w-9 h-9 text-[#5A45F2]" />
                      <span className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg">{i + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========== SERVICES - Gray Background ========== */}
      <section ref={servicesRef.ref} className={`py-24 bg-gray-50 dark:bg-gray-800 transition-all duration-700 min-h-[600px] ${servicesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} id="services">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/10 text-[#5A45F2] text-sm font-semibold rounded-full mb-4">What We Offer</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">Our Premium Services</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Comprehensive event solutions tailored for every occasion</p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {serviceCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${activeCategory === cat ? 'bg-[#5A45F2] text-white shadow-lg shadow-[#5A45F2]/30' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingServices ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
              ))
            ) : dbServices.length > 0 ? (
              dbServices.slice(0, 6).map((service, i) => (
                <Link key={service.id} to={service.link || '/packages'} className={`group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 dark:border-gray-700 ${servicesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image_url || service.images?.[0] || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-[#5A45F2]/80 transition-all duration-500" />
                    <div className="absolute bottom-4 left-4">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:bg-[#5A45F2] transition-colors">
                        <span className="material-symbols-outlined text-xl">{service.icon || 'star'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-[#5A45F2] transition-colors">{service.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex items-center text-[#5A45F2] font-medium text-sm">
                      <span>Explore Packages</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-500">No services available from database yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* ========== POPULAR PACKAGES - White Background ========== */}
      <section ref={packagesRef.ref} className={`py-24 bg-white dark:bg-gray-900 transition-all duration-700 min-h-[500px] ${packagesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} id="packages">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/10 text-[#5A45F2] text-sm font-semibold rounded-full mb-4">Top Picks</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">Popular Packages</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Our most loved packages by customers</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scrollPackages('left')} className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-[#5A45F2] hover:text-white transition-all duration-300 border border-gray-200 dark:border-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scrollPackages('right')} className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-[#5A45F2] hover:text-white transition-all duration-300 border border-gray-200 dark:border-gray-700">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {packageLoading ? (
            <div className="flex gap-6 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80 h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : featuredPackages.length > 0 ? (
            <div ref={packagesScrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none' }}>
              {featuredPackages.slice(0, 8).map((pkg) => (
                <div key={pkg.package_id || pkg.id} className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={pkg.package_image || pkg.image_url || pkg.image || `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600`}
                      alt={pkg.package_name || pkg.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{pkg.package_name || pkg.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">{pkg.package_description || pkg.description || 'Premium event package'}</p>
                    <p className="text-xs text-gray-400 mb-4">{pkg.bookings_count || 0} bookings</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">₱{Number(pkg.package_price || pkg.price || 0).toLocaleString()}</span>
                      <Link to={`/set-an-event?package=${pkg.package_id || pkg.id}`} className="w-11 h-11 bg-[#5A45F2] rounded-xl flex items-center justify-center hover:bg-[#4a37d8] transition-colors shadow-lg shadow-[#5A45F2]/30" title="Book this event">
                        <Calendar className="w-5 h-5 text-white" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No packages available.</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== PORTFOLIO - Gray Background ========== */}
      <section ref={portfolioRef.ref} className={`py-24 bg-gray-50 dark:bg-gray-800 transition-all duration-700 min-h-[700px] ${portfolioRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} id="portfolio">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/10 text-[#5A45F2] text-sm font-semibold rounded-full mb-4">Our Work</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">Portfolio</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">A glimpse into the magical celebrations we've created</p>
          </div>

          {portfolioLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : featuredPortfolio.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPortfolio.map((item, i) => (
                  <div key={item.id} className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg cursor-pointer" style={{ animationDelay: `${i * 100}ms` }}>
                    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={item.image_url || item.image_path} alt={item.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                        {item.description && <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-12">
                <Link to="/portfolio" className="group inline-flex items-center gap-2 px-8 py-4 bg-[#5A45F2] text-white font-bold rounded-full shadow-lg shadow-[#5A45F2]/30 hover:shadow-xl hover:scale-105 transition-all">
                  <span>View Full Portfolio</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No portfolio entries yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== TESTIMONIALS - White Background ========== */}
      <section ref={reviewsRef.ref} className={`py-24 bg-white dark:bg-gray-900 transition-all duration-700 ${reviewsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} id="reviews">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/10 text-[#5A45F2] text-sm font-semibold rounded-full mb-4">Testimonials</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">What Our Customers Say</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Real experiences from our valued clients</p>
          </div>

          {reviewsLoading ? (
            <LoadingSpinner variant="section" size="lg" />
          ) : featuredReviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredReviews.slice(currentReviewIndex, currentReviewIndex + 3).map((review, i) => (
                  <div key={review.id} className={`p-6 rounded-2xl transition-all duration-300 ${i === 0 ? 'bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] text-white shadow-xl shadow-[#5A45F2]/20' : 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}>
                    <p className={`leading-relaxed mb-6 ${i === 0 ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>"{review.message}"</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-white/20 text-white' : 'bg-[#5A45F2] text-white'}`}>
                        {review.avatar_url ? <img src={review.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(review.client_name)}
                      </div>
                      <div>
                        <p className={`font-bold ${i === 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{review.client_name}</p>
                        <p className={`text-sm ${i === 0 ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>{review.event_type || 'Event Client'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-3 mt-10">
                <button onClick={prevReview} className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-[#5A45F2] hover:text-white transition-all border border-gray-200 dark:border-gray-700">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextReview} className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-[#5A45F2] hover:text-white transition-all border border-gray-200 dark:border-gray-700">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No testimonials yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== TEAM - Gray Background ========== */}
      <section ref={teamRef.ref} className={`py-24 bg-gray-50 dark:bg-gray-800 transition-all duration-700 min-h-[600px] ${teamRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/10 text-[#5A45F2] text-sm font-semibold rounded-full mb-4">Our Experts</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">Meet Our Team</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Talented event specialists dedicated to making your celebrations unforgettable</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingTeam ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
              ))
            ) : dbTeam.length > 0 ? (
              dbTeam.slice(0, 4).map((member, i) => (
                <div key={i} className={`group text-center transition-all duration-700 ${teamRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="relative mb-5 aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                    <img
                      src={member.image_url || member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className={`w-12 h-1 bg-gradient-to-r ${member.gradient || 'from-[#5A45F2] to-[#7c3aed]'} rounded-full mb-2`} />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{member.name}</h3>
                  <p className="text-[#5A45F2] text-sm font-medium">{member.role}</p>
                </div>
              ))
            ) : (
              teamMembers.map((member, i) => (
                <div key={i} className={`group text-center transition-all duration-700 ${teamRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="relative mb-5 aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className={`w-12 h-1 bg-gradient-to-r ${member.gradient} rounded-full mb-2`} />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{member.name}</h3>
                  <p className="text-[#5A45F2] text-sm font-medium">{member.role}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ========== CONTACT CTA - White/Dark Background ========== */}
      <section className="pt-24 pb-12 bg-white dark:bg-gradient-to-br dark:from-[#0a0a1a] dark:via-[#1a1a3a] dark:to-[#0a0a1a] relative overflow-hidden" id="contact">
        <div className="absolute inset-0 pointer-events-none dark:block hidden">
          <div className="absolute top-20 left-[20%] w-64 h-64 bg-[#5A45F2] opacity-10 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-[20%] w-80 h-80 bg-[#7ee5ff] opacity-10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/10 dark:bg-white/10 dark:backdrop-blur-sm text-[#5A45F2] dark:text-[#7ee5ff] text-sm font-semibold rounded-full mb-4 dark:border dark:border-white/10">Get In Touch</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">Let's Create Magic Together</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Ready to start planning your dream event? Fill out the form and we'll get back to you within 24 hours.</p>
          </div>

          {submitSuccess && (
            <div className="mb-6 p-5 bg-green-100 dark:bg-green-500/20 dark:backdrop-blur-sm border border-green-300 dark:border-green-500/30 rounded-2xl text-green-700 dark:text-green-100 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bold">Thank you! We'll be in touch soon.</p>
            </div>
          )}

          {submitError && (
            <div className="mb-6 p-5 bg-red-100 dark:bg-red-500/20 dark:backdrop-blur-sm border border-red-300 dark:border-red-500/30 rounded-2xl text-red-700 dark:text-red-100 text-center">
              <p>{submitError}</p>
            </div>
          )}

          <form className="bg-gray-50 dark:bg-white/5 dark:backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <input className="w-full px-5 py-4 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#5A45F2] dark:focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#5A45F2]/20 dark:focus:ring-[#7ee5ff]/20 outline-none transition-all" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Your Name" required />
              <input className="w-full px-5 py-4 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#5A45F2] dark:focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#5A45F2]/20 dark:focus:ring-[#7ee5ff]/20 outline-none transition-all" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <input className="w-full px-5 py-4 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#5A45F2] dark:focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#5A45F2]/20 dark:focus:ring-[#7ee5ff]/20 outline-none transition-all" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />
              <input className="w-full px-5 py-4 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#5A45F2] dark:focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#5A45F2]/20 dark:focus:ring-[#7ee5ff]/20 outline-none transition-all" name="eventDate" type="date" value={formData.eventDate} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <select className="w-full px-5 py-4 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white focus:border-[#5A45F2] dark:focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#5A45F2]/20 dark:focus:ring-[#7ee5ff]/20 outline-none transition-all" name="eventType" value={formData.eventType} onChange={handleChange} required>
                <option value="" className="bg-white dark:bg-gray-900">Select Event Type</option>
                <option value="wedding" className="bg-white dark:bg-gray-900">Wedding</option>
                <option value="debut" className="bg-white dark:bg-gray-900">Debut</option>
                <option value="birthday" className="bg-white dark:bg-gray-900">Birthday</option>
                <option value="corporate" className="bg-white dark:bg-gray-900">Corporate</option>
                <option value="other" className="bg-white dark:bg-gray-900">Other</option>
              </select>
              <select className="w-full px-5 py-4 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white focus:border-[#5A45F2] dark:focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#5A45F2]/20 dark:focus:ring-[#7ee5ff]/20 outline-none transition-all" name="budget" value={formData.budget} onChange={handleChange}>
                <option value="" className="bg-white dark:bg-gray-900">Budget Range</option>
                <option value="below-50k" className="bg-white dark:bg-gray-900">Below ₱50,000</option>
                <option value="50k-100k" className="bg-white dark:bg-gray-900">₱50,000 - ₱100,000</option>
                <option value="100k-200k" className="bg-white dark:bg-gray-900">₱100,000 - ₱200,000</option>
                <option value="above-200k" className="bg-white dark:bg-gray-900">Above ₱200,000</option>
              </select>
            </div>
            <textarea className="w-full px-5 py-4 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#5A45F2] dark:focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#5A45F2]/20 dark:focus:ring-[#7ee5ff]/20 outline-none transition-all resize-none mb-6" name="message" rows="4" value={formData.message} onChange={handleChange} placeholder="Tell us about your dream event..." required />
            <button type="submit" disabled={submitting} className="w-full py-4 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white font-bold rounded-xl shadow-lg shadow-[#5A45F2]/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><LoadingSpinner size="sm" className="text-white" /> Sending...</> : <>Send Message <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </section>

      {/* Divider line between Contact and Newsletter */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#0a0a1a] dark:via-[#1a1a3a] dark:to-[#0a0a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent" />
        </div>
      </div>

      <NewsletterSignup />

      {/* WhatsApp */}
      <a href="https://wa.me/639XXXXXXXXX" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 group">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
          <div className="relative w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-xl flex items-center justify-center group-hover:scale-110 transition-all">
            <Phone className="w-6 h-6 text-white" />
          </div>
        </div>
      </a>
    </div>
  );
};

export default Home;
