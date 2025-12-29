import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '../ui/command';
import { cn } from '@/lib/utils';
import { packageService } from '../../api/services';

/**
 * Custom debounce hook
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const PackageSearchAutocomplete = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Search packages...",
  className,
  ...props 
}) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [debouncedQuery]);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined && value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value]);

  const fetchSuggestions = async (query) => {
    try {
      setLoading(true);
      const response = await packageService.getAll({
        search: query,
        per_page: 5, // Limit suggestions to 5
      });
      
      const packages = response.data.data || response.data || [];
      setSuggestions(packages);
      setOpen(packages.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const handleSelect = (pkg) => {
    setSearchQuery(pkg.package_name || pkg.name || '');
    setOpen(false);
    
    if (onSelect) {
      onSelect(pkg);
    } else {
      // Default behavior: navigate to package details
      const packageId = pkg.package_id || pkg.id;
      if (packageId) {
        navigate(`/packages/${packageId}`);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && !open) {
      // If Enter is pressed and popover is closed, allow parent to handle it
      // This happens when user wants to search without selecting a suggestion
      setOpen(false);
    }
    // Call parent's onKeyDown if provided
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Format category
  const formatCategory = (category) => {
    if (!category) return '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setOpen(true);
                }
              }}
              placeholder={placeholder}
              leftIcon={Search}
              className="w-full"
              {...props}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          sideOffset={4}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <CommandGroup heading="Packages">
                  {suggestions.map((pkg) => {
                    const packageId = pkg.package_id || pkg.id;
                    const packageName = pkg.package_name || pkg.name || 'Untitled Package';
                    const packagePrice = pkg.package_price || pkg.price || 0;
                    const packageCategory = pkg.package_category || pkg.category || '';
                    
                    return (
                      <CommandItem
                        key={packageId}
                        value={packageName}
                        onSelect={() => handleSelect(pkg)}
                        className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium flex-1 truncate">{packageName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                          {packageCategory && (
                            <span className="px-2 py-0.5 bg-muted rounded-md">
                              {formatCategory(packageCategory)}
                            </span>
                          )}
                          <span className="font-semibold text-foreground">
                            {formatPrice(packagePrice)}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : (
                <CommandEmpty>
                  {debouncedQuery.trim().length >= 2 
                    ? "No packages found." 
                    : "Type at least 2 characters to search..."}
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PackageSearchAutocomplete;

