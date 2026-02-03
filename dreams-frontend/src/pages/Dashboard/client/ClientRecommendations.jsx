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
    BookmarkCheck
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

    // Determine initial tab from URL params
    const getInitialTab = () => {
        const tab = searchParams.get('tab');
        if (submitted && recommendations.length > 0) return tab || 'results';
        return tab || 'form';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    // Theme suggestions
    const themeSuggestions = ['elegant', 'modern', 'rustic', 'vintage', 'classic', 'romantic', 'minimalist', 'luxury', 'outdoor', 'indoor'];

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
        const requiredFields = ['type', 'guests'];
        const optionalFields = ['budget', 'theme', 'preferences'];
        const totalFields = requiredFields.length + optionalFields.length;
        let filledFields = 0;

        requiredFields.forEach(field => {
            if (formData[field]) filledFields++;
        });
        optionalFields.forEach(field => {
            if (formData[field]) filledFields++;
        });

        return Math.round((filledFields / totalFields) * 100);
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
            const preferencesArray = formData.preferences
                ? formData.preferences.split(',').map(p => p.trim()).filter(p => p)
                : [];

            const response = await api.post('/recommend', {
                type: formData.type || null,
                budget: formData.budget ? parseFloat(removeCommas(formData.budget)) : null,
                guests: formData.guests ? parseInt(formData.guests) : null,
                theme: formData.theme || null,
                preferences: preferencesArray,
            });

            const recs = response.data.data || [];
            setRecommendations(recs);
            setSubmitted(true);
            setActiveTab('results');
            handleTabChange('results');

            toast({
                title: 'Success!',
                description: `Found ${recs.length} recommended packages for you!`,
            });
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
                                    <p className="text-base font-medium text-green-800 dark:text-green-200">Success!</p>
                                    <p className="text-sm text-green-700 dark:text-green-300">Found {recommendations.length} recommended packages for you.</p>
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
                                    {/* Form Progress Indicator */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Progress</span>
                                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{getFormProgress()}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${getFormProgress()}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Event Type */}
                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                                                <label htmlFor="event-type-select" className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                                                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                    <span>Event Type</span>
                                                    <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="event-type-select"
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 ${touchedFields.type && formErrors.type
                                                            ? 'border-red-500'
                                                            : formData.type
                                                                ? 'border-green-500'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                >
                                                    <option value="">Select event type...</option>
                                                    <option value="wedding">Wedding</option>
                                                    <option value="birthday">Birthday</option>
                                                    <option value="corporate">Corporate</option>
                                                    <option value="anniversary">Anniversary</option>
                                                    <option value="debut">Debut</option>
                                                    <option value="pageant">Pageant</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                {touchedFields.type && formErrors.type && (
                                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.type}</p>
                                                )}
                                            </div>

                                            {/* Number of Guests */}
                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                                                <label htmlFor="guests-input" className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                                                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                    <span>Number of Guests</span>
                                                    <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="guests-input"
                                                    type="number"
                                                    name="guests"
                                                    value={formData.guests}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    min="1"
                                                    placeholder="e.g., 50, 100, 200"
                                                    className={`w-full px-4 py-3 border-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 ${touchedFields.guests && formErrors.guests
                                                            ? 'border-red-500'
                                                            : formData.guests
                                                                ? 'border-green-500'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                />
                                                {touchedFields.guests && formErrors.guests && (
                                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.guests}</p>
                                                )}
                                            </div>

                                            {/* Budget */}
                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                                                <label htmlFor="budget-input" className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                                                    <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                    <span>Budget</span>
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                                    <input
                                                        id="budget-input"
                                                        type="text"
                                                        name="budget"
                                                        value={formData.budget}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        placeholder="e.g., 50,000 or 100,000"
                                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 ${touchedFields.budget && formErrors.budget
                                                                ? 'border-red-500'
                                                                : formData.budget
                                                                    ? 'border-green-500'
                                                                    : 'border-gray-300 dark:border-gray-600'
                                                            }`}
                                                    />
                                                </div>
                                                {touchedFields.budget && formErrors.budget ? (
                                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.budget}</p>
                                                ) : (
                                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Numbers will be formatted with commas automatically</p>
                                                )}
                                            </div>

                                            {/* Theme */}
                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                                                <label htmlFor="theme-input" className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                                                    <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                    <span>Theme or Style</span>
                                                </label>
                                                <input
                                                    id="theme-input"
                                                    type="text"
                                                    name="theme"
                                                    value={formData.theme}
                                                    onChange={handleChange}
                                                    placeholder="e.g., elegant, modern, rustic"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quick select:</span>
                                                    {themeSuggestions.map((theme) => (
                                                        <button
                                                            key={theme}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, theme });
                                                                setTouchedFields({ ...touchedFields, theme: true });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.theme === theme
                                                                    ? 'bg-purple-600 text-white'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                                                                }`}
                                                        >
                                                            {theme}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preferences */}
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                                            <label className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
                                                <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                <span>Additional Preferences</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="preferences"
                                                value={formData.preferences}
                                                onChange={handleChange}
                                                placeholder="e.g., outdoor venue, photography included, catering service"
                                                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Separate multiple preferences with commas</p>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="pt-4">
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                                            >
                                                {loading ? (
                                                    <>Loading...</>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5 mr-2" />
                                                        Get Recommendations
                                                    </>
                                                )}
                                            </Button>
                                        </div>
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
                                                                    <Link to={`/packages/${packageId}`}>
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
        </PullToRefresh>
    );
};

export default ClientRecommendations;
