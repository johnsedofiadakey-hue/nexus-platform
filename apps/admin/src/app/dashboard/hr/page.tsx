"use client";

import React, { useEffect, useState } from "react";
import {
  Users, UserPlus, Mail, ChevronRight, Loader2, Navigation, Search,
  Shield, Activity, UserCircle, FileText, RefreshCcw, Filter,
  MapPin, Zap, PackageSearch, Clock, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, User
} from "lucide-react";
import Link from "next/link";

type ViewMode = "ROSTER" | "FIELD_REPORTS";

// --- DailyReport Interface ---
interface DailyReport {
  id: string;
  createdAt: string;
  walkIns: number;
  inquiries: number;
  buyers: number;
  marketIntel?: string;
  stockGaps?: string;
  notes?: string;
  user: {
    name: string;
    image?: string;
    role?: string;
    shop?: {
      id?: string;
      name: string;
    };
  };
}

export default function TeamPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("ROSTER");

  // Field Reports State
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsFetched, setReportsFetched] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/hr/team/list?t=${Date.now()}`);
      const data = await res.json();
      const staffList = Array.isArray(data) ? data : (data.data || []);

      const agentsOnly = staffList.filter((user: any) =>
        ['PROMOTER', 'AGENT', 'WORKER', 'ASSISTANT'].includes(user.role)
      );

      setStaff(agentsOnly);
    } catch (e) {
      console.error("System Error: Team data unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch(`/api/operations/reports?promoterOnly=true&t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setReportsLoading(false);
      setReportsFetched(true);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  useEffect(() => {
    if (viewMode === "FIELD_REPORTS" && !reportsFetched) {
      fetchReports();
    }
  }, [viewMode, reportsFetched]);

  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  const enhancedStaff = staff.map(person => ({
    ...person,
    isOnline: person.lastSeen ? new Date(person.lastSeen).getTime() > fiveMinutesAgo : false
  }));

  const filteredStaff = enhancedStaff.filter(person =>
    person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: enhancedStaff.length,
    online: enhancedStaff.filter(s => s.isOnline).length,
    offline: enhancedStaff.filter(s => !s.isOnline).length,
    activePercent: enhancedStaff.length > 0
      ? Math.round((enhancedStaff.filter(s => s.isOnline).length / enhancedStaff.length) * 100)
      : 0
  };

  // Field Reports helpers
  const filteredReports = reports.filter(r =>
    r.user.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
    r.user.shop?.name?.toLowerCase().includes(reportSearch.toLowerCase()) ||
    r.notes?.toLowerCase().includes(reportSearch.toLowerCase())
  );

  const getConversionRate = (walkIns: number, buyers: number) => {
    if (walkIns === 0) return 0;
    return Math.round((buyers / walkIns) * 100);
  };

  const parseIntel = (intelStr?: string) => {
    if (!intelStr) return [];
    try {
      const parsed = JSON.parse(intelStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
        Acquiring Roster...
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-10 px-8 animate-in fade-in duration-700 font-sans pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personnel Command</h1>
          <p className="text-slate-500 font-medium text-sm">Manage field promoters, grant permissions, and monitor activity.</p>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === "FIELD_REPORTS" && (
            <button
              onClick={fetchReports}
              className="h-11 px-5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCcw size={14} className={reportsLoading ? "animate-spin" : ""} /> Refresh
            </button>
          )}
          <Link
            href="/dashboard/hr/enrollment"
            className="h-11 px-6 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            <UserPlus size={16} /> Recruit Promoter
          </Link>
        </div>
      </div>

      {/* VIEW MODE TABS */}
      <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
        <button
          onClick={() => setViewMode("ROSTER")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === "ROSTER"
            ? "bg-slate-900 text-white shadow-lg"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
        >
          <Users size={16} /> Personnel Roster
        </button>
        <button
          onClick={() => setViewMode("FIELD_REPORTS")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === "FIELD_REPORTS"
            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
            : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
          <FileText size={16} /> Field Reports
          {reports.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black ${viewMode === "FIELD_REPORTS" ? "bg-white/20" : "bg-blue-100 text-blue-600"}`}>
              {reports.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================= */}
      {/* VIEW: PERSONNEL ROSTER                         */}
      {/* ============================================= */}
      {viewMode === "ROSTER" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard label="Total Force" value={stats.total} icon={Users} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="Online Now" value={stats.online} icon={Navigation} color="text-emerald-600" bg="bg-emerald-50" pulse />
            <StatCard label="Offline Units" value={stats.offline} icon={Shield} color="text-slate-400" bg="bg-slate-50" />
            <StatCard label="Field Health" value={`${stats.activePercent}%`} icon={Activity} color="text-indigo-600" bg="bg-indigo-50" />
          </div>

          <div className="mb-8 flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-w-lg">
            <div className="w-12 h-12 flex items-center justify-center text-slate-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Filter by name or email..."
              className="flex-1 h-full bg-transparent text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStaff.length === 0 ? (
              <div className="col-span-full py-32 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">No Records Found</h3>
              </div>
            ) : (
              filteredStaff.map((person) => (
                <div
                  key={person.id}
                  className="group bg-white rounded-3xl border border-slate-200 p-1 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col"
                >
                  <div className="p-6 pb-0 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`pl-2 pr-3 py-1 rounded-full flex items-center gap-2 border ${person.isOnline ? 'bg-emerald-50 border-emerald-100/50 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${person.isOnline ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-100' : 'bg-slate-300'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {person.isOnline ? 'Live' : 'Offline'}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-slate-100 rounded-2xl mb-4 overflow-hidden border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                        {person.image ? (
                          <img src={person.image} className="w-full h-full object-cover" alt={person.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <UserCircle size={32} />
                          </div>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{person.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{person.role}</p>

                      <div className="bg-slate-50 rounded-xl p-3 mb-6 space-y-2 border border-slate-100">
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <Mail size={12} className="text-slate-400" />
                          <span className="truncate">{person.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <Navigation size={12} className="text-slate-400" />
                          <span className="truncate font-medium">{person.shop?.name || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/hr/member/${person.id}`}
                    className="mx-2 mb-2 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-colors"
                  >
                    View Intel <ChevronRight size={12} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ============================================= */}
      {/* VIEW: FIELD REPORTS (PROMOTERS ONLY)           */}
      {/* ============================================= */}
      {viewMode === "FIELD_REPORTS" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Reports" value={reports.length} icon={FileText} color="text-blue-600" bg="bg-blue-50" />
            <StatCard
              label="Avg Conversion"
              value={`${reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + (r.walkIns > 0 ? (r.buyers / r.walkIns) * 100 : 0), 0) / reports.length) : 0}%`}
              icon={TrendingUp}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              label="Total Walk-Ins"
              value={reports.reduce((sum, r) => sum + r.walkIns, 0)}
              icon={Activity}
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <StatCard
              label="Intel Reports"
              value={reports.filter(r => r.marketIntel && r.marketIntel !== '[]').length}
              icon={Zap}
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>

          {/* FILTERS */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <Filter size={18} className="text-slate-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Filter Registry</h2>
              <span className="ml-auto text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">
                Promoters Only
              </span>
            </div>
            <div className="relative max-w-2xl">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by promoter name, store, or notes..."
                className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
              />
            </div>
          </div>

          {/* REPORTS TABLE */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Field Intelligence Registry</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Promoter Reports &bull; {filteredReports.length} entries
                  </p>
                </div>
              </div>
            </div>

            {reportsLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reconstructing Intel...</p>
              </div>
            ) : filteredReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Promoter</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Store</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Traffic</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Conversion</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Intel</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[13px]">
                    {filteredReports.map((report) => (
                      <React.Fragment key={report.id}>
                        <tr className={`hover:bg-slate-50/50 transition-all group ${expandedId === report.id ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900">{new Date(report.createdAt).toLocaleDateString()}</span>
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                {report.user.image ? <img src={report.user.image} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900">{report.user.name}</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Promoter</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                              <MapPin size={12} className="text-blue-500" /> {report.user.shop?.name || "Unassigned"}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-4">
                              <div className="text-center">
                                <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">In</p>
                                <p className="font-black text-slate-700">{report.walkIns}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Buy</p>
                                <p className="font-black text-emerald-600">{report.buyers}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center">
                              <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black">
                                {getConversionRate(report.walkIns, report.buyers)}%
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-wrap gap-2">
                              {parseIntel(report.marketIntel).length > 0 ? (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                  <Zap size={10} /> {parseIntel(report.marketIntel).length} Intel
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase">&mdash;</span>
                              )}
                              {report.stockGaps && (
                                <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                  <PackageSearch size={10} /> Gap
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                              className={`p-2 rounded-xl transition-all ${expandedId === report.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                              {expandedId === report.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED INTEL */}
                        {expandedId === report.id && (
                          <tr className="bg-slate-50/30">
                            <td colSpan={7} className="px-12 py-8">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">

                                {/* COMPETITOR INTEL */}
                                <div className="space-y-6">
                                  <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Zap size={16} /></div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Competitor Analysis</h4>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {parseIntel(report.marketIntel).length > 0 ? (
                                      parseIntel(report.marketIntel).map((item: any, idx: number) => (
                                        <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-amber-400 transition-colors">
                                          <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{item.brand}</p>
                                            <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mkt Item</div>
                                          </div>
                                          <p className="text-sm font-black text-slate-900 mb-2">{item.model}</p>
                                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400">PRICE</span>
                                            <span className="text-base font-black text-slate-900">&#8373;{Number(item.price).toLocaleString()}</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="col-span-full py-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Competitor Data</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* STOCK GAPS & NOTES */}
                                <div className="space-y-6">
                                  <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><PackageSearch size={16} /></div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Critical Insights</h4>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Inventory Gaps</p>
                                      <p className={`text-sm font-medium leading-relaxed ${report.stockGaps ? 'text-slate-900' : 'text-slate-300'}`}>
                                        {report.stockGaps || "No inventory shortages reported."}
                                      </p>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Promoter Commentary</p>
                                      <p className={`text-sm font-medium leading-relaxed italic ${report.notes ? 'text-slate-700' : 'text-slate-300'}`}>
                                        &ldquo;{report.notes || "No additional field notes provided."}&rdquo;
                                      </p>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-200 mb-4">
                  <FileText size={32} />
                </div>
                <p className="text-sm font-bold text-slate-500 mb-1">No Field Reports</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promoter reports will appear here once submitted</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, pulse }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:scale-[1.02] transition-transform">
      <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
}
