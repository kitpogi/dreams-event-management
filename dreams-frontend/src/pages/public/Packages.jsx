import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PackageCard } from '../../components/features';
import { Card, Button, Input } from '../../components/ui';

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
  });

  useEffect(() => {
    fetchPackages(page);
  }, [page]);

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

  const handleSearch = () => {
    setPage(1);
    fetchPackages(1);
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Event Packages</h1>
      
      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              name="search"
              placeholder="Search packages..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <input
              type="number"
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              name="minPrice"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="wedding">Wedding</option>
              <option value="debut">Debut</option>
              <option value="birthday">Birthday</option>
              <option value="pageant">Pageant</option>
              <option value="corporate">Corporate</option>
              <option value="anniversary">Anniversary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
          <input
            type="number"
            className="w-full md:w-auto md:max-w-xs px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
          />
          <select
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="w-full md:w-auto md:max-w-xs px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <Button onClick={handleSearch} className="w-full md:w-auto">
            Filter
          </Button>
        </div>
      </Card>

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

