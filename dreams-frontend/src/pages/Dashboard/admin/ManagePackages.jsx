import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner, Pagination } from '../../../components/ui';
import {
  Package, Plus, Trash2, Edit3, Users, DollarSign, Star, Eye, EyeOff, Search,
  TrendingUp, MapPin, ListFilter, LayoutGrid, Clock, Hash
} from 'lucide-react';

const ManagePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, packageId: null });
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    fetchPackages(page);
  }, [location.pathname, page]);

  const fetchPackages = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/packages', {
        params: {
          page: pageToLoad,
          per_page: perPage,
          include_inactive: true,
        },
      });
      const responseData = response.data.data || response.data;
      setPackages(Array.isArray(responseData) ? responseData : []);
      setMeta(response.data.meta || { total: 0, last_page: 1 });
      setPage(response.data.meta?.current_page || pageToLoad);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, packageId: id });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.packageId;
    if (!id) return;

    try {
      await api.delete(`/packages/${id}`);
      toast.success('Package deleted successfully');
      fetchPackages(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    } finally {
      setDeleteConfirm({ isOpen: false, packageId: null });
    }
  };

  const handleToggleStatus = async (pkg, field) => {
    try {
      const updatedValue = !pkg[field];
      const formData = new FormData();
      formData.append(field, updatedValue ? '1' : '0');
      formData.append('_method', 'PUT');

      await api.post(`/packages/${pkg.package_id}`, formData);

      setPackages(prev => prev.map(p =>
        p.package_id === pkg.package_id ? { ...p, [field]: updatedValue } : p
      ));

      toast.success(`Package ${field === 'is_active' ? 'visibility' : 'feature status'} updated!`);
    } catch (error) {
      console.error(`Error toggling ${field}:`, error);
      toast.error(`Failed to update ${field.replace('is_', '').replace('_', ' ')}`);
    }
  };

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg =>
      pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.package_category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [packages, searchQuery]);

  // Compute stats
  const stats = useMemo(() => ({
    totalValue: packages.reduce((sum, p) => sum + parseFloat(p.package_price || 0), 0),
    avgCapacity: packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + (parseInt(p.capacity) || 0), 0) / packages.length) : 0,
    featured: packages.filter(p => p.is_featured).length,
    active: packages.filter(p => p.is_active).length
  }), [packages]);

  return (
    <div className="relative min-h-screen pb-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">

        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Experience Catalog
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                Manage your bundled service packages and pricing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/packages/create"
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all font-black"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Package</span>
            </Link>
          </div>
        </div>

        {/* ═══════════════ STATS BAR ═══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Catalog</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{meta.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Live Packages</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Featured</p>
            <p className="text-3xl font-extrabold text-amber-500">{stats.featured}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Capacity</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats.avgCapacity} pax</p>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* ═══════════════ SEARCH BAR ═══════════════ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packages by name or category..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500">
            <LayoutGrid className="w-4 h-4" />
            Grid View
          </div>
        </div>

        {/* ═══════════════ PACKAGES GRID ═══════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/50 dark:bg-gray-800/20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem]">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold dark:text-white">No packages found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or start fresh by creating one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.package_id}
                className="group bg-white dark:bg-gray-900/70 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {pkg.package_image ? (
                    <img
                      src={pkg.package_image}
                      alt={pkg.package_name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                  {/* Controls Overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(pkg, 'is_active')}
                        className={`px-3 py-1.5 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border ${pkg.is_active ? 'bg-emerald-500/80 text-white border-emerald-400/50' : 'bg-gray-500/80 text-white border-gray-400/50'}`}
                      >
                        {pkg.is_active ? 'Online' : 'Draft'}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(pkg, 'is_featured')}
                        className={`p-2 backdrop-blur-md rounded-xl transition-all active:scale-95 border ${pkg.is_featured ? 'bg-amber-500 text-white border-amber-400' : 'bg-white/20 border-white/30 text-white'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${pkg.is_featured ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[9px] font-black tracking-widest uppercase">
                      {pkg.package_category || 'General'}
                    </span>
                  </div>

                  <div className="absolute bottom-5 left-6 right-6">
                    <h3 className="text-xl font-black text-white leading-tight line-clamp-2 drop-shadow-md">
                      {pkg.package_name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                        Starting At
                      </span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                        ₱{parseFloat(pkg.package_price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                        Attendance
                      </span>
                      <span className="text-xl font-black text-gray-900 dark:text-white">
                        {pkg.capacity || '0'}<span className="text-xs font-bold ml-1 text-gray-400">PAX</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <Link
                      to={`/admin/packages/${pkg.package_id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all duration-300"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(pkg.package_id)}
                      className="p-3.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-300 border border-red-100 dark:border-red-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredPackages.length > 0 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={perPage}
              onPageChange={(p) => setPage(p)}
              onPerPageChange={() => { }}
            />
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, packageId: null })}
        onConfirm={handleDelete}
        title="Sanitize Experience"
        message="Are you sure you want to remove this package from the live catalog? This action will archive all associated assets."
        confirmText="Confirm Removal"
        variant="danger"
      />
    </div>
  );
};

export default ManagePackages;
