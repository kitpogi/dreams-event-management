import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PackageCard, PackageSearchAutocomplete } from '../../components/features';
import { Card, Button, Input, Badge, Label } from '../../components/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Slider } from '../../components/ui/slider';
import { Calendar } from '../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(9);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    category: '',
    sort: 'newest',
    dateFrom: null,
    dateTo: null,
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500000]); // Default range, will be updated
  const [tempPriceRange, setTempPriceRange] = useState([0, 500000]);

  useEffect(() => {
    fetchPackages(page);
  }, [page]);

  useEffect(() => {
    // Fetch price range only once on mount
    fetchPriceRange();
  }, []);

  const fetchPriceRange = async () => {
    try {
      // Get all packages to determine range (or we could add an endpoint for this)
      const allResponse = await api.get('/packages', { params: { per_page: 1000 } });
      const allPackages = allResponse.data.data || allResponse.data || [];
      if (allPackages.length > 0) {
        const prices = allPackages.map(p => parseFloat(p.package_price || p.price || 0)).filter(p => p > 0);
        if (prices.length > 0) {
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange([minPrice, maxPrice]);
          // Initialize temp range with current filters or full range
          const currentMin = filters.minPrice ? parseInt(filters.minPrice) : minPrice;
          const currentMax = filters.maxPrice ? parseInt(filters.maxPrice) : maxPrice;
          setTempPriceRange([currentMin, currentMax]);
        }
      }
    } catch (error) {
      console.error('Error fetching price range:', error);
    }
  };

  const fetchPackages = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/packages', { 
        params: { 
          ...filters, 
          page: pageToLoad,
          per_page: perPage,
        } 
      });
      setPackages(response.data.data || response.data || []);
      setMeta(response.data.meta || { total: 0, last_page: 1 });
      setPage(response.data.meta?.current_page || pageToLoad);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchChange = (e) => {
    setFilters({
      ...filters,
      search: e.target.value,
    });
  };

  const handleSearchSelect = (pkg) => {
    // When a package is selected from autocomplete, navigate to it
    // The autocomplete component handles navigation by default
    // But we can also update the search filter if needed
    if (pkg && pkg.package_name) {
      setFilters({
        ...filters,
        search: pkg.package_name,
      });
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchPackages(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
      category: '',
      sort: 'newest',
      dateFrom: null,
      dateTo: null,
    });
    setTempPriceRange(priceRange);
    setPage(1);
  };

  const handlePriceRangeChange = (values) => {
    setTempPriceRange(values);
    // Update filters immediately as user drags
    setFilters({
      ...filters,
      minPrice: values[0] === priceRange[0] ? '' : values[0].toString(),
      maxPrice: values[1] === priceRange[1] ? '' : values[1].toString(),
    });
  };

  const handleRemoveFilter = (filterKey) => {
    if (filterKey === 'minPrice' || filterKey === 'maxPrice') {
      setFilters({
        ...filters,
        minPrice: '',
        maxPrice: '',
      });
      setTempPriceRange(priceRange);
    } else if (filterKey === 'dateFrom' || filterKey === 'dateTo') {
      setFilters({
        ...filters,
        dateFrom: null,
        dateTo: null,
      });
    } else {
      setFilters({
        ...filters,
        [filterKey]: filterKey === 'sort' ? 'newest' : '',
      });
    }
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.search) {
      active.push({ key: 'search', label: `Search: ${filters.search}`, value: filters.search });
    }
    if (filters.category) {
      const categoryLabel = filters.category.charAt(0).toUpperCase() + filters.category.slice(1);
      active.push({ key: 'category', label: `Category: ${categoryLabel}`, value: filters.category });
    }
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice || priceRange[0];
      const max = filters.maxPrice || priceRange[1];
      active.push({ 
        key: 'price', 
        label: `Price: ₱${parseInt(min).toLocaleString()} - ₱${parseInt(max).toLocaleString()}`,
        value: { minPrice: filters.minPrice, maxPrice: filters.maxPrice }
      });
    }
    if (filters.sort && filters.sort !== 'newest') {
      const sortLabels = {
        oldest: 'Oldest First',
        price_asc: 'Price: Low to High',
        price_desc: 'Price: High to Low',
      };
      active.push({ key: 'sort', label: `Sort: ${sortLabels[filters.sort]}`, value: filters.sort });
    }
    if (filters.dateFrom || filters.dateTo) {
      const dateLabel = filters.dateFrom && filters.dateTo
        ? `${format(filters.dateFrom, 'MMM dd')} - ${format(filters.dateTo, 'MMM dd')}`
        : filters.dateFrom
        ? `From: ${format(filters.dateFrom, 'MMM dd')}`
        : `To: ${format(filters.dateTo, 'MMM dd')}`;
      active.push({ key: 'date', label: `Date: ${dateLabel}`, value: { dateFrom: filters.dateFrom, dateTo: filters.dateTo } });
    }
    return active;
  };

  const activeFilters = getActiveFilters();
  const activeFiltersCount = activeFilters.length;

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Event Packages</h1>
          <div className="flex items-center gap-4">
          <div className="hidden md:block w-64">
            <PackageSearchAutocomplete
              value={filters.search}
              onChange={handleSearchChange}
              onSelect={handleSearchSelect}
              placeholder="Search packages..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Filter Packages</SheetTitle>
                <SheetDescription>
                  Refine your search by category, price range, and more.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <PackageSearchAutocomplete
                    value={filters.search}
                    onChange={handleSearchChange}
                    onSelect={handleSearchSelect}
                    placeholder="Search packages..."
                  />
                </div>
                <div>
                  <Label className="mb-2">Category</Label>
                  <Select
                    value={filters.category || undefined}
                    onValueChange={(value) => setFilters({ ...filters, category: value || '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="debut">Debut</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="pageant">Pageant</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {filters.category && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => setFilters({ ...filters, category: '' })}
                    >
                      Clear category
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label className="mb-2">
                    Price Range: ₱{parseInt(tempPriceRange[0]).toLocaleString()} - ₱{parseInt(tempPriceRange[1]).toLocaleString()}
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={tempPriceRange}
                      onValueChange={handlePriceRangeChange}
                      min={priceRange[0]}
                      max={priceRange[1]}
                      step={1000}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Min Price</Label>
                      <Input
                        type="number"
                        name="minPrice"
                        placeholder="₱0"
                        value={filters.minPrice || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : priceRange[0];
                          if (value >= priceRange[0] && value <= tempPriceRange[1]) {
                            setTempPriceRange([value, tempPriceRange[1]]);
                            setFilters({ ...filters, minPrice: e.target.value });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Max Price</Label>
                      <Input
                        type="number"
                        name="maxPrice"
                        placeholder="₱∞"
                        value={filters.maxPrice || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : priceRange[1];
                          if (value >= tempPriceRange[0] && value <= priceRange[1]) {
                            setTempPriceRange([tempPriceRange[0], value]);
                            setFilters({ ...filters, maxPrice: e.target.value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2">Date Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateFrom ? format(filters.dateFrom, "MMM dd, yyyy") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateTo ? format(filters.dateTo, "MMM dd, yyyy") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                          initialFocus
                          disabled={(date) => filters.dateFrom && date < filters.dateFrom}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label className="mb-2">Sort By</Label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) => setFilters({ ...filters, sort: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleSearch();
                      setFilterSheetOpen(false);
                    }}
                    className="flex-1"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
        
        {/* Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => handleRemoveFilter(filter.key)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      ) : packages.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.package_id || pkg.id} package={pkg} />
            ))}
          </div>
          <div className="flex items-center justify-between mt-8 bg-gray-50 border rounded-lg px-4 py-3">
            <div className="text-sm text-gray-600">
              Page {page} of {meta.last_page || 1} • {meta.total || 0} total
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => (meta.last_page ? Math.min(meta.last_page, p + 1) : p + 1))}
                disabled={meta.last_page ? page >= meta.last_page : false}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-700">
            No packages found.
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;

