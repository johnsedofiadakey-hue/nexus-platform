"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, RefreshCcw, Users, Signal,
  Activity, Package, ShieldAlert, Building2, Map as MapIcon, Table,
  Lock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import dynamic from 'next/dynamic';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// 🛰️ DYNAMIC MAP IMPORT (Fixed for Next.js 16 Turbopack stability)
const AdminHQMap = dynamic(() => import('@/components/maps/AdminHQMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse rounded-sm flex flex-col items-center justify-center">
      <RefreshCcw className="animate-spin text-slate-300 mb-2" size={20} />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calibrating Satellite...</span>
    </div>
  )
});

// --- UI: METRIC CARD ---
const StatCard = ({ label, value, sub, icon: Icon, active, alert }: any) => (
  <div className={`bg-white p-5 border ${alert ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'} shadow-sm flex flex-col justify-between h-32 transition-all hover:border-slate-300`}>
    <div className="flex justify-between items-start">
      <div className={`p-2 rounded-sm ${active ? 'bg-emerald-100 text-emerald-700' : alert ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      {active && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
      <div className="flex justify-between items-end mt-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        {sub && <p className="text-[10px] font-medium text-slate-400">{sub}</p>}
      </div>
    </div>
  </div>
);

export default function OperationsHub() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ shops: [], team: [], analytics: {}, pulse: [] });
  const [viewMode, setViewMode] = useState<'DATA' | 'MAP'>('DATA');

  // --- 🚀 OPTIMIZED DATA FETCHER ---
  const fetchData = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const t = Date.now();
      // Added timeout signal to prevent "forever loading" if Supabase is slow
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort("Request Timeout"), 30000); // Increased to 30s

      const [analyticsRes, pulseRes, shopsRes, teamRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?t=${t}`, { signal: controller.signal }),
        fetch(`/api/operations/pulse-feed?t=${t}`, { signal: controller.signal }),
        fetch(`/api/shops/list?t=${t}`, { signal: controller.signal }),
        fetch(`/api/hr/team/list?t=${t}`, { signal: controller.signal })
      ]);

      clearTimeout(timeoutId);

      const [analytics, pulse, shops, team] = await Promise.all([
        analyticsRes.json().catch(() => ({})),
        pulseRes.json().catch(() => []),
        shopsRes.json().catch(() => []),
        teamRes.json().catch(() => ({ data: [] }))
      ]);

      setData({
        analytics: analytics || {},
        pulse: Array.isArray(pulse) ? pulse : [],
        shops: Array.isArray(shops) ? shops : (shops.data || []),
        team: Array.isArray(team?.data) ? team.data : (Array.isArray(team) ? team : [])
      });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.warn("Dashboard Sync Timeout: Network is slow.");
        // Optional: Show Toast here
      } else {
        console.error("Dashboard Sync Error:", e);
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  // --- 🛡️ ROLE PROTECTION & BOOT ---
  useEffect(() => {
    // --- 🛡️ ROLE PROTECTION & BOOT & LIVE SYNC ---
    useEffect(() => {
      if (status === "unauthenticated") {
        router.push("/auth/signin");
      } else if (status === "authenticated") {
        if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
          router.push("/mobilepos"); // Bounce unauthorized users
        } else {
          fetchData();
          // 🔄 LIVE SYNC: Refresh every 15 seconds
          const interval = setInterval(fetchData, 15000);
          return () => clearInterval(interval);
        }
      }
    }, [status, session, router, fetchData]);

    // --- DERIVED METRICS (Memoized) ---
    const stats = useMemo(() => {
      const active = Array.isArray(data.team) ? data.team.filter((u: any) => u.status === 'ACTIVE' || u.isInsideZone).length : 0;
      const total = Array.isArray(data.team) ? data.team.length : 0;
      const inv = Array.isArray(data.shops) ? data.shops.reduce((acc: number, s: any) => acc + (s.stats?.inventory || 0), 0) : 0;
      const alertCount = Array.isArray(data.pulse) ? data.pulse.filter((p: any) => p.type === 'GHOST_ALERT').length : 0;
      const chart = (data.analytics as any).chartData || [];

      return { active, total, inv, alertCount, chart };
    }, [data]);

    // --- LOADING STATE ---
    if (status === "loading" || loading) return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <LayoutDashboard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Nexus System Boot</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Verifying Terminal Permissions...</p>
          </div>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900 font-sans">

        {/* HEADER */}
        <div className="max-w-[1920px] mx-auto mb-6 flex justify-between items-center bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-2.5 rounded-sm shadow-lg shadow-slate-900/20">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight leading-none">Nexus Control</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Operations Center • {session?.user?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 mr-2">
              <button
                onClick={() => setViewMode('DATA')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-sm flex items-center gap-2 transition-all ${viewMode === 'DATA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Table size={12} /> Matrix
              </button>
              <button
                onClick={() => setViewMode('MAP')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-sm flex items-center gap-2 transition-all ${viewMode === 'MAP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <MapIcon size={12} /> Satellite
              </button>
            </div>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm"
            >
              <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Sync
            </button>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto space-y-6">

          {/* ROW 1: KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Field Force" value={stats.total} sub="Registered Agents" icon={Users} />
            <StatCard label="Live Signal" value={stats.active} sub="Online Now" icon={Signal} active={true} />
            <StatCard label="Global Stock" value={stats.inv.toLocaleString()} sub="Total SKUs" icon={Package} />
            <StatCard label="Security" value={stats.alertCount} sub="Active Alerts" icon={ShieldAlert} alert={stats.alertCount > 0} />
          </div>

          {/* ROW 2: MAIN VIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[520px]">

            <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm flex flex-col relative overflow-hidden transition-all">
              {viewMode === 'MAP' ? (
                <div className="h-full w-full relative z-0">
                  <AdminHQMap shops={data.shops} />
                  <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur px-3 py-2 rounded border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Network Coverage</p>
                    <p className="text-xs font-black text-slate-900">{data.shops.length} Active Hubs</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Building2 size={14} className="text-blue-600" /> Hub Performance Matrix
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0 z-10">
                        <tr>
                          <th className="px-5 py-3 border-b border-slate-200">Hub Location</th>
                          <th className="px-5 py-3 border-b border-slate-200">Address</th>
                          <th className="px-5 py-3 border-b border-slate-200 text-right">Revenue (Est)</th>
                          <th className="px-5 py-3 border-b border-slate-200 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {data.shops.map((shop: any) => (
                          <tr key={shop.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-4 font-bold text-slate-700">{shop.name}</td>
                            <td className="px-5 py-4 text-slate-500">{shop.location || "N/A"}</td>
                            <td className="px-5 py-4 text-right font-mono text-slate-600">
                              ₵{((shop.stats?.inventory || 0) * 150).toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm text-[9px] font-bold uppercase">Online</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Package size={14} className="text-slate-500" /> Critical Stock
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 border-b border-slate-200">Hub</th>
                      <th className="px-5 py-3 border-b border-slate-200 text-right">Qty</th>
                      <th className="px-5 py-3 border-b border-slate-200 text-right">Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {data.shops.map((shop: any) => (
                      <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-700">{shop.name}</td>
                        <td className="px-5 py-3 text-right font-mono text-slate-500">{shop.stats?.inventory || 0}</td>
                        <td className="px-5 py-3 text-right">
                          <div className={`h-2 w-2 rounded-full ml-auto ${(shop.stats?.inventory || 0) < 10 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                            }`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ROW 3: VELOCITY CHART */}
          <div className="bg-white p-6 border border-slate-200 shadow-sm h-[300px] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-blue-500" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transaction Velocity</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 24 Hours</p>
            </div>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chart} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                    {stats.chart.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0F172A' : '#2563EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    );
  }