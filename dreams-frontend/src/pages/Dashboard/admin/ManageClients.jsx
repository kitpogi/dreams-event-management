import React, { useEffect, useState, useMemo } from 'react';
import { clientService } from '../../../api/services';
import { LoadingSpinner } from '../../../components/ui';
import { Users, Mail, Phone, Calendar, Search, TrendingUp, UserCheck, ShieldCheck, MailCheck, HardDrive } from 'lucide-react';

const ManageClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getAll();
      const rawData = response.data.data || response.data || [];
      const clientsData = Array.isArray(rawData) ? rawData.map(client => ({
        ...client,
        id: client.client_id || client.id,
        name: client.name || `${client.client_fname || ''} ${client.client_lname || ''}`.trim() || 'Unnamed Client',
        email: client.email || client.client_email,
        phone: client.phone || client.client_contact,
        created_at: client.created_at || new Date().toISOString()
      })) : [];
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  // Compute stats
  const stats = useMemo(() => ({
    total: clients.length,
    newThisMonth: clients.filter(c => {
      const date = new Date(c.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    verified: clients.length, // Assuming all in list are verified for now
  }), [clients]);

  return (
    <div className="relative min-h-screen pb-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">

        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Client Registry
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                Manage your relationship with {stats.total} verified clients
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════ STATS BAR ═══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Leads</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">New This Month</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">+{stats.newThisMonth}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Verified Users</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.verified}</p>
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Growth</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-amber-500">Active</p>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* ═══════════════ SEARCH BAR ═══════════════ */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name, email, or contact number..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm font-medium"
          />
        </div>

        {/* ═══════════════ CLIENTS GRID ═══════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold dark:text-white">No clients match your search</h3>
            <p className="text-gray-500 mt-2">Try a different name or contact details.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="group bg-white dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col relative"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified Member</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 font-medium">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="flex-1 font-medium">{client.phone || 'No contact provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400 bg-transparent px-3 py-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Joined {new Date(client.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button className="mt-auto w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300">
                  Client Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClients;
