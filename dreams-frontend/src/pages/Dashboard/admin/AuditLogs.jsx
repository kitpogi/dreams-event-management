import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import { toast } from "react-toastify";
import { LoadingSpinner, Pagination } from "../../../components/ui";
import {
  Search, Filter, FileText, User, Calendar, ArrowLeft,
  Activity, ShieldAlert, Clock, ChevronDown, Trash2, Edit3, Plus,
  RefreshCw, TrendingUp, HardDrive
} from "lucide-react";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    action: "",
    model_type: "",
    user_id: "",
    start_date: "",
    end_date: "",
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [pagination.current_page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      };

      const response = await api.get("/audit-logs", { params });
      setLogs(response.data.data);
      setPagination(response.data.meta);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      action: "",
      model_type: "",
      user_id: "",
      start_date: "",
      end_date: "",
    });
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (action) => {
    if (!action || typeof action !== 'string') return <Activity className="w-4 h-4" />;
    if (action.includes("created")) return <Plus className="w-4 h-4" />;
    if (action.includes("updated")) return <Edit3 className="w-4 h-4" />;
    if (action.includes("deleted")) return <Trash2 className="w-4 h-4" />;
    if (action.includes("status")) return <RefreshCw className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionBadgeColor = (action) => {
    if (!action || typeof action !== 'string') return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    if (action.includes("created"))
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (action.includes("updated"))
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (action.includes("deleted"))
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    if (action.includes("status_changed"))
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (action.includes("assigned"))
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  return (
    <div className="relative min-h-screen pb-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-20">

        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-500/20 transition-transform hover:scale-105">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                System Audit Logs
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">
                Monitor and review all administrative activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ═══════════════ STATS BAR ═══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Logs</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{pagination.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Alert Level</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">Normal</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Storage</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">92%</p>
              <HardDrive className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Trend</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-amber-500">Stable</p>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* ═══════════════ SEARCH & FILTERS ═══════════════ */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by action, model or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${showFilters ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300">
              <input type="date" value={filters.start_date} onChange={(e) => handleFilterChange("start_date", e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              <input type="date" value={filters.end_date} onChange={(e) => handleFilterChange("end_date", e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              <select value={filters.action} onChange={(e) => handleFilterChange("action", e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                <option value="">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
              </select>
              <input type="text" placeholder="User ID" value={filters.user_id} onChange={(e) => handleFilterChange("user_id", e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              <button onClick={clearFilters} className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors">Clear All Filters</button>
            </div>
          )}
        </div>

        {/* ═══════════════ LOGS TABLE ═══════════════ */}
        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-left">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Event Time</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Administrator</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Action Protocol</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Resource Target</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Operation Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <LoadingSpinner size="lg" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <p className="text-gray-500 font-bold italic">No audit records identified.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{formatDate(log.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs font-bold">
                            {log.user?.client_fname?.[0] || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">
                              {log.user?.client_fname} {log.user?.client_lname}
                            </p>
                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">ID: #{log.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getActionBadgeColor(log.action || '')}`}>
                          {getActionIcon(log.action || '')}
                          {(log.action || 'system_event').replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {log.model_type ? log.model_type.split("\\").pop() : 'System'}
                          </span>
                          <span className="text-[10px] font-black text-gray-400">#{log.model_id || '0'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1 max-w-[200px]" title={log.description}>
                          {log.description}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              total={pagination.total}
              perPage={pagination.per_page}
              onPageChange={(p) => setPagination({ ...pagination, current_page: p })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
