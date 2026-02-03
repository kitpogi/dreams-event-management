import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Calendar, Award, Star, ArrowRight, CheckCircle, Users, TrendingUp, Play, Pause, MessageCircle, Lightbulb, Palette, PartyPopper, ThumbsUp } from 'lucide-react';
import api from '../../api/axios';
import { PackageCard, ParticlesBackground, AnimatedBackground, NewsletterSignup } from '../../components/features';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../../components/ui';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useCounterAnimation } from '../../hooks/useCounterAnimation';
import heroLogo from '../../assets/hero-banner.jpg';
import { getAllServices } from '../../data/services';

// FAQ Data
const faqData = [
  {
    question: "How far in advance should I book my event?",
    answer: "We recommend booking at least 3-6 months in advance for most events. For weddings and large celebrations, 6-12 months is ideal to ensure we can secure your preferred vendors and venue."
  },
  {
    question: "What types of events do you specialize in?",
    answer: "We specialize in weddings, debuts, birthdays, corporate events, pageants, and other special celebrations. Our team has extensive experience in creating memorable experiences for all types of occasions."
  },
  {
    question: "Do you offer customizable packages?",
    answer: "Absolutely! While we have pre-designed packages, we understand every event is unique. We can customize any package to fit your specific needs, preferences, and budget."
  },
  {
    question: "What is included in your event planning services?",
    answer: "Our services typically include venue coordination, vendor management, timeline creation, day-of coordination, decor setup, and guest management. Specific inclusions vary by package."
  },
  {
    question: "How do payments work?",
    answer: "We typically require a 50% deposit to secure your date, with the remaining balance due 2 weeks before the event. We accept various payment methods for your convenience."
  },
  {
    question: "Can I visit your office for a consultation?",
    answer: "Yes! We offer free initial consultations at our office or via video call. During this meeting, we'll discuss your vision, budget, and how we can bring your dream event to life."
  }
];

