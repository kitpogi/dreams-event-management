import React, { useEffect, useState } from 'react';
import { clientService } from '../../../api/services';
import { LoadingSpinner } from '../../../components/ui';

const ManageClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientService.getAll();
      const clientsData = response.data.data || response.data || [];
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
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
          <div className="mb-10 flex items-center gap-4">
            <div className="flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Manage Clients
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
                View and manage all registered clients
              </p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50 transition-all duration-300 hover:shadow-3xl">
              {clients.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 mb-6">
                    <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No clients found</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-base">No clients have registered yet.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-extrabold text-white uppercase tracking-wider">
                        Total Bookings
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {clients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10 transition-all duration-200 group border-l-4 border-transparent hover:border-indigo-500"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200 font-medium">
                            {client.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">
                            {client.phone || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {client.bookings_count || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default ManageClients;
