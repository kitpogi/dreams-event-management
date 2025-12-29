import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';

const FavoriteButton = ({
  itemId,
  itemType = 'package', // 'package', 'venue', 'event', etc.
  onToggle,
  className,
  variant = 'ghost',
  size = 'icon',
  showText = false,
  storageKey = 'favorites',
  apiEndpoint,
  apiService,
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load favorite state from localStorage or API
  useEffect(() => {
    const loadFavoriteState = async () => {
      if (!itemId) return;

      if (apiService && isAuthenticated) {
        // Load from API if authenticated and API service provided
        try {
          setIsLoading(true);
          const favorites = await apiService.getFavorites();
          setIsFavorite(favorites.some((fav) => fav.id === itemId && fav.type === itemType));
        } catch (error) {
          console.error('Error loading favorites:', error);
          // Fallback to localStorage
          loadFromLocalStorage();
        } finally {
          setIsLoading(false);
        }
      } else {
        // Load from localStorage
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const favorites = JSON.parse(stored);
          const favorite = favorites.find(
            (fav) => fav.id === itemId && fav.type === itemType
          );
          setIsFavorite(!!favorite);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    };

    loadFavoriteState();
  }, [itemId, itemType, storageKey, apiService, isAuthenticated]);

  const handleToggle = async () => {
    if (!itemId) return;

    setIsLoading(true);
    const newFavoriteState = !isFavorite;

    try {
      if (apiService && isAuthenticated) {
        // Save to API if authenticated and API service provided
        if (newFavoriteState) {
          await apiService.addFavorite(itemId, itemType);
        } else {
          await apiService.removeFavorite(itemId, itemType);
        }
      } else {
        // Save to localStorage
        const stored = localStorage.getItem(storageKey);
        const favorites = stored ? JSON.parse(stored) : [];
        
        if (newFavoriteState) {
          // Add to favorites
          if (!favorites.find((fav) => fav.id === itemId && fav.type === itemType)) {
            favorites.push({ id: itemId, type: itemType, addedAt: new Date().toISOString() });
          }
        } else {
          // Remove from favorites
          const index = favorites.findIndex(
            (fav) => fav.id === itemId && fav.type === itemType
          );
          if (index > -1) {
            favorites.splice(index, 1);
          }
        }
        
        localStorage.setItem(storageKey, JSON.stringify(favorites));
      }

      setIsFavorite(newFavoriteState);
      
      toast({
        title: newFavoriteState ? 'Added to favorites' : 'Removed from favorites',
        description: newFavoriteState
          ? 'This item has been saved to your favorites.'
          : 'This item has been removed from your favorites.',
      });

      // Call custom callback if provided
      if (onToggle) {
        onToggle(newFavoriteState, itemId, itemType);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading || !itemId}
      className={cn(
        'gap-2 transition-all',
        isFavorite && 'text-error-600 dark:text-error-400',
        !isFavorite && 'text-gray-600 dark:text-gray-400',
        className
      )}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorite}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all',
          isFavorite ? 'fill-current' : 'fill-none'
        )}
      />
      {showText && (
        <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
      )}
    </Button>
  );
};

// Hook for managing favorites
export const useFavorites = (storageKey = 'favorites') => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === storageKey) {
        loadFavorites();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  const isFavorite = (itemId, itemType) => {
    return favorites.some((fav) => fav.id === itemId && fav.type === itemType);
  };

  const getFavoritesByType = (type) => {
    return favorites.filter((fav) => fav.type === type);
  };

  return {
    favorites,
    isFavorite,
    getFavoritesByType,
  };
};

export default FavoriteButton;

