"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  TrendingUp, Users, Map as MapIcon, Loader2, ShieldCheck, 
  RefreshCw, Building2, Gavel, Wallet, ShieldAlert, UserCheck, 
  ShoppingBag, Package, ArrowRight 
} from "lucide-react";
import Link from "next/link";

// Existing Components
import PulseFeed from "@/components/dashboard/PulseFeed";
import SalesAnalysis from "@/components/dashboard/SalesAnalysis";

// Load Map Dynamically (No SSR)
const OperationsMap = dynamic(
  () => import("@/components/LiveMap"), 
  { 
    ssr: false, 
    loading: () => (
      <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-center">Loading Satellite Map...</span>
      </div>
    )
  }
);

export default function DashboardPage() {
  // 1. STATE
  const [stats, setStats] = useState({ 
    revenue: 0, activeStaff: 0, salesCount: 0, activeShops: 0, lowStockCount: 0 
  });
  
  const [shops, setShops] = useState<any[]>([]); 
  const [reps, setReps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. FETCH REAL DATA
  useEffect(() => {
    async function fetchData() {
      try {
        setIsSyncing(true);
        
        // A. Get Key Metrics
        const statsRes = await fetch("/api/dashboard/stats");
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats({
            revenue: data.revenue || 0,
            activeStaff: data.activeStaff || 0,
            salesCount: data.salesCount || 0,
            activeShops: data.leaderboard?.length || 0,
            lowStockCount: data.lowStockCount || 0
          });
        }

        // B. Get Shop Locations
        const shopsRes = await fetch("/api/shops");
        if (shopsRes.ok) {
          setShops(await shopsRes.json());
        }

        // C. Get Field Staff Locations
        const repsRes = await fetch("/api/users?role=sales_rep");
        if (repsRes.ok) {
          setReps(await repsRes.json());
        }

      } catch (e) {
        console.error("Dashboard Sync Error:", e);
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // 3. METRICS CONFIG
  const kpiCards = useMemo(() => [
    { 
      label: "Total Revenue", 
      value: `₵ ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
      icon: TrendingUp, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      trend: `+${stats.salesCount} Sales Today`, 
      sub: "Gross Earnings"
    },
    { 
      label: "Active Staff", 
      value: `${stats.activeStaff} Online`, 
      icon: Users, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      trend: "Live GPS",
      sub: "Field Agents Clocked In"
    },
    { 
      label: "Operational Shops", 
      value: `${shops.length} Locations`, 
      icon: MapIcon, 
      color: "text-purple-600", 
      bg: "bg-purple-50",
      trend: "Nationwide",
      sub: "Active Retail Points"
    }
  ], [stats, shops]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Operations Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-12">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-slate-200 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-xl shadow-lg shadow-slate-200">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase leading-none mb-1">Operations Dashboard</h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">LG Ghana • Command Center</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
               <Link href="/dashboard/shops" className="px-4 py-2 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Shops
               </Link>
               <Link href="/dashboard/inventory" className="px-4 py-2 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Package className="w-3.5 h-3.5 text-slate-400" /> Stock
               </Link>
               <Link href="/dashboard/hr/enrollment" className="px-4 py-2 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Staff
               </Link>
               <Link href="/dashboard/hr/disciplinary" className="px-4 py-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Gavel className="w-3.5 h-3.5" /> Conduct
               </Link>
            </div>

            {/* SYNC INDICATOR */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {isSyncing ? "Syncing..." : "Live"}
              </span>
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-500' : 'text-slate-300'}`} />
            </div>
          </div>
        </div>

        {/* --- METRICS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {kpiCards.map((card, i) => (
            <div key={i} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide ${card.trend.includes('+') ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                  {card.trend}
                </span>
              </div>
              <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</h3>
              <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{card.value}</p>
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide opacity-60">/ {card.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* --- MAIN WORKSPACE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[750px]">
          
          {/* LEFT: MAP & ALERTS (8 Cols) */}
          <div className="lg:col-span-8 space-y-8 flex flex-col">
            
            {/* MAP CONTAINER */}
            <div className="h-[520px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden relative shadow-sm group">
              <div className="absolute top-6 left-6 z-20 space-y-2 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full relative"></div>
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Field View</span>
                </div>
              </div>
              
              {/* MAP COMPONENT */}
              <OperationsMap shops={shops} reps={reps} />
            </div>

            {/* ACTION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* HR ALERTS */}
              <Link href="/dashboard/hr/disciplinary" className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:border-red-200 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-50 p-3 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 transition-colors" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Attention Needed</h4>
                <p className="text-xs font-bold text-slate-900">Check disciplinary reports & alerts.</p>
              </Link>

              {/* PAYROLL */}
              <Link href="/dashboard/hr/wages" className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Payroll</h4>
                <p className="text-xs font-bold text-slate-900">Review pending wages & bonuses.</p>
              </Link>

              {/* INVENTORY */}
              <Link href="/dashboard/inventory" className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:border-amber-200 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${stats.lowStockCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                    {stats.lowStockCount} Alerts
                  </span>
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Inventory</h4>
                <p className="text-xs font-bold text-slate-900">
                   {stats.lowStockCount > 0 ? "Critical stock levels detected." : "Stock levels are healthy."}
                </p>
              </Link>
            </div>
          </div>

          {/* RIGHT: CHARTS & FEED (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-[0.8] min-h-[300px]">
              <SalesAnalysis />
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-[400px]">
              <PulseFeed />
            </div>
          </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] border-t border-slate-200 pt-8 gap-4">
          <p>© 2026 Nexus Operations • LG Ghana</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> System Online
            </span>
            <span className="text-slate-300">|</span>
            <span>Secure Connection</span>
          </div>
        </div>

      </div>
    </div>
  );
}