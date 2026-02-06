import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import {
    Card,
    Button,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Input,
    Badge
} from '../../../components/ui';
import { PackageComparison, AnimatedBackground, PullToRefresh } from '../../../components/features';
import { ContactFormModal } from '../../../components/modals';
import { useToast } from '../../../hooks/use-toast';
import {
    Sparkles,
    Search,
    Filter,
    SlidersHorizontal,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Palette,
    Heart,
    Users,
    DollarSign,
    Star,
    ThumbsUp,
    ThumbsDown,
    X,
    Tag,
    Package,
    TrendingUp,
    Bookmark,
    BookmarkCheck,
    Brain,
    Zap,
    RefreshCw,
    Info,
    ChevronRight,
    ChevronLeft,
    PartyPopper,
    Briefcase,
    Cake,
    Crown,
    Gem,
    HelpCircle,
    Camera,
    UtensilsCrossed,
    Music,
    Flower2,
    MapPin,
    Check
} from 'lucide-react';

const ClientRecommendations = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();

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
    const [filters, setFilters] = useState({
        eventType: '',
        budgetRange: '',
        guests: '',
        sortBy: 'match-score',
    });
    const [selectedForComparison, setSelectedForComparison] = useState([]);
    const [showComparison, setShowComparison] = useState(false);
    const [feedbackLoading, setFeedbackLoading] = useState({});
    const [activeFilters, setActiveFilters] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [savedRecommendations, setSavedRecommendations] = useState([]);
    const [useAI, setUseAI] = useState(true);
    const [aiEnhanced, setAiEnhanced] = useState(false);
    const [personalizedRecs, setPersonalizedRecs] = useState([]);
    const [personalizedLoading, setPersonalizedLoading] = useState(false);
    const [enrichedFields, setEnrichedFields] = useState([]);
    const [showPersonalized, setShowPersonalized] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [selectedPreferences, setSelectedPreferences] = useState([]);
    const [fallbackInfo, setFallbackInfo] = useState(null);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [showContactModal, setShowContactModal] = useState(false);
    const totalSteps = 3;

    // Determine initial tab from URL params
    const getInitialTab = () => {
        const tab = searchParams.get('tab');
        if (submitted && recommendations.length > 0) return tab || 'results';
        return tab || 'form';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    // Theme suggestions
    const themeSuggestions = ['elegant', 'modern', 'rustic', 'vintage', 'classic', 'romantic', 'minimalist', 'luxury', 'outdoor', 'indoor'];

    // Event type options with icons and descriptions
    const eventTypes = [
        { value: 'wedding', label: 'Wedding', emoji: '💍', description: 'Celebrate your love story', Icon: Heart },
        { value: 'birthday', label: 'Birthday', emoji: '🎂', description: 'Make it unforgettable', Icon: Cake },
        { value: 'corporate', label: 'Corporate', emoji: '💼', description: 'Professional & polished', Icon: Briefcase },
        { value: 'debut', label: 'Debut', emoji: '👑', description: 'A grand entrance to adulthood', Icon: Crown },
        { value: 'anniversary', label: 'Anniversary', emoji: '🥂', description: 'Celebrate milestones', Icon: Gem },
        { value: 'pageant', label: 'Pageant', emoji: '🌟', description: 'Shine on stage', Icon: Star },
        { value: 'other', label: 'Other', emoji: '🎉', description: 'Something unique', Icon: PartyPopper },
    ];

    // Guest count presets
    const guestPresets = [50, 100, 150, 200, 300, 500];

    // Budget presets
    const budgetPresets = [
        { label: '₱30K', value: '30,000' },
        { label: '₱50K', value: '50,000' },
        { label: '₱80K', value: '80,000' },
        { label: '₱100K', value: '100,000' },
        { label: '₱150K', value: '150,000' },
        { label: '₱200K+', value: '200,000' },
    ];

    // Preference options with icons
    const preferenceOptions = [
        { value: 'photography', label: 'Photography', Icon: Camera },
        { value: 'catering', label: 'Catering', Icon: UtensilsCrossed },
        { value: 'live band', label: 'Live Band', Icon: Music },
        { value: 'floral arrangement', label: 'Florals', Icon: Flower2 },
        { value: 'outdoor venue', label: 'Outdoor', Icon: MapPin },
        { value: 'indoor venue', label: 'Indoor', Icon: MapPin },
        { value: 'decoration', label: 'Decor', Icon: Palette },
        { value: 'sound system', label: 'Sound System', Icon: Music },
    ];

    // Load saved recommendations from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('savedRecommendations');
            if (saved) {
                setSavedRecommendations(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading saved recommendations:', error);
        }
    }, []);

    // Auto-fetch personalized recommendations for authenticated users
    useEffect(() => {
        if (isAuthenticated && !submitted) {
            fetchPersonalizedRecommendations();
        }
    }, [isAuthenticated]);

    const fetchPersonalizedRecommendations = async () => {
        setPersonalizedLoading(true);
        try {
            const response = await api.get('/recommendations/personalized');
            const recs = response.data.data || [];
            if (recs.length > 0) {
                setPersonalizedRecs(recs);
                setShowPersonalized(true);
                setEnrichedFields(response.data.enriched_fields || []);
            }
        } catch (error) {
            // Silently fail — personalized is a nice-to-have
            console.debug('Personalized recommendations not available:', error.response?.status);
        } finally {
            setPersonalizedLoading(false);
        }
    };

    // Save/unsave recommendation
    const handleSaveForLater = (pkg) => {
        try {
            const packageId = pkg.id || pkg.package_id;
            const saved = [...savedRecommendations];
            const index = saved.findIndex(r => (r.id || r.package_id) === packageId);
            
            if (index > -1) {
                saved.splice(index, 1);
                toast({
                    title: 'Removed from saved',
                    description: 'Recommendation removed from your saved list.',
                });
            } else {
                saved.push({
                    ...pkg,
                    savedAt: new Date().toISOString(),
                });
                toast({
                    title: 'Saved for later!',
                    description: 'You can view saved recommendations anytime.',
                });
            }
            
            setSavedRecommendations(saved);
            localStorage.setItem('savedRecommendations', JSON.stringify(saved));
        } catch (error) {
            console.error('Error saving recommendation:', error);
            toast({
                title: 'Error',
                description: 'Failed to save recommendation.',
                variant: 'destructive',
            });
        }
    };

    const isSaved = (pkg) => {
        const packageId = pkg.id || pkg.package_id;
        return savedRecommendations.some(r => (r.id || r.package_id) === packageId);
    };

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Check if recommendations were passed from SetAnEvent page
    useEffect(() => {
        if (location.state?.recommendations) {
            setRecommendations(location.state.recommendations);
            setSubmitted(true);
            setActiveTab('results');
        }
    }, [location.state]);

    // Update active filters display
    useEffect(() => {
        const active = [];
        if (filters.eventType) active.push({ key: 'eventType', label: `Type: ${filters.eventType}`, value: filters.eventType });
        if (filters.budgetRange) active.push({ key: 'budgetRange', label: `Budget: ${filters.budgetRange}`, value: filters.budgetRange });
        if (filters.guests) active.push({ key: 'guests', label: `Guests: ${filters.guests}`, value: filters.guests });
        setActiveFilters(active);
    }, [filters]);

    // Handle tab change
    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        const newParams = { tab: newTab };
        setSearchParams(newParams, { replace: true });
    };

    // Memoized filtered and sorted recommendations
    const filteredRecommendations = useMemo(() => {
        if (recommendations.length === 0) return [];

        let filtered = [...recommendations];

        // Search filter
        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter(pkg => {
                const name = (pkg.name || pkg.package_name || '').toLowerCase();
                const description = (pkg.description || pkg.package_description || '').toLowerCase();
                const category = (pkg.category || pkg.package_category || '').toLowerCase();
                return name.includes(query) || description.includes(query) || category.includes(query);
            });
        }

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
                const capacity = pkg.capacity || pkg.venue?.capacity || 9999;
                return capacity >= guestCount;
            });
        }

        // Sort
        const sorted = [...filtered];
        switch (filters.sortBy) {
            case 'price-low':
                sorted.sort((a, b) => (a.price || a.package_price || 0) - (b.price || b.package_price || 0));
                break;
            case 'price-high':
                sorted.sort((a, b) => (b.price || b.package_price || 0) - (a.price || a.package_price || 0));
                break;
            case 'match-score':
            default:
                sorted.sort((a, b) => (b.score || b.match_score || 0) - (a.score || a.match_score || 0));
                break;
        }

        return sorted;
    }, [recommendations, filters, debouncedSearchQuery]);

    // Format number with commas
    const formatNumberWithCommas = (value) => {
        if (!value) return '';
        const numbers = value.toString().replace(/\D/g, '');
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Remove commas from number
    const removeCommas = (value) => {
        return value.toString().replace(/,/g, '');
    };

    // Form validation
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'type':
                if (!value) {
                    error = 'Event type is required';
                }
                break;
            case 'guests':
                if (!value) {
                    error = 'Number of guests is required';
                } else if (parseInt(value) < 1) {
                    error = 'Number of guests must be at least 1';
                } else if (parseInt(value) > 10000) {
                    error = 'Number of guests cannot exceed 10,000';
                }
                break;
            case 'budget':
                if (value) {
                    const numValue = parseFloat(removeCommas(value));
                    if (isNaN(numValue) || numValue < 0) {
                        error = 'Budget must be a valid positive number';
                    }
                }
                break;
            default:
                break;
        }

        return error;
    };

    // Validate entire form
    const validateForm = () => {
        const errors = {};
        errors.type = validateField('type', formData.type);
        errors.guests = validateField('guests', formData.guests);
        errors.budget = validateField('budget', formData.budget);
        setFormErrors(errors);
        return !errors.type && !errors.guests && !errors.budget;
    };

    // Calculate form completion percentage
    const getFormProgress = () => {
        let filled = 0;
        let total = 5;
        if (formData.type) filled++;
        if (formData.guests) filled++;
        if (formData.budget) filled++;
        if (formData.theme) filled++;
        if (selectedPreferences.length > 0 || formData.preferences) filled++;
        return Math.round((filled / total) * 100);
    };

    // Toggle a preference chip
    const togglePreference = (pref) => {
        setSelectedPreferences(prev =>
            prev.includes(pref)
                ? prev.filter(p => p !== pref)
                : [...prev, pref]
        );
    };

    // Step navigation
    const canProceedStep1 = formData.type !== '';
    const canProceedStep2 = formData.guests !== '';

    const nextStep = () => {
        if (formStep === 1 && !canProceedStep1) {
            setTouchedFields({ ...touchedFields, type: true });
            setFormErrors({ ...formErrors, type: 'Please select an event type' });
            return;
        }
        if (formStep === 2 && !canProceedStep2) {
            setTouchedFields({ ...touchedFields, guests: true });
            setFormErrors({ ...formErrors, guests: 'Please enter number of guests' });
            return;
        }
        if (formStep < totalSteps) setFormStep(formStep + 1);
    };

    const prevStep = () => {
        if (formStep > 1) setFormStep(formStep - 1);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTouchedFields({ ...touchedFields, [name]: true });

        if (name === 'budget') {
            const numericValue = removeCommas(value);
            const formattedValue = formatNumberWithCommas(numericValue);
            setFormData({ ...formData, [name]: formattedValue });
            const error = validateField(name, formattedValue);
            setFormErrors({ ...formErrors, [name]: error });
        } else {
            setFormData({ ...formData, [name]: value });
            const error = validateField(name, value);
            setFormErrors({ ...formErrors, [name]: error });
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouchedFields({ ...touchedFields, [name]: true });
        const error = validateField(name, value);
        setFormErrors({ ...formErrors, [name]: error });
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const removeFilter = (filterKey) => {
        setFilters({ ...filters, [filterKey]: '' });
    };

    const handleFeedback = async (packageId, feedbackType) => {
        setFeedbackLoading({ ...feedbackLoading, [packageId]: true });
        try {
            toast({
                title: 'Thank you!',
                description: `Thank you for your ${feedbackType === 'up' ? 'positive' : 'feedback'}!`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to submit feedback',
                variant: 'destructive',
            });
        } finally {
            setFeedbackLoading({ ...feedbackLoading, [packageId]: false });
        }
    };

    const handleComparisonToggle = (pkg) => {
        const packageId = pkg.id || pkg.package_id;
        if (selectedForComparison.some(p => (p.id || p.package_id) === packageId)) {
            setSelectedForComparison(selectedForComparison.filter(p => (p.id || p.package_id) !== packageId));
        } else {
            if (selectedForComparison.length >= 3) {
                toast({
                    title: 'Limit Reached',
                    description: 'You can compare up to 3 packages at a time',
                    variant: 'destructive',
                });
                return;
            }
            setSelectedForComparison([...selectedForComparison, pkg]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setTouchedFields({
            type: true,
            guests: true,
            budget: true,
            theme: true,
            preferences: true,
        });

        if (!validateForm()) {
            toast({
                title: 'Validation Error',
                description: 'Please fix the errors in the form before submitting',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        setSubmitted(false);

        try {
            const textPrefs = formData.preferences
                ? formData.preferences.split(',').map(p => p.trim()).filter(p => p)
                : [];
            const preferencesArray = [...new Set([...selectedPreferences, ...textPrefs])];

            const response = await api.post('/recommend', {
                type: formData.type || null,
                budget: formData.budget ? parseFloat(removeCommas(formData.budget)) : null,
                guests: formData.guests ? parseInt(formData.guests) : null,
                theme: formData.theme || null,
                preferences: preferencesArray,
                use_ai: useAI,
            });

            const recs = response.data.data || [];
            const fallbackUsed = response.data.fallback_used || false;
            const exactMatch = response.data.exact_match || false;
            const requestedType = response.data.requested_type || formData.type;
            const categories = response.data.available_categories || [];

            setFallbackInfo({
                fallbackUsed,
                exactMatch,
                requestedType,
                message: response.data.message,
            });
            setAvailableCategories(categories);

            setRecommendations(recs);
            setSubmitted(true);
            setAiEnhanced(response.data.ai_enhanced || false);
            setActiveTab('results');
            handleTabChange('results');

            if (fallbackUsed && requestedType) {
                toast({
                    title: `No ${requestedType} packages available`,
                    description: 'Showing alternative packages that might interest you.',
                    variant: 'warning',
                });
            } else {
                toast({
                    title: 'Success!',
                    description: `Found ${recs.length} recommended packages for you!`,
                });
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to get recommendations',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Price on request';
        return `₱${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatMatchScore = (score) => {
        if (!score) return 0;
        return Math.round(parseFloat(score) * 100);
    };

    const getMatchScoreColor = (score) => {
        const percentage = formatMatchScore(score);
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const parseJustification = (justification) => {
        if (!justification) return [];
        return justification.split(',').map(j => j.trim()).filter(j => j);
    };

    const getPackageImage = (pkg) => {
        if (pkg.images && pkg.images.length > 0) {
            return pkg.images[0].image_url;
        }
        if (pkg.package_image) {
            return pkg.package_image;
        }
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EPackage Image%3C/text%3E%3C/svg%3E"; 
    };

    const handleRefresh = async () => {
        if (submitted && recommendations.length > 0) {
            await handleSubmit({ preventDefault: () => { } });
        }
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
            <div className="relative min-h-screen">
                <AnimatedBackground
                    type="dots"
                    colors={['#5A45F2', '#7c3aed', '#7ee5ff']}
                    speed={0.2}
                    className="opacity-5 dark:opacity-10"
                />
                <div className="px-4 py-6 lg:px-8 lg:py-8 relative z-10 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Get Recommendations</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Discover personalized event packages tailored to your needs</p>
                            </div>
                        </div>
                    </div>

                    {/* Success Banner */}
                    {submitted && recommendations.length > 0 && (
                        <Card className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-medium text-green-800 dark:text-green-200">
                                        {aiEnhanced ? 'AI-Enhanced Results!' : 'Success!'}
                                    </p>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Found {recommendations.length} recommended packages for you.
                                        {aiEnhanced && ' Results include AI semantic analysis.'}
                                    </p>
                                </div>
                                {aiEnhanced && (
                                    <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 gap-1">
                                        <Brain className="w-3 h-3" />
                                        AI
                                    </Badge>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Personalized Recommendations Section */}
                    {showPersonalized && personalizedRecs.length > 0 && !submitted && (
                        <Card className="mb-6 p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 border-violet-200 dark:border-violet-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personalized For You</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Based on your booking history & preferences
                                            {enrichedFields.length > 0 && (
                                                <span className="ml-1 text-violet-600 dark:text-violet-400">
                                                    · Auto-filled: {enrichedFields.join(', ')}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 gap-1">
                                        <Brain className="w-3 h-3" />
                                        AI-Powered
                                    </Badge>
                                    <button
                                        onClick={fetchPersonalizedRecommendations}
                                        className="p-2 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                                        title="Refresh"
                                    >
                                        <RefreshCw className={`w-4 h-4 text-violet-600 dark:text-violet-400 ${personalizedLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {personalizedRecs.slice(0, 3).map((pkg) => {
                                    const packageId = pkg.id || pkg.package_id;
                                    const matchScore = formatMatchScore(pkg.score || pkg.match_score);
                                    return (
                                        <div key={packageId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group">
                                            <div className="relative">
                                                <img
                                                    src={getPackageImage(pkg)}
                                                    alt={pkg.name || pkg.package_name}
                                                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute top-2 right-2">
                                                    <div className={`px-2 py-0.5 rounded-full text-white text-xs font-bold ${getMatchScoreColor(pkg.score || pkg.match_score)}`}>
                                                        {matchScore}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{pkg.name || pkg.package_name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatPrice(pkg.price || pkg.package_price)}</p>
                                                {pkg.ai_insight && (
                                                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 flex items-start gap-1">
                                                        <Brain className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">{pkg.ai_insight}</span>
                                                    </p>
                                                )}
                                                <Link to={`/dashboard/packages/${packageId}`}>
                                                    <Button size="sm" className="w-full mt-2 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Loading Personalized */}
                    {personalizedLoading && !submitted && (
                        <Card className="mb-6 p-6 border-violet-200 dark:border-violet-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-white animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Finding personalized picks...</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Analyzing your preferences with AI</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Main Content with Tabs */}
                    <Card className="p-8 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300 shadow-md">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg">
                                <TabsTrigger value="form" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="font-medium">Get Recommendations</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="results"
                                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                                    disabled={!submitted || recommendations.length === 0}
                                >
                                    <Package className="w-4 h-4" />
                                    <span className="font-medium">Results</span>
                                    {recommendations.length > 0 && (
                                        <Badge className="ml-2 bg-purple-600 text-white">{recommendations.length}</Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* Form Tab */}
                            <TabsContent value="form" className="mt-0">
                                <div className="space-y-6">
                                    {/* Step Indicator */}
                                    <div className="flex items-center justify-between mb-2">
                                        {[
                                            { step: 1, label: 'Event Type' },
                                            { step: 2, label: 'Details' },
                                            { step: 3, label: 'Style & Submit' },
                                        ].map(({ step, label }, idx) => (
                                            <React.Fragment key={step}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (step < formStep) setFormStep(step);
                                                        if (step === 2 && canProceedStep1) setFormStep(step);
                                                        if (step === 3 && canProceedStep1 && canProceedStep2) setFormStep(step);
                                                    }}
                                                    className="flex flex-col items-center gap-1.5 group"
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                                        formStep === step
                                                            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30 scale-110'
                                                            : formStep > step
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                        {formStep > step ? <Check className="w-5 h-5" /> : step}
                                                    </div>
                                                    <span className={`text-xs font-medium hidden sm:block transition-colors ${
                                                        formStep === step ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                                                    }`}>{label}</span>
                                                </button>
                                                {idx < 2 && (
                                                    <div className={`flex-1 h-0.5 mx-2 rounded transition-colors duration-300 ${
                                                        formStep > step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                                    }`} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* ── Step 1: Event Type ── */}
                                        {formStep === 1 && (
                                            <div className="space-y-6 animate-in fade-in duration-300">
                                                <div className="text-center mb-2">
                                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">What event are you planning?</h2>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select the type that best describes your event</p>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {eventTypes.map(({ value, label, emoji, description, Icon }) => (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, type: value });
                                                                setFormErrors({ ...formErrors, type: '' });
                                                                setTouchedFields({ ...touchedFields, type: true });
                                                            }}
                                                            className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 group hover:shadow-md ${
                                                                formData.type === value
                                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md shadow-purple-100 dark:shadow-purple-900/20 ring-2 ring-purple-500/20'
                                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700'
                                                            }`}
                                                        >
                                                            {formData.type === value && (
                                                                <div className="absolute top-2 right-2">
                                                                    <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                                                                        <Check className="w-3 h-3 text-white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <span className="text-3xl">{emoji}</span>
                                                            <span className={`text-sm font-bold ${
                                                                formData.type === value ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'
                                                            }`}>{label}</span>
                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 text-center leading-tight">{description}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {touchedFields.type && formErrors.type && (
                                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">{formErrors.type}</p>
                                                )}

                                                <div className="flex justify-end pt-2">
                                                    <Button
                                                        type="button"
                                                        onClick={nextStep}
                                                        disabled={!canProceedStep1}
                                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 gap-2 disabled:opacity-40"
                                                    >
                                                        Continue
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Step 2: Guests + Budget ── */}
                                        {formStep === 2 && (
                                            <div className="space-y-6 animate-in fade-in duration-300">
                                                <div className="text-center mb-2">
                                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Guest count & budget</h2>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Help us narrow down the perfect packages for your {formData.type || 'event'}</p>
                                                </div>

                                                {/* Guest Count */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <label className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                                                        <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                        <span>How many guests?</span>
                                                        <span className="text-red-500 text-sm">*</span>
                                                    </label>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {guestPresets.map((count) => (
                                                            <button
                                                                key={count}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, guests: String(count) });
                                                                    setFormErrors({ ...formErrors, guests: '' });
                                                                    setTouchedFields({ ...touchedFields, guests: true });
                                                                }}
                                                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                                                    formData.guests === String(count)
                                                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-900/30'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300'
                                                                }`}
                                                            >
                                                                {count}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            name="guests"
                                                            value={formData.guests}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            min="1"
                                                            placeholder="Or enter a custom number..."
                                                            className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                                                                touchedFields.guests && formErrors.guests
                                                                    ? 'border-red-400'
                                                                    : formData.guests
                                                                        ? 'border-purple-300 dark:border-purple-700'
                                                                        : 'border-gray-200 dark:border-gray-600'
                                                            }`}
                                                        />
                                                        {formData.guests && (
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">guests</span>
                                                        )}
                                                    </div>
                                                    {touchedFields.guests && formErrors.guests && (
                                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.guests}</p>
                                                    )}
                                                </div>

                                                {/* Budget */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <label className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                                                        <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <span>What's your budget?</span>
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-normal">Optional</span>
                                                    </label>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {budgetPresets.map(({ label, value }) => (
                                                            <button
                                                                key={value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, budget: value });
                                                                    setTouchedFields({ ...touchedFields, budget: true });
                                                                }}
                                                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                                                    formData.budget === value
                                                                        ? 'bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900/30'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300'
                                                                }`}
                                                            >
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
                                                        <input
                                                            type="text"
                                                            name="budget"
                                                            value={formData.budget}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            placeholder="Or enter a custom amount..."
                                                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                                                                touchedFields.budget && formErrors.budget
                                                                    ? 'border-red-400'
                                                                    : formData.budget
                                                                        ? 'border-green-300 dark:border-green-700'
                                                                        : 'border-gray-200 dark:border-gray-600'
                                                            }`}
                                                        />
                                                    </div>
                                                    {touchedFields.budget && formErrors.budget && (
                                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.budget}</p>
                                                    )}
                                                </div>

                                                <div className="flex justify-between pt-2">
                                                    <Button
                                                        type="button"
                                                        onClick={prevStep}
                                                        variant="outline"
                                                        className="px-6 py-3 gap-2"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                        Back
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={nextStep}
                                                        disabled={!canProceedStep2}
                                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 gap-2 disabled:opacity-40"
                                                    >
                                                        Continue
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Step 3: Theme + Preferences + Submit ── */}
                                        {formStep === 3 && (
                                            <div className="space-y-6 animate-in fade-in duration-300">
                                                <div className="text-center mb-2">
                                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Style & preferences</h2>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">These help our AI find the perfect vibe for you</p>
                                                </div>

                                                {/* Theme */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <label className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                                                        <div className="w-9 h-9 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                                            <Palette className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                                        </div>
                                                        <span>Theme or Style</span>
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-normal">Optional</span>
                                                    </label>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {themeSuggestions.map((theme) => (
                                                            <button
                                                                key={theme}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, theme: formData.theme === theme ? '' : theme });
                                                                    setTouchedFields({ ...touchedFields, theme: true });
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                                                                    formData.theme === theme
                                                                        ? 'bg-pink-600 text-white shadow-md shadow-pink-200 dark:shadow-pink-900/30'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/20 hover:text-pink-700 dark:hover:text-pink-300'
                                                                }`}
                                                            >
                                                                {theme}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="theme"
                                                        value={formData.theme}
                                                        onChange={handleChange}
                                                        placeholder="Or type your own theme..."
                                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
                                                    />
                                                </div>

                                                {/* Preferences Chips */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <label className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-1">
                                                        <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                            <Heart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                        </div>
                                                        <span>What do you need?</span>
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-normal">Select all that apply</span>
                                                    </label>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 ml-12">Select the services and features you'd like included</p>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                                        {preferenceOptions.map(({ value, label, Icon }) => {
                                                            const isActive = selectedPreferences.includes(value);
                                                            return (
                                                                <button
                                                                    key={value}
                                                                    type="button"
                                                                    onClick={() => togglePreference(value)}
                                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                                                        isActive
                                                                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-600 text-orange-700 dark:text-orange-300 shadow-sm'
                                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700'
                                                                    }`}
                                                                >
                                                                    {isActive ? (
                                                                        <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                                                                    ) : (
                                                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                                                    )}
                                                                    <span className="truncate">{label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <input
                                                        type="text"
                                                        name="preferences"
                                                        value={formData.preferences}
                                                        onChange={handleChange}
                                                        placeholder="Other preferences (comma separated)..."
                                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                                                    />
                                                </div>

                                                {/* AI Enhancement Toggle */}
                                                <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                                                            <Brain className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">AI-Enhanced Matching</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Uses AI to understand your theme & preferences semantically</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUseAI(!useAI)}
                                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                                            useAI ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                                        }`}
                                                    >
                                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                                            useAI ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                    </button>
                                                </div>

                                                {/* Summary */}
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                        Your search summary
                                                    </h3>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Event</p>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 capitalize">{formData.type || '—'}</p>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Guests</p>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{formData.guests || '—'}</p>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Budget</p>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{formData.budget ? `₱${formData.budget}` : '—'}</p>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Theme</p>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 capitalize">{formData.theme || '—'}</p>
                                                        </div>
                                                    </div>
                                                    {selectedPreferences.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                                            {selectedPreferences.map(pref => (
                                                                <Badge key={pref} className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 capitalize text-xs">
                                                                    {pref}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Navigation */}
                                                <div className="flex justify-between pt-2">
                                                    <Button
                                                        type="button"
                                                        onClick={prevStep}
                                                        variant="outline"
                                                        className="px-6 py-3 gap-2"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                        Back
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-10 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all gap-2"
                                                    >
                                                        {loading ? (
                                                            <span className="flex items-center gap-2">
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                                Finding packages...
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="w-5 h-5" />
                                                                Get Recommendations
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </TabsContent>

                            {/* Results Tab */}
                            <TabsContent value="results" className="mt-0">
                                {!submitted || recommendations.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            No recommendations yet
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                                            Fill out the form to get personalized package recommendations.
                                        </p>
                                        <Button onClick={() => handleTabChange('form')} className="bg-purple-600 hover:bg-purple-700 text-white">
                                            Get Recommendations
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Filters and Search */}
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                                <div className="flex-1 relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <Input
                                                        type="text"
                                                        placeholder="Search packages..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                                <select
                                                    name="sortBy"
                                                    value={filters.sortBy}
                                                    onChange={handleFilterChange}
                                                    className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                >
                                                    <option value="match-score">Sort by Match Score</option>
                                                    <option value="price-low">Price: Low to High</option>
                                                    <option value="price-high">Price: High to Low</option>
                                                </select>
                                            </div>

                                            {/* Active Filters */}
                                            {activeFilters.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {activeFilters.map((filter) => (
                                                        <Badge
                                                            key={filter.key}
                                                            className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                                        >
                                                            {filter.label}
                                                            <button
                                                                onClick={() => removeFilter(filter.key)}
                                                                className="ml-2 hover:text-purple-600"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Fallback / No Exact Match Banner */}
                                        {fallbackInfo?.fallbackUsed && fallbackInfo?.requestedType && (
                                            <Card className="border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 p-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center">
                                                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-base font-bold text-amber-800 dark:text-amber-300 mb-1">
                                                            No {fallbackInfo.requestedType} Packages Available
                                                        </h3>
                                                        <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                                                            We don't currently have pre-built packages for <strong className="capitalize">{fallbackInfo.requestedType}</strong> events. 
                                                            Below are alternative packages that you might customize.
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => setShowContactModal(true)}
                                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                                            >
                                                                Request Custom Package
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleTabChange('form')}
                                                            >
                                                                Modify Search
                                                            </Button>
                                                            {availableCategories.length > 0 && (
                                                                <span className="text-xs text-amber-600 dark:text-amber-400 self-center">
                                                                    Available: <span className="font-medium capitalize">{availableCategories.join(', ')}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        )}

                                        {/* Don't Like Banner */}
                                        {!fallbackInfo?.fallbackUsed && submitted && recommendations.length > 0 && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <HelpCircle className="w-4 h-4 text-gray-500" />
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="font-medium text-gray-900 dark:text-white">Don't see what you're looking for?</span>{' '}
                                                        We can customize any package.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setShowContactModal(true)}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                                    >
                                                        Contact Us
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Comparison Button */}
                                        {selectedForComparison.length > 0 && (
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={() => setShowComparison(true)}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                                >
                                                    Compare Packages ({selectedForComparison.length})
                                                </Button>
                                            </div>
                                        )}

                                        {/* Recommendations Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredRecommendations.map((pkg) => {
                                                const packageId = pkg.id || pkg.package_id;
                                                const isSelected = selectedForComparison.some(p => (p.id || p.package_id) === packageId);
                                                const matchScore = formatMatchScore(pkg.score || pkg.match_score);

                                                return (
                                                    <Card key={packageId} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                                                        <div className="relative">
                                                            <img
                                                                src={getPackageImage(pkg)}
                                                                alt={pkg.name || pkg.package_name}
                                                                className="w-full h-48 object-cover"
                                                            />
                                                            <div className="absolute top-2 right-2">
                                                                <div className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getMatchScoreColor(pkg.score || pkg.match_score)}`}>
                                                                    {matchScore}% Match
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-6">
                                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                                {pkg.name || pkg.package_name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                                {pkg.description || pkg.package_description}
                                                            </p>

                                                            <div className="space-y-2 mb-4">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                                        {formatPrice(pkg.price || pkg.package_price)}
                                                                    </span>
                                                                </div>
                                                                {pkg.capacity && (
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                        <Users className="w-4 h-4" />
                                                                        <span>Capacity: {pkg.capacity} guests</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* AI Insight */}
                                                            {pkg.ai_insight && (
                                                                <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                                                                    <div className="flex items-start gap-2">
                                                                        <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                                                                        <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">{pkg.ai_insight}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="space-y-2 mb-4">
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant={isSelected ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => handleComparisonToggle(pkg)}
                                                                        className="flex-1"
                                                                    >
                                                                        {isSelected ? 'Remove from Compare' : 'Compare'}
                                                                    </Button>
                                                                    <Link to={`/dashboard/packages/${packageId}`}>
                                                                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                                                                            View Details
                                                                        </Button>
                                                                    </Link>
                                                                </div>
                                                                {/* Save for Later Button */}
                                                                <button
                                                                    onClick={() => handleSaveForLater(pkg)}
                                                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                                        isSaved(pkg)
                                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                    }`}
                                                                    title={isSaved(pkg) ? 'Remove from saved' : 'Save for later'}
                                                                >
                                                                    {isSaved(pkg) ? (
                                                                        <>
                                                                            <BookmarkCheck className="w-4 h-4" />
                                                                            <span>Saved</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Bookmark className="w-4 h-4" />
                                                                            <span>Save for Later</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>

                                                            {/* Feedback */}
                                                            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                                <button
                                                                    onClick={() => handleFeedback(packageId, 'up')}
                                                                    disabled={feedbackLoading[packageId]}
                                                                    className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                                                >
                                                                    <ThumbsUp className="w-4 h-4" />
                                                                    Helpful
                                                                </button>
                                                                <button
                                                                    onClick={() => handleFeedback(packageId, 'down')}
                                                                    disabled={feedbackLoading[packageId]}
                                                                    className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                                >
                                                                    <ThumbsDown className="w-4 h-4" />
                                                                    Not Helpful
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>

                                        {filteredRecommendations.length === 0 && (
                                            <div className="text-center py-12">
                                                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                                                <p className="text-gray-600 dark:text-gray-400">No packages match your filters.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </Card>

                    {/* Comparison Modal */}
                    <PackageComparison
                        packages={selectedForComparison}
                        isOpen={showComparison}
                        onClose={() => setShowComparison(false)}
                        onRemove={(packageId) => {
                            setSelectedForComparison(selectedForComparison.filter(p => (p.id || p.package_id) !== packageId));
                        }}
                    />
                </div>
            </div>

            {/* Contact Form Modal - stays within dashboard */}
            <ContactFormModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                onSuccess={() => {
                    setShowContactModal(false);
                    toast({
                        title: 'Inquiry Sent!',
                        description: 'We\'ll get back to you soon about your custom package.',
                    });
                }}
                initialData={{
                    event_type: formData.type || fallbackInfo?.requestedType || '',
                    budget: formData.budget ? parseFloat(formData.budget.replace(/,/g, '')) : '',
                    estimated_guests: formData.guests || '',
                    message: fallbackInfo?.fallbackUsed
                        ? `I'm looking for a ${fallbackInfo.requestedType || ''} package but none are currently available. I'd like to request a custom package.`
                        : 'I\'d like to discuss custom package options.',
                }}
            />
        </PullToRefresh>
    );
};

export default ClientRecommendations;
