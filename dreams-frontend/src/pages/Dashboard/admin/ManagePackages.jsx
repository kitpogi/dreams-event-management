import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { ConfirmationModal, LoadingSpinner } from '../../../components/ui';

const ManagePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, packageId: null });
  const location = useLocation();

  useEffect(() => {
    fetchPackages(page);
  }, [location.pathname, page]); // Refresh when route or page changes

  const fetchPackages = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/packages', {
        params: {
          page: pageToLoad,
          per_page: perPage,
        },
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

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, packageId: id });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.packageId;
    if (!id) return;

    try {
      await api.delete(`/packages/${id}`);
      toast.success('Package deleted successfully');
      fetchPackages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    } finally {
      setDeleteConfirm({ isOpen: false, packageId: null });
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto">
          {/* Header Section with Icon */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Manage Packages
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
                  Create and manage event packages
                </p>
              </div>
            </div>
            <Link
              to="/admin/packages/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Package
            </Link>
          </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50 transition-all duration-300 hover:shadow-3xl">
            {packages.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 mb-6">
                  <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No packages found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-base mb-8">Create your first package to get started</p>
                <Link
                  to="/admin/packages/create"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Package
                </Link>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {packages.map((pkg, index) => (
                      <tr
                        key={pkg.package_id || index}
                        className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10 transition-all duration-200 group border-l-4 border-transparent hover:border-indigo-500"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {pkg.package_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {pkg.package_category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            ₱{parseFloat(pkg.package_price).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {pkg.capacity || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/admin/packages/${pkg.package_id}/edit`}
                              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(pkg.package_id)}
                              className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {packages.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page <span className="font-bold">{page}</span> of <span className="font-bold">{meta.last_page || 1}</span> • <span className="font-bold">{meta.total || 0}</span> total
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 text-sm font-medium border-2 border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-300 hover:border-gray-400 disabled:hover:border-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => (meta.last_page ? Math.min(meta.last_page, p + 1) : p + 1))}
                    disabled={meta.last_page ? page >= meta.last_page : false}
                    className="px-4 py-2 text-sm font-medium border-2 border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-300 hover:border-gray-400 disabled:hover:border-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <ConfirmationModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, packageId: null })}
          onConfirm={handleDelete}
          title="Delete Package"
          message="Are you sure you want to delete this package? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
        </div>
    </div>
  );
};

export default ManagePackages;

