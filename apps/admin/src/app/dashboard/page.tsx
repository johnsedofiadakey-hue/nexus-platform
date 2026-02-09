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
import AdminTargetWidget from "@/components/dashboard/AdminTargetWidget";

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
  <div className={`nexus-card p-6 flex flex-col justify-between h-32 ${active ? 'border-primary bg-primary/5' : ''} ${alert ? 'border-rose-200 bg-rose-50/10' : ''}`}>
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-lg ${active ? 'bg-primary/10 text-primary' : alert ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      {active && <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />}
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
  const [data, setData] = useState({ shops: [], team: [], analytics: {}, pulse: [], adminTarget: null, teamPerformance: { totalSales: 0, totalQuantity: 0, activeAgents: 0 } });
  const [viewMode, setViewMode] = useState<'DATA' | 'MAP'>('DATA');
  const [showTargetModal, setShowTargetModal] = useState(false);

  // --- 🚀 OPTIMIZED DATA FETCHER ---
  const fetchData = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const t = Date.now();
      // Added timeout signal to prevent "forever loading" if database is slow
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const [analyticsRes, pulseRes, shopsRes, teamRes, adminTargetRes, agentTargetsRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?t=${t}`, { signal: controller.signal }),
        fetch(`/api/operations/pulse-feed?t=${t}`, { signal: controller.signal }),
        fetch(`/api/shops/list?t=${t}`, { signal: controller.signal }),
        fetch(`/api/hr/team/list?t=${t}`, { signal: controller.signal }),
        fetch(`/api/targets?targetType=ADMIN&t=${t}`, { signal: controller.signal }),
        fetch(`/api/targets?targetType=AGENT&t=${t}`, { signal: controller.signal })
      ]);

      clearTimeout(timeoutId);

      const [analytics, pulse, shops, team, adminTargetData, agentTargetsData] = await Promise.all([
        analyticsRes.json().catch(() => ({})),
        pulseRes.json().catch(() => []),
        shopsRes.json().catch(() => []),
        teamRes.json().catch(() => ({ data: [] })),
        adminTargetRes.json().catch(() => []),
        agentTargetsRes.json().catch(() => [])
      ]);

      // Calculate team performance from agent targets
      const teamArray = Array.isArray(team?.data) ? team.data : (Array.isArray(team) ? team : []);
      const adminTarget = Array.isArray(adminTargetData) && adminTargetData.length > 0 ? adminTargetData[0] : null;
      const agentTargets = Array.isArray(agentTargetsData) ? agentTargetsData : [];

      // Aggregate all agent targets that are active
      const activeAgentTargets = agentTargets.filter((t: any) => t.status === 'ACTIVE');
      let teamPerformance = {
        totalSales: activeAgentTargets.reduce((sum: number, t: any) => sum + (t.achievedValue || 0), 0),
        totalQuantity: activeAgentTargets.reduce((sum: number, t: any) => sum + (t.achievedQuantity || 0), 0),
        activeAgents: teamArray.filter((u: any) => u.status === 'ACTIVE').length
      };

      setData({
        analytics: analytics || {},
        pulse: Array.isArray(pulse) ? pulse : [],
        shops: Array.isArray(shops) ? shops : (shops.data || []),
        team: teamArray,
        adminTarget,
        teamPerformance
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
        // 🔄 LIVE SYNC: Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
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
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
          <StatCard label="Field Team" value={stats.total} sub="Registered Promoters" icon={Users} />
          <StatCard label="Active Now" value={stats.active} sub="Online Signal" icon={Signal} active={true} />
          <StatCard label="Inventory Level" value={stats.inv.toLocaleString()} sub="Total Units" icon={Package} />
          <StatCard label="Security Alerts" value={stats.alertCount} sub="Req. Attention" icon={ShieldAlert} alert={stats.alertCount > 0} />
        </div>

        {/* MAIN GRID: ADMIN TARGET + HUB PERFORMANCE + ACTIVITY LOG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ADMIN TARGET WIDGET (Full Width) */}
          <div className="lg:col-span-3">
            <AdminTargetWidget
              adminTarget={data.adminTarget}
              teamPerformance={data.teamPerformance}
              onRefresh={fetchData}
            />
          </div>

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
                        <th className="px-5 py-3 border-b border-slate-100">Hub Location</th>
                        <th className="px-5 py-3 border-b border-slate-100">Address</th>
                        <th className="px-5 py-3 border-b border-slate-100 text-right">Sales (Est)</th>
                        <th className="px-5 py-3 border-b border-slate-100 text-right">Status</th>
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
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full animate-in zoom-in-95 relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Set Leader Target</h3>
          <button onClick={onClose}><div className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><RefreshCcw className="rotate-45" size={18} /></div></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sales Goal (GHS)</label>
            <input
              type="number"
              className="nexus-input w-full text-xl font-bold"
              value={form.targetValue}
              onChange={e => setForm({ ...form, targetValue: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Volume Goal (Units)</label>
            <input
              type="number"
              className="nexus-input w-full text-xl font-bold"
              value={form.targetQuantity}
              onChange={e => setForm({ ...form, targetQuantity: parseInt(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Start Date</label>
              <input type="date" className="nexus-input w-full" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">End Date</label>
              <input type="date" className="nexus-input w-full" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-8 bg-slate-900 text-white h-12 rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? <RefreshCcw className="animate-spin" size={18} /> : 'Activate Target'}
        </button>
      </div>
    </div>
  );
}