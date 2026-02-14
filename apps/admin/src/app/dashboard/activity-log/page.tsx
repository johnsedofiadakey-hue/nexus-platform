"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowLeft, RefreshCcw, Filter, Search,
  User, ShoppingCart, FileText, Target, Users,
  Settings, Calendar, Clock, MapPin, Loader2, ChevronDown
} from "lucide-react";

interface ActivityLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  shopId: string;
  shopName: string;
  createdAt: string;
}

export default function MasterActivityLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: "",
    entity: "",
    userId: "",
    shopId: "",
    search: "",
  });
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      if (filters.action) params.append("action", filters.action);
      if (filters.entity) params.append("entity", filters.entity);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.shopId) params.append("shopId", filters.shopId);

      const response = await fetch(`/api/activity-log?${params.toString()}`);
      const payload = await response.json();

      if (payload.success) {
        const inner = payload.data;
        setLogs(inner?.data ?? inner ?? []);
        setTotal(inner?.total ?? payload.total ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [offset]);

  const getActionIcon = (action: string) => {
    if (action.includes("SALE")) return <ShoppingCart size={14} className="text-emerald-500" />;
    if (action.includes("TARGET")) return <Target size={14} className="text-blue-500" />;
    if (action.includes("REPORT")) return <FileText size={14} className="text-amber-500" />;
    if (action.includes("USER") || action.includes("LOGIN")) return <User size={14} className="text-purple-500" />;
    return <Activity size={14} className="text-slate-500" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATED")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (action.includes("UPDATED")) return "bg-blue-50 text-blue-600 border-blue-100";
    if (action.includes("DELETED")) return "bg-red-50 text-red-600 border-red-100";
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  const filteredLogs = logs.filter((log) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        (log.description || '').toLowerCase().includes(searchLower) ||
        (log.userName || '').toLowerCase().includes(searchLower) ||
        (log.action || '').toLowerCase().includes(searchLower) ||
        (log.entity || '').toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 px-8 py-5">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="p-2.5 -ml-2 rounded-xl hover:bg-slate-100/80 text-slate-400 hover:text-slate-900 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Master Activity Log</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                System-Wide Activity Tracking • {total.toLocaleString()} Total Events
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setOffset(0);
              fetchLogs();
            }}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8">
        {/* Filters */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Filter size={18} className="text-slate-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Filter Activities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select
              className="h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
              value={filters.entity}
              onChange={(e) => {
                setFilters({ ...filters, entity: e.target.value });
                setOffset(0);
              }}
            >
              <option value="">All Entities</option>
              <option value="Sale">Sales</option>
              <option value="Target">Targets</option>
              <option value="DailyReport">Reports</option>
              <option value="User">Users</option>
              <option value="Product">Products</option>
            </select>
            <button
              onClick={() => {
                setOffset(0);
                fetchLogs();
              }}
              className="h-12 px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({ action: "", entity: "", userId: "", shopId: "", search: "" });
                setOffset(0);
                fetchLogs();
              }}
              className="h-12 px-6 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Activity Log Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Live Activity Stream</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Showing {filteredLogs.length} of {total} events
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Activities...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <Clock size={12} />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User size={14} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">{log.userName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{log.userRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-700">{log.entity}</span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-xs font-medium text-slate-600 line-clamp-2">{log.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        {log.shopName ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <MapPin size={10} />
                            {log.shopName}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Activity size={48} className="text-slate-200 mb-4" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Activities Found</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && total > limit && (
            <div className="px-8 py-6 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
