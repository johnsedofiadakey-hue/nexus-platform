"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, AlertTriangle, TrendingUp, Layers, 
  Search, Activity, ArrowUpRight, Loader2, Building2,
  Zap, Turtle, ArrowDownRight
} from "lucide-react";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // FILTERS
  const [selectedHub, setSelectedHub] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL"); // ALL | FAST | SLOW | LOW_STOCK

  // --- 1. LOAD DATA ---
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory?t=${Date.now()}`);
      if (res.ok) {
        setInventory(await res.json());
      }
    } catch (error) {
      console.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FILTERING LOGIC ---
  
  // A. Filter by Hub First
  const hubFilteredData = selectedHub === "ALL" 
    ? inventory 
    : inventory.filter(item => item.hub === selectedHub);

  // B. Analytics on the Hub-Filtered Data
  const totalStock = hubFilteredData.reduce((acc, item) => acc + (item.stock || 0), 0);
  const totalValue = hubFilteredData.reduce((acc, item) => acc + ((item.price || 0) * (item.stock || 0)), 0);
  const lowStockItems = hubFilteredData.filter(item => item.status === 'Low Stock');
  
  // C. Velocity Calculation (Simple 80/20 Rule Logic)
  // Sort by sales velocity desc
  const sortedBySales = [...hubFilteredData].sort((a, b) => b.salesVelocity - a.salesVelocity);
  const topMovers = sortedBySales.slice(0, 5); // Top 5 items
  const slowMovers = hubFilteredData.filter(i => i.salesVelocity === 0 && i.stock > 0); // No sales but has stock

  // D. Final Table Data (Apply Type Filter & Search)
  const finalTableData = sortedBySales.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesType = true;
    if (filterType === "FAST") matchesType = item.salesVelocity > 0;
    if (filterType === "SLOW") matchesType = item.salesVelocity === 0;
    if (filterType === "LOW_STOCK") matchesType = item.status === "Low Stock";

    return matchesSearch && matchesType;
  });

  // Unique Hubs for Dropdown
  const uniqueHubs = Array.from(new Set(inventory.map(i => i.hub)));

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* HEADER & SHOP SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Inventory Analytics</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">
            Performance Analysis & Stock Health
          </p>
        </div>
        
        {/* SHOP FILTER DROPDOWN */}
        <div className="flex flex-col gap-2">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter By Hub</label>
           <div className="relative">
             <select 
               value={selectedHub}
               onChange={(e) => setSelectedHub(e.target.value)}
               className="h-12 pl-4 pr-10 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500 shadow-sm appearance-none min-w-[200px]"
             >
               <option value="ALL">Global Network (All Shops)</option>
               {uniqueHubs.map(hub => (
                 <option key={hub} value={hub}>{hub}</option>
               ))}
             </select>
             <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>
        </div>
      </div>

      {/* ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* 1. FAST MOVERS (High Velocity) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Performer</p>
              <h3 className="text-lg font-black text-slate-900 truncate w-32">
                {topMovers[0]?.name || "N/A"}
              </h3>
            </div>
          </div>
          <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1 uppercase tracking-wide">
             <ArrowUpRight className="w-3 h-3" /> Highest Sales Velocity
          </div>
        </div>

        {/* 2. SLOW MOVERS (Dead Stock) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500">
              <Turtle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stagnant Items</p>
              <h3 className="text-2xl font-black text-slate-900">{slowMovers.length} SKUs</h3>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
             <ArrowDownRight className="w-3 h-3" /> Zero Sales Recorded
          </div>
        </div>

        {/* 3. TOTAL VALUATION */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Value</p>
              <h3 className="text-2xl font-black text-slate-900">₵ {totalValue.toLocaleString()}</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[75%] rounded-full" />
          </div>
        </div>

        {/* 4. ALERTS */}
        <div className={`p-6 rounded-[2rem] border shadow-sm ${lowStockItems.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${lowStockItems.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>Restock Needed</p>
              <h3 className={`text-2xl font-black ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{lowStockItems.length} Items</h3>
            </div>
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase">Below Minimum Level</p>
        </div>
      </div>

      {/* INTELLIGENCE TABLE */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        
        {/* TABLE CONTROLS */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> 
              {selectedHub === "ALL" ? "Global Stock List" : `${selectedHub} Stock`}
            </h3>
            <div className="h-6 w-px bg-slate-200 hidden md:block" />
            
            {/* SMART FILTERS */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
               {[
                 { id: 'ALL', label: 'All Items' },
                 { id: 'FAST', label: 'Fast Moving' },
                 { id: 'SLOW', label: 'Slow Moving' },
                 { id: 'LOW_STOCK', label: 'Low Stock' }
               ].map(f => (
                 <button 
                   key={f.id}
                   onClick={() => setFilterType(f.id)} 
                   className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                     filterType === f.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                   }`}
                 >
                   {f.label}
                 </button>
               ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SKU, Product..." 
              className="w-full md:w-64 h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
               <p className="text-[10px] font-bold uppercase tracking-widest">Analyzing Data...</p>
             </div>
          ) : finalTableData.length === 0 ? (
             <div className="p-20 text-center text-slate-400">
               <p className="font-bold">No data found matching criteria.</p>
             </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-6">Product Performance</th>
                  <th className="px-6 py-6">Category</th>
                  <th className="px-6 py-6">Location</th>
                  <th className="px-6 py-6 text-right">Valuation</th>
                  <th className="px-8 py-6 w-64">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {finalTableData.map((item) => (
                  <tr key={item.dbId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        {/* VELOCITY BADGE */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          item.salesVelocity > 5 ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                          item.salesVelocity > 0 ? 'bg-blue-50 border-blue-100 text-blue-600' :
                          'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                           {item.salesVelocity > 5 ? <Zap className="w-5 h-5" /> : 
                            item.salesVelocity > 0 ? <Activity className="w-5 h-5" /> : 
                            <Turtle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 flex gap-2">
                            <span>{item.id}</span>
                            <span className="text-slate-300">|</span>
                            <span className={item.salesVelocity > 0 ? "text-emerald-500" : "text-slate-400"}>
                              {item.salesVelocity} Sold (All Time)
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                         {item.subCat}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-600">
                      {item.hub}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-700">
                       ₵ {(item.price || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-black ${item.status === 'Low Stock' ? 'text-red-600' : 'text-slate-900'}`}>
                            {item.stock} Units
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">Min: {item.minStock || 5}</span>
                       </div>
                       <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              item.stock <= (item.minStock || 5) ? 'bg-red-500' : 'bg-emerald-500'
                            }`} 
                            style={{ width: `${Math.min(100, (item.stock / 100) * 100)}%` }} 
                          />
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}