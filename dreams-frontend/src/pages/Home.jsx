import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import PackageCard from '../components/PackageCard';
import Button from '../components/Button';

const Home = () => {
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPackages = async () => {
      try {
        const response = await api.get('/packages?featured=true');
        setFeaturedPackages(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPackages();
  }, []);

  return (
    <div>
      <section className="bg-primary text-white text-center py-16 mb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Dreams Events</h1>
          <p className="text-xl mb-8 text-gray-200">Your perfect event is just a click away</p>
          <Link to="/packages">
            <Button className="text-lg px-8 py-3 bg-white text-primary hover:bg-gray-100">
              Explore Packages
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Featured Packages</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Loading packages...</p>
          </div>
        ) : featuredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPackages.map((pkg) => (
              <PackageCard key={pkg.id} package={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No featured packages available at the moment.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;

