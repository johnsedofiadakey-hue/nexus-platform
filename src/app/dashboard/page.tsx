"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  TrendingUp, Users, Package, AlertTriangle, 
  Map as MapIcon, RefreshCw, Zap, Loader2, CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

// 🛰️ DESKTOP-OPTIMIZED SATELLITE ENGINE
const GlobalMap = dynamic(() => import('@/components/maps/LiveMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 rounded-[3rem]">
      <Loader2 className="w-6 h-6 animate-spin mb-3" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Satellite Feed...</p>
    </div>
  )
});

// --- SUB-COMPONENT: HIGH-DENSITY METRIC ---
const MetricCard = ({ title, value, status, icon: Icon, theme }: any) => {
  const themes: any = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${themes[theme]}`}>
              <Icon size={24} strokeWidth={2.5} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
          <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{value}</h2>
              {status && (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter ${status.includes('+') || status === 'Stable' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {status}
                </span>
              )}
          </div>
      </div>
  );
};

export default function OperationsHub() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      const [analytics, pulse, shopList, teamList] = await Promise.all([
        fetch(`/api/analytics/dashboard?t=${timestamp}`).then(res => res.json()),
        fetch(`/api/operations/pulse-feed?t=${timestamp}`).then(res => res.json()),
        fetch(`/api/shops/list?t=${timestamp}`).then(res => res.json()),
        fetch(`/api/hr/team/list?t=${timestamp}`).then(res => res.json())
      ]);

      setMetrics(analytics);
      setFeed(Array.isArray(pulse) ? pulse : []);
      setShops(Array.isArray(shopList) ? shopList : (shopList.data || []));
      setTeam(Array.isArray(teamList) ? teamList : (teamList.data || []));
    } catch (error) {
      console.error("Dashboard Link Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Establishing Command Hub</p>
    </div>
  );

  return (
    <div className="p-10 max-w-[1750px] mx-auto animate-in fade-in duration-700 space-y-10">
      
      {/* --- HEADER --- */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Operations Hub</h1>
          {/* ✅ FIXED: Changed <p> to <div> to allow nesting */}
          <div className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] mt-6 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" /> 
            Global Authority System Active
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => fetchData()} className="h-16 px-8 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all">
            <RefreshCw size={18} /> Update Telemetry
          </button>
          <div className="h-16 px-8 bg-slate-900 text-white rounded-2xl flex items-center gap-5 shadow-2xl">
            <Zap size={18} className="text-blue-400 fill-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Secure</span>
          </div>
        </div>
      </header>

      {/* --- TOP ROW: CORE STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <MetricCard title="Revenue Flow" value={`₵ ${metrics?.revenue?.toLocaleString() || '0'}`} status="+14.2%" icon={TrendingUp} theme="blue" />
        <MetricCard title="Active Team" value={`${metrics?.activeStaff || 0} Agents`} status="Stable" icon={Users} theme="emerald" />
        <MetricCard title="Inventory Value" value={`₵ ${((metrics?.inventoryValue || 0) / 1000000).toFixed(2)}M`} status="Verified" icon={Package} theme="purple" />
        <MetricCard title="Security Flags" value={feed.filter(f => f.type === 'GHOST_ALERT').length} status="Critical" icon={AlertTriangle} theme="rose" />
      </div>

      {/* --- MIDDLE ROW: MAP & PERFORMANCE SIDE-BY-SIDE --- */}
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-8 bg-white p-3 rounded-[3.5rem] border border-slate-200 shadow-sm relative h-[600px] overflow-hidden">
          <GlobalMap shops={shops} reps={team} mapType="GLOBAL" />
          <div className="absolute bottom-10 left-10 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><MapIcon size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Terminal Registry</p>
              <p className="text-lg font-black text-slate-900 mt-1 uppercase tracking-tighter">{shops.length} Active Hubs</p>
            </div>
          </div>
        </div>

        <div className="col-span-4 bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm flex flex-col h-[600px]">
          <h3 className="text-2xl font-black text-slate-900 mb-10 uppercase tracking-tighter px-1">Hub Efficiency</h3>
          <div className="flex-1 space-y-10 overflow-y-auto pr-4 custom-scrollbar">
            {metrics?.shopPerformance?.length > 0 ? (
                metrics.shopPerformance.map((hub: any, i: number) => (
                <div key={i} className="group">
                    <div className="flex justify-between items-end mb-4 px-1">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{hub.name}</span>
                    <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl uppercase">₵{hub.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                    <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                            width: `${(hub.revenue / (metrics?.shopPerformance[0]?.revenue || 1)) * 100}%`,
                            background: i === 0 ? 'linear-gradient(90deg, #1d4ed8, #3b82f6)' : '#cbd5e1'
                        }} 
                    />
                    </div>
                </div>
                ))
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-60">
                    <TrendingUp size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Performance Data</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: CHART & ALERTS --- */}
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-7 bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Sales Velocity</h3>
            <div className="flex items-center gap-3 bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Network Growth</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.chartData || []}>
                <defs>
                  <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={20} />
                <YAxis hide />
                <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'}}
                    labelStyle={{color: '#94a3b8', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase'}}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={5} fill="url(#vGrad)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-5 bg-rose-50/30 rounded-[3.5rem] p-12 border border-rose-100 flex flex-col h-[525px]">
          <h3 className="text-2xl font-black text-rose-900 mb-10 flex items-center gap-4 uppercase tracking-tighter">
            <AlertTriangle className="animate-pulse text-rose-600" size={26} /> Security Logs
          </h3>
          <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-2">
            {feed.filter(f => f.type === 'GHOST_ALERT').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-rose-300 gap-8 opacity-40">
                <CheckCircle2 size={72} strokeWidth={1} />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Protocol Clear</p>
              </div>
            ) : (
              feed.filter(f => f.type === 'GHOST_ALERT').map((alert: any) => (
                <div key={alert.id} className="bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm flex justify-between items-center group hover:bg-rose-600 transition-all duration-500">
                    <div className="flex-1">
                        <p className="font-black text-base text-slate-900 uppercase group-hover:text-white transition-colors">{alert.user}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-rose-100 transition-colors mt-2">{alert.shop} • {alert.message}</p>
                    </div>
                    <button className="bg-rose-600 text-white group-hover:bg-white group-hover:text-rose-600 px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">
                        Intervene
                    </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}