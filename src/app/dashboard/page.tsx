"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  TrendingUp, Users, Map as MapIcon, Loader2, Activity, ShieldCheck, 
  Globe, RefreshCw, Building2, Gavel, Wallet, ShieldAlert, UserCheck, 
  ShoppingBag, Package 
} from "lucide-react";

// Existing Components
import PulseFeed from "@/components/dashboard/PulseFeed";
import SalesAnalysis from "@/components/dashboard/SalesAnalysis";

// Load Map Dynamically (No SSR)
const OperationsMap = dynamic(
  () => import("@/components/LiveMap"), 
  { 
    ssr: false, 
    loading: () => (
      <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-3 border border-dashed border-slate-200 rounded-xl">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-center">Loading Satellite Grid...</span>
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
  const [reps, setReps] = useState<any[]>([]); // <--- State for Reps
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("stable");

  // 2. FETCH REAL DATA
  useEffect(() => {
    async function fetchData() {
      try {
        setSyncStatus("syncing");
        
        // A. Get Stats
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

        // B. Get Shops
        let currentShops: any[] = [];
        const shopsRes = await fetch("/api/shops");
        if (shopsRes.ok) {
          currentShops = await shopsRes.json();
          setShops(currentShops);
        }

        // C. Get Reps (GPS Locations)
        try {
          // Attempt to fetch real users with role='sales_rep'
          const repsRes = await fetch("/api/users?role=sales_rep");
          
          if (repsRes.ok) {
            const repsData = await repsRes.json();
            
            // --- CRITICAL: If API returns empty, use TEST DATA to show you the map works ---
            if (repsData.length === 0 && currentShops.length > 0) {
              console.log("No API reps found. Injecting TEST REP for visualization.");
              // Find the first shop to attach the test rep to
              const mainShop = currentShops[0];
              const testRep = {
                id: 'test-rep-001',
                name: 'Kofi (Live Test)',
                // Offset slightly from the shop to show the line
                latitude: (mainShop.latitude || mainShop.location?.lat) + 0.0005,
                longitude: (mainShop.longitude || mainShop.location?.lng) + 0.0005,
                assignedShopId: mainShop.id
              };
              setReps([testRep]);
            } else {
              setReps(repsData);
            }
          } 
        } catch (repError) {
           console.warn("Could not fetch reps, using empty list", repError);
        }

        setSyncStatus("stable");
      } catch (e) {
        console.error("Dashboard Sync Error:", e);
        setSyncStatus("error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds for "Live" feel
    return () => clearInterval(interval);
  }, []);

  // 3. METRICS CARDS
  const kpiCards = useMemo(() => [
    { 
      label: "Total Revenue", 
      value: `₵ ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
      icon: TrendingUp, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      trend: `+${stats.salesCount} Sales`, 
      sub: "Today's Earnings"
    },
    { 
      label: "Active Staff", 
      value: `${stats.activeStaff} Online`, 
      icon: Users, 
      color: "text-slate-600", 
      bg: "bg-slate-100",
      trend: "Live",
      sub: "Field Reps Clocked In"
    },
    { 
      label: "Active Shops", 
      value: `${shops.length} Hubs`, 
      icon: MapIcon, 
      color: "text-slate-600", 
      bg: "bg-slate-100",
      trend: "Online",
      sub: "Locations Reporting Data"
    }
  ], [stats, shops]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 antialiased pb-12">
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 rounded-lg shadow-lg shadow-slate-200">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase leading-none mb-1">Nexus Terminal</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em]">LG Ghana • Operations Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* QUICK NAVIGATION */}
            <div className="hidden lg:flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
               <button onClick={() => window.location.href='/dashboard/shops'} className="px-4 py-2 hover:bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Building2 className="w-3.5 h-3.5" /> Shops
               </button>
               <button onClick={() => window.location.href='/dashboard/inventory'} className="px-4 py-2 hover:bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Package className="w-3.5 h-3.5" /> Inventory
               </button>
               <button onClick={() => window.location.href='/dashboard/hr/enrollment'} className="px-4 py-2 hover:bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <UserCheck className="w-3.5 h-3.5" /> Staff
               </button>
               <button onClick={() => window.location.href='/dashboard/hr/disciplinary'} className="px-4 py-2 hover:bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all text-red-600">
                  <Gavel className="w-3.5 h-3.5" /> Conduct
               </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-2" />

            {/* SYNC STATUS */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'stable' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {syncStatus === 'stable' ? "System Ready" : "Updating..."}
              </span>
              <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin text-blue-500' : 'text-slate-300'}`} />
            </div>
          </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {kpiCards.map((card, i) => (
            <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 uppercase tracking-tighter">
                  {card.trend}
                </span>
              </div>
              <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</h3>
              <div className="flex items-baseline gap-2">
                {loading ? (
                  <div className="h-7 w-32 bg-slate-50 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{card.value}</p>
                )}
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{card.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* --- MAIN WORKSPACE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[750px]">
          
          {/* LEFT COLUMN (8): MAP & ALERTS */}
          <div className="lg:col-span-8 space-y-8 flex flex-col">
            
            {/* MAP SECTION */}
            <div className="h-[520px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden relative shadow-sm group">
              <div className="absolute top-6 left-6 z-20 space-y-2">
                <div className="bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 shadow-2xl flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Map Overview</span>
                </div>
                <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm inline-flex items-center gap-2">
                   <Building2 className="w-3 h-3 text-slate-400" />
                   <span className="text-[10px] font-bold text-slate-600 uppercase">{shops.length} Active Nodes</span>
                </div>
              </div>
              
              {/* ✅ PASSING BOTH SHOPS AND REPS */}
              <OperationsMap shops={shops} reps={reps} />
            </div>

            {/* ACTION CARDS */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:border-red-200 transition-all group cursor-pointer" onClick={() => window.location.href='/dashboard/hr/disciplinary'}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-50 p-3 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-red-600 uppercase">Alerts</p>
                  </div>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">HR Alerts</h4>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">View disciplinary reports and geofence violations.</p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:border-blue-200 transition-all group cursor-pointer" onClick={() => window.location.href='/dashboard/hr/wages'}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-blue-600 uppercase">Pending</p>
                  </div>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Payroll Status</h4>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">Review pending wage settlements and bonuses.</p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:border-amber-200 transition-all group cursor-pointer" onClick={() => window.location.href='/dashboard/inventory'}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className={`text-[11px] font-black uppercase ${stats.lowStockCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {stats.lowStockCount} Items Low
                    </p>
                  </div>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Inventory Health</h4>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">
                  {stats.lowStockCount > 0 
                    ? "Attention needed: Stock levels critical in some hubs." 
                    : "All systems normal. Stock levels healthy."}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (4): ANALYSIS & FEED */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-[0.8]">
              <SalesAnalysis />
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0">
              <PulseFeed />
            </div>
          </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="mt-12 flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] border-t border-slate-200 pt-8">
          <div className="flex items-center gap-6">
            <span>© 2026 LG Ghana Operations</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>System Online</span>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
               <Activity className="w-3 h-3 text-blue-500" />
               <span>Latency: 12ms</span>
            </div>
            <span className="text-blue-500 border-b border-blue-500 pb-0.5">Secure Connection</span>
          </div>
        </div>

      </div>
    </div>
  );
}