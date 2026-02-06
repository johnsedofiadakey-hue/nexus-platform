"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, RefreshCcw, Users, Signal,
  Activity, Package, ShieldAlert, Building2, Map as MapIcon, Table,
  Lock, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import dynamic from 'next/dynamic';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LivePulseFeed from "@/components/dashboard/LivePulseFeed";
import ActivityLogWidget from "@/components/dashboard/ActivityLogWidget";

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

// --- UI: METRIC CARD (Professional Enterprise Design) ---
const StatCard = ({ label, value, sub, icon: Icon, active, alert }: any) => (
  <div className={`bg-white border p-5 flex flex-col justify-between h-28 ${active ? 'border-blue-500' : alert ? 'border-red-500' : 'border-slate-200'}`}>
    <div className="flex justify-between items-start">
      <div className={`p-2 ${active ? 'bg-blue-50 text-blue-600' : alert ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
        <Icon size={16} strokeWidth={2} />
      </div>
      {active && <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />}
    </div>
    <div>
      <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</h3>
      <div className="flex justify-between items-end mt-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[9px] text-slate-400">{sub}</p>}
      </div>
    </div>
  </div>
);

export default function OperationsHub() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ shops: [], team: [], analytics: {}, pulse: [], adminTarget: null });
  const [viewMode, setViewMode] = useState<'DATA' | 'MAP'>('DATA');
  const [showTargetModal, setShowTargetModal] = useState(false);

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
        team: Array.isArray(team?.data) ? team.data : (Array.isArray(team) ? team : []),
        adminTarget: (analytics as any).adminTarget || null
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error("Sync Error:", e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // --- 🛡️ ROLE PROTECTION & BOOT ---
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initializing Command...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900 font-sans">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center bg-white border border-slate-200 p-5">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-2.5">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-medium text-slate-500">Live • {session?.user?.name}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('DATA')}
              className={`px-3 py-2 text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${viewMode === 'DATA' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Table size={12} /> List
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-2 text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${viewMode === 'MAP' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MapIcon size={12} /> Map
            </button>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 text-[10px] font-semibold transition-colors"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Sync
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-5">

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Field Team" value={stats.total} sub="Registered Agents" icon={Users} />
          <StatCard label="Active Now" value={stats.active} sub="Online Signal" icon={Signal} active={true} />
          <StatCard label="Inventory Level" value={stats.inv.toLocaleString()} sub="Total Units" icon={Package} />
          <StatCard label="Security Alerts" value={stats.alertCount} sub="Req. Attention" icon={ShieldAlert} alert={stats.alertCount > 0} />
        </div>

        {/* MAIN GRID: HUB PERFORMANCE + ACTIVITY LOG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT: HUB PERFORMANCE OR MAP (2/3 width) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 flex flex-col relative overflow-hidden h-[580px]">
            {viewMode === 'MAP' ? (
              <div className="h-full w-full relative z-0">
                <AdminHQMap shops={data.shops} />
                <div className="absolute top-4 left-4 z-[400] bg-white border border-slate-200 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Network</p>
                  <p className="text-sm font-bold text-slate-900">{data.shops.length} Active Hubs</p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 px-5 py-3 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 size={14} className="text-slate-500" /> Hub Performance
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Hub Location</th>
                        <th className="px-5 py-3">Address</th>
                        <th className="px-5 py-3 text-right">Est. Value</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.shops.map((shop: any) => (
                        <tr key={shop.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-5 py-3.5 font-semibold text-slate-900">{shop.name}</td>
                          <td className="px-5 py-3.5 text-slate-500">{shop.location || "N/A"}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                            ₵{((shop.stats?.inventory || 0) * 150).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium text-[9px]">
                              <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                              ONLINE
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: ACTIVITY LOG WIDGET (1/3 width) */}
          <div className="bg-white border border-slate-200">
            <ActivityLogWidget />
          </div>
        </div>

        {/* ACTIVITY PULSE FEED */}
        <div className="bg-white border border-slate-200">
          <LivePulseFeed data={data.pulse} />
        </div>

        {/* SALES VELOCITY CHART */}
        <div className="bg-white border border-slate-200 h-[320px] flex flex-col overflow-hidden p-5">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-white">
                <Activity size={14} />
              </div>
              <h3 className="text-xs font-semibold text-slate-900">Sales Velocity</h3>
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border border-slate-200 px-3 py-1">Last 24 Hours</p>
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#64748b' }} dy={10} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '2px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 600 }}
                />
                <Bar dataKey="sales" radius={[2, 2, 0, 0]}>
                  {stats.chart.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1e293b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 🎯 TARGET MODAL */}
      {showTargetModal && (
        <TargetModal onClose={() => setShowTargetModal(false)} onSuccess={() => { setShowTargetModal(false); fetchData(); }} userId={session?.user?.email} />
      )}

    </div>
  );
}

// --- SUB-COMPONENT: TARGET MODAL ---
function TargetModal({ onClose, onSuccess, userId }: any) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    targetValue: 50000,
    targetQuantity: 500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create for SELF
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userId: userId
        })
      });

      // If API requires userId, we need to pass it.
      // Let's check api/targets/route.ts. It takes userId from body.
      // If I don't pass userId, it fails?
      // Let's update `handleSubmit` to use a generic 'SELF' flag or better yet, pass ID from parent.

      if (res.ok) onSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white p-8 max-w-md w-full relative overflow-hidden shadow-xl border border-slate-200">
        <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
          <h3 className="text-base font-bold text-slate-900">Set Leadership Target</h3>
          <button onClick={onClose}>
            <div className="p-2 bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors">
              <RefreshCcw className="rotate-45" size={16} />
            </div>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Revenue Goal (GHS)</label>
            <input
              type="number"
              className="w-full border border-slate-200 px-4 py-2.5 text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
              value={form.targetValue}
              onChange={e => setForm({ ...form, targetValue: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Volume Goal (Units)</label>
            <input
              type="number"
              className="w-full border border-slate-200 px-4 py-2.5 text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
              value={form.targetQuantity}
              onChange={e => setForm({ ...form, targetQuantity: parseInt(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Start Date</label>
              <input type="date" className="w-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">End Date</label>
              <input type="date" className="w-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-slate-900 text-white h-11 font-semibold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? <RefreshCcw className="animate-spin" size={16} /> : 'Activate Target'}
        </button>
      </div>
    </div>
  );
}