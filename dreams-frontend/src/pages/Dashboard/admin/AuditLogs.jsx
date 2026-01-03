import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import { toast } from "react-toastify";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar from "../../../components/layout/AdminSidebar";
import AdminNavbar from "../../../components/layout/AdminNavbar";
import { useSidebar } from "../../../context/SidebarContext";

const AuditLogs = () => {
  const { isCollapsed } = useSidebar();
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

  const getActionBadgeColor = (action) => {
    if (action.includes("created"))
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
    if (action.includes("updated"))
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
    if (action.includes("deleted"))
      return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    if (action.includes("status_changed"))
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
    if (action.includes("assigned"))
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
    return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <AdminNavbar />
      <main
        className="flex-1 bg-gradient-to-b from-[#FFF7F0] to-white dark:from-gray-900 dark:to-gray-800 min-h-screen transition-all duration-300 pt-16"
        style={{
          marginLeft: isCollapsed ? '5rem' : '16rem',
          width: isCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 16rem)',
        }}
      >
        <div className="p-4 sm:p-6 lg:p-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              Audit Logs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Track all administrative actions and changes in the system
            </p>
          </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search descriptions..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                Action
              </label>
              <input
                type="text"
                placeholder="e.g., package.created"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                Model Type
              </label>
              <input
                type="text"
                placeholder="e.g., App\Models\EventPackage"
                value={filters.model_type}
                onChange={(e) =>
                  handleFilterChange("model_type", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                User ID
              </label>
              <input
                type="number"
                placeholder="User ID"
                value={filters.user_id}
                onChange={(e) => handleFilterChange("user_id", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  handleFilterChange("start_date", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Loading audit logs...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-2 text-gray-600 dark:text-gray-400 transition-colors duration-300">
              No audit logs found
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-[800px] divide-y divide-gray-200 dark:divide-gray-700 w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-300">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                                {log.user.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                {log.user.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 transition-colors duration-300">
                        {log.description || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                        {log.model_type ? (
                          <div>
                            <div className="font-medium">
                              {log.model_type.split("\\").pop()}
                            </div>
                            {log.model_id && (
                              <div className="text-xs">ID: {log.model_id}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                        {log.ip_address || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between transition-colors duration-300">
                <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Showing{" "}
                  {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                  {Math.min(
                    pagination.current_page * pagination.per_page,
                    pagination.total
                  )}{" "}
                  of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        current_page: Math.max(1, prev.current_page - 1),
                      }))
                    }
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        current_page: Math.min(
                          prev.last_page,
                          prev.current_page + 1
                        ),
                      }))
                    }
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
        </div>
      </main>
    </div>
  );
};

export default AuditLogs;