// How It Works Steps
const howItWorksSteps = [
  {
    icon: MessageCircle,
    title: "Book a Consultation",
    description: "Schedule a free consultation to discuss your event vision and requirements."
  },
  {
    icon: Lightbulb,
    title: "Share Your Vision",
    description: "Tell us about your dream event - theme, style, budget, and all the special details."
  },
  {
    icon: Palette,
    title: "We Plan Everything",
    description: "Our expert team handles all the planning, vendor coordination, and logistics."
  },
  {
    icon: PartyPopper,
    title: "Enjoy Your Event",
    description: "Relax and enjoy your perfectly executed celebration while we handle everything."
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [packageLoading, setPackageLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    budget: '',
    message: ''
  });
  const [featuredPortfolio, setFeaturedPortfolio] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const services = getAllServices();

  // Scroll animations
  const servicesRef = useScrollAnimation({ threshold: 0.2 });
  const packagesRef = useScrollAnimation({ threshold: 0.2 });
  const portfolioRef = useScrollAnimation({ threshold: 0.2 });
  const reviewsRef = useScrollAnimation({ threshold: 0.2 });
  const howItWorksRef = useScrollAnimation({ threshold: 0.2 });
  const faqRef = useScrollAnimation({ threshold: 0.2 });

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
        mobile_number: formData.phone || null,
        event_type: formData.eventType,
        date_of_event: formData.eventDate || null,
        preferred_venue: 'TBD', // Will be discussed during consultation
        budget: formData.budget ? formData.budget.replace(/[^0-9]/g, '') : null,
        message: formData.message
      });

      if (response.data.success) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', phone: '', eventType: '', eventDate: '', budget: '', message: '' });

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
    // Navigate directly to set-an-event page (no auth required to view form)
    navigate('/set-an-event');
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
      {/* Enhanced Hero Section */}
      <section
        ref={heroRef}
        className="relative w-full bg-gradient-to-br from-[#050b23] via-[#0f172a] to-[#050b23] overflow-hidden"
        id="home"
      >
        {/* Animated Background - Gradient Mesh */}
        <AnimatedBackground
          type="mesh"
          colors={['#5A45F2', '#7c3aed', '#7ee5ff']}
          speed={0.5}
          direction="diagonal"
          blur={true}
        />

        {/* Particles Background */}
        <ParticlesBackground
          particleCount={60}
          particleColor="rgba(122, 69, 242, 0.6)"
          lineColor="rgba(126, 229, 255, 0.3)"
          speed={0.3}
          interactive={true}
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
                  className={`text-center group transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
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

      {/* How It Works Section */}
      <section
        ref={howItWorksRef.ref}
        className={`max-w-7xl mx-auto px-4 py-20 md:py-28 transition-all duration-700 ${howItWorksRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        id="how-it-works"
      >
        <div className="flex flex-col gap-4 text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <ThumbsUp className="w-5 h-5 text-[#5A45F2]" />
            <span className="text-sm font-bold uppercase tracking-wider text-[#5A45F2]">Simple Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            How It Works
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mx-auto max-w-2xl text-lg">
            From initial consultation to your perfect event - here&apos;s our simple 4-step process
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#5A45F2]/30 to-transparent"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className={`relative flex flex-col items-center text-center transition-all duration-700 ${howItWorksRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#7ee5ff] text-[#050b23] rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-10">
                    {index + 1}
                  </div>

                  {/* Icon Circle */}
                  <div className="relative w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                    <Icon className="w-10 h-10" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center mt-12">
          <button
            onClick={handleSetEventClick}
            className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <span>Start Planning Your Event</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Services Preview Section with Scroll Animation */}
      <section
        ref={servicesRef.ref}
        className={`max-w-7xl mx-auto px-4 py-20 md:py-28 transition-all duration-700 ${servicesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        id="services"
      >
        <div className="flex flex-col gap-4 text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
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
              className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-[#5A45F2]/20 transform hover:-translate-y-2 hover:scale-105 ${servicesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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
        className={`w-full bg-gradient-to-b from-white to-[#f9f5ff] dark:from-gray-800 dark:to-gray-900 py-20 md:py-28 transition-all duration-700 ${packagesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        id="packages"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-[#5A45F2] fill-[#5A45F2]" />
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
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#5A45F2] dark:border-[#7ee5ff] border-t-transparent"></div>
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                <Calendar className="w-10 h-10 text-gray-400 dark:text-gray-500" />
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
        className={`w-full bg-white dark:bg-gray-900 py-20 md:py-28 transition-all duration-700 ${portfolioRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        id="portfolio"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
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
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#5A45F2] dark:border-[#7ee5ff] border-t-transparent"></div>
            </div>
          ) : featuredPortfolio.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                <Award className="w-10 h-10 text-gray-400 dark:text-gray-500" />
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
        className={`w-full bg-gradient-to-b from-[#f9f5ff] to-white dark:from-gray-900 dark:to-gray-800 py-20 md:py-28 transition-all duration-700 ${reviewsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        id="reviews"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
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
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#5A45F2] dark:border-[#7ee5ff] border-t-transparent"></div>
            </div>
          ) : featuredReviews.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                <Heart className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
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

      {/* Trust Badges / Why Choose Us Section */}
      <section className="w-full bg-white dark:bg-gray-900 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#5A45F2]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[#5A45F2]">Why Choose Us</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Why Clients Trust Us
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Trust Badge 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[#5A45F2]/10 to-[#7c3aed]/10">
                <CheckCircle className="w-8 h-8 text-[#5A45F2]" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Fully Licensed</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Registered business with complete permits</p>
            </div>

            {/* Trust Badge 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[#5A45F2]/10 to-[#7c3aed]/10">
                <Award className="w-8 h-8 text-[#5A45F2]" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Award Winning</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recognized for excellence in event planning</p>
            </div>

            {/* Trust Badge 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[#5A45F2]/10 to-[#7c3aed]/10">
                <Users className="w-8 h-8 text-[#5A45F2]" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Expert Team</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Experienced professionals dedicated to your event</p>
            </div>

            {/* Trust Badge 4 */}
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[#5A45F2]/10 to-[#7c3aed]/10">
                <Heart className="w-8 h-8 text-[#5A45F2]" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">100% Satisfaction</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Committed to exceeding your expectations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="w-full bg-gradient-to-b from-[#f9f5ff] to-white dark:from-gray-800 dark:to-gray-900 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#5A45F2]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[#5A45F2]">Our Team</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Meet the Creative Minds
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mx-auto max-w-2xl text-lg">
              Our passionate team of event specialists dedicated to making your celebrations unforgettable
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="aspect-[3/4] bg-gradient-to-br from-[#5A45F2]/20 to-[#7c3aed]/30 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                    JD
                  </div>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#5A45F2] to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex items-end justify-center pb-8">
                  <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Jane Doe</h3>
                <p className="text-[#5A45F2] font-medium mb-2">Founder & Lead Planner</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">10+ years of experience creating magical events</p>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="aspect-[3/4] bg-gradient-to-br from-[#7ee5ff]/20 to-[#5A45F2]/30 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7ee5ff] to-[#5A45F2] flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                    MS
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#5A45F2] to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex items-end justify-center pb-8">
                  <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Maria Santos</h3>
                <p className="text-[#5A45F2] font-medium mb-2">Creative Director</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Turning visions into stunning realities</p>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="aspect-[3/4] bg-gradient-to-br from-[#7c3aed]/20 to-[#7ee5ff]/30 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#7ee5ff] flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                    AC
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#5A45F2] to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex items-end justify-center pb-8">
                  <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Ana Cruz</h3>
                <p className="text-[#5A45F2] font-medium mb-2">Event Coordinator</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Detail-oriented perfectionist</p>
              </div>
            </div>

            {/* Team Member 4 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="aspect-[3/4] bg-gradient-to-br from-[#5A45F2]/20 to-[#7c3aed]/30 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                    RG
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#5A45F2] to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex items-end justify-center pb-8">
                  <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Ramon Garcia</h3>
                <p className="text-[#5A45F2] font-medium mb-2">Decor Specialist</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transforms venues into dream spaces</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        ref={faqRef.ref}
        className={`max-w-4xl mx-auto px-4 py-20 md:py-28 transition-all duration-700 ${faqRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        id="faq"
      >
        <div className="flex flex-col gap-4 text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-[#5A45F2]" />
            <span className="text-sm font-bold uppercase tracking-wider text-[#5A45F2]">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mx-auto max-w-2xl text-lg">
            Find answers to common questions about our event planning services
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${faqRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-[#5A45F2]/20 rounded-xl"
              >
                <span className="font-bold text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#5A45F2] flex-shrink-0 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''
                    }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <p className="px-6 pb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section className="w-full bg-gradient-to-br from-[#050b23] to-[#0f172a] py-20 md:py-28" id="contact">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col gap-4 text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-[#7ee5ff]" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  className="block w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 px-4 py-3 focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#7ee5ff]/20 focus:outline-none transition-all"
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2" htmlFor="event-date">
                  Preferred Event Date
                </label>
                <input
                  className="block w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 px-4 py-3 focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#7ee5ff]/20 focus:outline-none transition-all"
                  id="event-date"
                  name="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  <option value="corporate" className="bg-[#050b23]">Corporate Event</option>
                  <option value="pageant" className="bg-[#050b23]">Pageant</option>
                  <option value="other" className="bg-[#050b23]">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2" htmlFor="budget">
                  Estimated Budget
                </label>
                <select
                  className="block w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white px-4 py-3 focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#7ee5ff]/20 focus:outline-none transition-all"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                >
                  <option value="" className="bg-[#050b23]">Select your budget range</option>
                  <option value="below-50k" className="bg-[#050b23]">Below ₱50,000</option>
                  <option value="50k-100k" className="bg-[#050b23]">₱50,000 - ₱100,000</option>
                  <option value="100k-200k" className="bg-[#050b23]">₱100,000 - ₱200,000</option>
                  <option value="200k-500k" className="bg-[#050b23]">₱200,000 - ₱500,000</option>
                  <option value="above-500k" className="bg-[#050b23]">Above ₱500,000</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2" htmlFor="message">
                Message
              </label>
              <textarea
                className="block w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 px-4 py-3 focus:border-[#7ee5ff] focus:ring-2 focus:ring-[#7ee5ff]/20 focus:outline-none transition-all resize-none"
                id="message"
                name="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us about your event vision, theme ideas, or any special requirements..."
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

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/639XXXXXXXXX?text=Hi!%20I'm%20interested%20in%20your%20event%20planning%20services."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Chat on WhatsApp"
      >
        <div className="relative">
          {/* Pulse animation */}
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>
          {/* Button */}
          <div className="relative flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-2xl transition-all duration-300 group-hover:scale-110">
            <svg
              className="w-7 h-7 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          {/* Tooltip */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-lg">
            Chat with us!
          </div>
        </div>
      </a>
    </div>
  );
};

export default Home;

