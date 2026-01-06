import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Package, Trash2, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import { PackageCard, PullToRefresh } from '../../components/features';
import { Button } from '../../components/ui';
import { useFavorites } from '../../components/ui/FavoriteButton';
import { useToast } from '../../hooks/use-toast';

const Favorites = () => {
  const { favorites, getFavoritesByType } = useFavorites();
  const [favoritePackages, setFavoritePackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFavoritePackages();
  }, [favorites]);

  const loadFavoritePackages = async () => {
    try {
      setLoading(true);
      const packageFavorites = getFavoritesByType('package');
      
      if (packageFavorites.length === 0) {
        setFavoritePackages([]);
        setLoading(false);
        return;
      }

      // Fetch package details for all favorited packages
      const packageIds = packageFavorites.map(fav => fav.id);
      const packagesData = [];

      // Fetch each package (or batch if API supports it)
      for (const packageId of packageIds) {
        try {
          const response = await api.get(`/packages/${packageId}`);
          const pkg = response.data.data || response.data;
          if (pkg) {
            packagesData.push(pkg);
          }
        } catch (error) {
          console.error(`Error fetching package ${packageId}:`, error);
          // Continue with other packages even if one fails
        }
      }

      setFavoritePackages(packagesData);
    } catch (error) {
      console.error('Error loading favorite packages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load favorite packages. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAll = () => {
    // Clear all package favorites from localStorage
    const packageFavorites = getFavoritesByType('package');
    const allFavorites = favorites.filter(fav => fav.type !== 'package');
    localStorage.setItem('favorites', JSON.stringify(allFavorites));
    
    setFavoritePackages([]);
    toast({
      title: 'Cleared favorites',
      description: 'All favorite packages have been removed.',
    });
    
    // Trigger a reload by dispatching a storage event
    window.dispatchEvent(new Event('storage'));
  };

  const packageFavorites = getFavoritesByType('package');

  const handleRefresh = async () => {
    await loadFavoritePackages();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
    <div className="container mx-auto px-4 max-w-7xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] text-white">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              My Favorites
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {packageFavorites.length === 0
              ? 'You haven\'t favorited any packages yet.'
              : `You have ${packageFavorites.length} favorite ${packageFavorites.length === 1 ? 'package' : 'packages'}.`
            }
          </p>
        </div>
        {packageFavorites.length > 0 && (
          <Button
            variant="outline"
            onClick={handleRemoveAll}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your favorites...</p>
        </div>
      ) : favoritePackages.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No Favorites Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Start exploring our packages and click the heart icon to save your favorites for later.
          </p>
          <Link to="/packages">
            <Button className="group">
              <Package className="w-4 h-4 mr-2" />
              <span>Browse Packages</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritePackages.map((pkg) => (
              <PackageCard 
                key={pkg.package_id || pkg.id} 
                package={pkg}
                viewMode="grid"
              />
            ))}
          </div>
          
          {/* Back to Packages Link */}
          <div className="mt-8 text-center">
            <Link to="/packages">
              <Button variant="outline" className="group">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform" />
                <span>Browse More Packages</span>
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
    </PullToRefresh>
  );
};

export default Favorites;

