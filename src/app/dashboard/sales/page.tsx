"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - LIVE SALES COMMAND CENTER
 * VERSION: 25.0.0 (VOLUME-FIRST / LIVE FEED)
 * --------------------------------------------------------------------------
 * LOGIC:
 * 1. REAL-TIME: Polls /api/sales every 5s to capture Mobile POS activity.
 * 2. METRICS: Calculates 'Volume' (Sum of quantities) as the primary KPI.
 * 3. FEED: Displays transactions in a timeline format.
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, ShoppingCart, Users, TrendingUp, 
  MapPin, Clock, Search, Filter, ArrowUpRight, 
  Package, Loader2, RefreshCw, Zap, Building2
} from "lucide-react";

export default function AdminSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHub, setSelectedHub] = useState("ALL");

  // --- 1. LIVE SYNC ENGINE ---
  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, 5000); // 5s Heartbeat
    return () => clearInterval(interval);
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch(`/api/sales?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
      }
    } catch (error) {
      console.error("Sales Sync Error");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. ANALYTICS ENGINE ---
  
  // A. Filter Data
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Hub Filter
      if (selectedHub !== "ALL" && sale.shop?.name !== selectedHub) return false;
      
      // Search Filter (Agent Name or Receipt ID)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesAgent = sale.user?.name?.toLowerCase().includes(searchLower);
        const matchesId = sale.id.toLowerCase().includes(searchLower);
        return matchesAgent || matchesId;
      }
      
      return true;
    });
  }, [sales, selectedHub, searchTerm]);

  // B. Calculate Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    // Calculate Total Volume (Sum of all item quantities)
    const totalVolume = filteredSales.reduce((acc, s) => {
      const saleQty = s.items?.reduce((q: number, i: any) => q + i.quantity, 0) || 0;
      return acc + saleQty;
    }, 0);
    
    // Unique Agents Active
    const uniqueAgents = new Set(filteredSales.map(s => s.userId)).size;

    return { totalRevenue, totalVolume, uniqueAgents, count: filteredSales.length };
  }, [filteredSales]);

  // C. Unique Hubs for Dropdown
  const uniqueHubs = Array.from(new Set(sales.map(s => s.shop?.name))).filter(Boolean);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Live Sales Feed</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Real-Time Transaction Stream
          </p>
        </div>

        <div className="flex items-end gap-3">
           <button onClick={fetchSales} className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm active:scale-95 transition-all">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </button>

           <div className="flex flex-col gap-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter Stream</label>
             <div className="relative">
               <select 
                 value={selectedHub}
                 onChange={(e) => setSelectedHub(e.target.value)}
                 className="h-12 pl-4 pr-10 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wide outline-none focus:border-blue-500 shadow-sm min-w-[200px]"
               >
                 <option value="ALL">Global Network</option>
                 {uniqueHubs.map((hub: any) => <option key={hub} value={hub}>{hub}</option>)}
               </select>
               <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             </div>
           </div>
        </div>
      </div>

      {/* 📊 VOLUME METRICS (BIG & BOLD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* 1. TOTAL VOLUME (The Main KPI) */}
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-4 mb-2 relative z-10">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Volume</p>
          </div>
          <h3 className="text-4xl font-black tracking-tight relative z-10">{metrics.totalVolume} <span className="text-lg text-slate-500 font-bold">Units</span></h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
             <ArrowUpRight className="w-3 h-3" /> Moving Fast
          </div>
        </div>

        {/* 2. TRANSACTIONS */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</p>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{metrics.count} <span className="text-sm text-slate-300">Sales</span></h3>
        </div>

        {/* 3. ACTIVE AGENTS */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Staff</p>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{metrics.uniqueAgents} <span className="text-sm text-slate-300">Online</span></h3>
        </div>

        {/* 4. REVENUE (Secondary) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">₵ {metrics.totalRevenue.toLocaleString()}</h3>
        </div>
      </div>

      {/* 📡 THE LIVE FEED */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
             <Activity className="w-5 h-5 text-blue-600" /> Activity Stream
           </h3>
           
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               placeholder="Search Agent..." 
               className="h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
             />
           </div>
        </div>

        <div className="divide-y divide-slate-100">
           {loading ? (
             <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
               <p className="text-[10px] font-bold uppercase tracking-widest">Connecting to Terminals...</p>
             </div>
           ) : filteredSales.length === 0 ? (
             <div className="p-20 text-center text-slate-400">
               <p className="font-bold text-sm">No recent activity.</p>
             </div>
           ) : (
             filteredSales.map((sale) => (
               <div key={sale.id} className="p-6 hover:bg-slate-50 transition-colors group">
                 <div className="flex justify-between items-start">
                   
                   {/* LEFT: AGENT & LOCATION */}
                   <div className="flex gap-4">
                     <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg border-2 border-white shadow-sm">
                       {sale.user?.name?.charAt(0) || "U"}
                     </div>
                     <div>
                       <div className="flex items-center gap-2">
                         <h4 className="font-black text-sm text-slate-900">{sale.user?.name || "Unknown Agent"}</h4>
                         <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">
                           {sale.source}
                         </span>
                       </div>
                       <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mt-1">
                         <span className="flex items-center gap-1">
                           <MapPin className="w-3 h-3 text-slate-400" /> {sale.shop?.name || "Global Roaming"}
                         </span>
                         <span className="flex items-center gap-1 text-slate-400">
                           <Clock className="w-3 h-3" /> {new Date(sale.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                         </span>
                       </div>
                     </div>
                   </div>

                   {/* RIGHT: TOTAL */}
                   <div className="text-right">
                     <p className="text-lg font-black text-slate-900">₵ {sale.totalAmount.toLocaleString()}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       Ref: #{sale.id.slice(-6).toUpperCase()}
                     </p>
                   </div>
                 </div>

                 {/* ITEMS LIST (THE "WHAT") */}
                 <div className="mt-4 ml-16 bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sale.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                         <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-500">
                           x{item.quantity}
                         </span>
                         <span className="truncate flex-1">{item.product?.productName || "Unknown Item"}</span>
                      </div>
                    ))}
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}