"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Calendar, MapPin,
  BarChart2, Loader2, User, Zap, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FieldReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- FETCH REPORTS ---
  const fetchReports = async () => {
    setLoading(true);
    try {
      // We need a new endpoint for this or filter existing sales? 
      // Wait, we posted to /api/operations/reports. We need to GET from there or similar.
      // Let's assume GET /api/operations/reports exists or we create it.
      // The user approved plan says "Create new Field Reports view".

      const res = await fetch("/api/operations/reports");
      const data = await res.json();
      if (res.ok) {
        setReports(data.data || []);
      } else {
        // If endpoint doesn't exist yet, we handle it.
        console.error("Fetch failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load Field Reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r =>
    r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900 font-sans">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200/60 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Field Intelligence</h1>
          <p className="text-slate-500 font-medium text-xs mt-1.5">Daily Operations & Competitor Pricing</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search Agent..."
              className="bg-transparent text-xs font-bold text-slate-700 outline-none w-40 placeholder:text-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto nexus-card overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Intelligence...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date / Agent</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Traffic Stats</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Competitor Prices</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock Gaps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-6 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <User size={14} className="text-blue-500" />
                          {report.user?.name || "Unknown Agent"}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 align-top">
                      <div className="flex gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex-1 text-center min-w-[70px]">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Walk-Ins</div>
                          <div className="text-sm font-black text-slate-900">{report.walkIns}</div>
                        </div>
                        <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex-1 text-center min-w-[70px]">
                          <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Sales</div>
                          <div className="text-sm font-black text-blue-700">{report.buyers}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 align-top">
                      {report.marketIntel ? (
                        <div className="space-y-2">
                          {(() => {
                            try {
                              const intel = JSON.parse(report.marketIntel);
                              if (!Array.isArray(intel) || intel.length === 0) return <span className="text-[10px] text-slate-400 italic">No Data</span>;
                              return intel.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100">
                                  <Zap size={10} className="text-amber-500 fill-amber-500" />
                                  <span className="font-bold text-slate-900">{item.brand} {item.model}</span>
                                  <div className="h-px flex-1 bg-slate-200 mx-1 border-dashed"></div>
                                  <span className="font-bold text-slate-900">₵{item.price}</span>
                                </div>
                              ));
                            } catch (e) {
                              return <span className="text-[10px] text-red-400">Error parsing intel</span>;
                            }
                          })()}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No Data</span>
                      )}
                    </td>
                    <td className="px-6 py-6 align-top">
                      {report.stockGaps ? (
                        <div className="text-[11px] font-medium text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 leading-relaxed max-w-xs">
                          {report.stockGaps}
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                          Stock Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}