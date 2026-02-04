"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - INVENTORY COMMAND CENTER
 * VERSION: 25.5.0 (HUB AGGREGATION / VELOCITY TRACKING)
 * --------------------------------------------------------------------------
 * LOGIC:
 * 1. AGGREGATION: Fetches stock from all shops via the unified API.
 * 2. INTELLIGENCE: Calculates Sales Velocity & Dead Stock dynamically.
 * 3. FILTERING: 'Hub Selector' recalculates all KPIs instantly.
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import {
  Package, AlertTriangle, TrendingUp, Layers,
  Search, Activity, ArrowUpRight, Loader2, Building2,
  Zap, Turtle, ArrowDownRight, RefreshCw
} from "lucide-react";

export default function AdminInventoryPage() {
  // --- STATE ---
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // FILTERS
  const [selectedHub, setSelectedHub] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL"); // ALL | FAST | SLOW | LOW_STOCK

  // --- 1. LOAD DATA ENGINE ---
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Fetches Global Inventory with Hub Tags
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

  // --- 2. INTELLIGENCE ENGINE (CALCULATIONS) ---

  // A. Filter by Hub First (The Parent Filter)
  const hubFilteredData = selectedHub === "ALL"
    ? inventory
    : inventory.filter(item => item.hub === selectedHub);

  // B. Real-time KPI Calculation
  const totalStock = hubFilteredData.reduce((acc, item) => acc + (item.stock || 0), 0);
  const totalValue = hubFilteredData.reduce((acc, item) => acc + ((item.price || 0) * (item.stock || 0)), 0);
  const lowStockItems = hubFilteredData.filter(item => item.status === 'Low Stock');

  // C. Velocity Logic (80/20 Rule)
  // Sort by sales velocity (Highest to Lowest)
  const sortedBySales = [...hubFilteredData].sort((a, b) => (b.salesVelocity || 0) - (a.salesVelocity || 0));
  const topMovers = sortedBySales.slice(0, 5); // Top 5 best sellers
  // Dead Stock: Items with stock but 0 sales
  const slowMovers = hubFilteredData.filter(i => (i.salesVelocity === 0 || !i.salesVelocity) && i.stock > 0);

  // D. Final Table Data (Apply Search & Type Filter)
  const finalTableData = sortedBySales.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesType = true;
    if (filterType === "FAST") matchesType = item.salesVelocity > 0;
    if (filterType === "SLOW") matchesType = item.salesVelocity === 0;
    if (filterType === "LOW_STOCK") matchesType = item.status === "Low Stock";

    return matchesSearch && matchesType;
  });

  // Extract Unique Hubs for Dropdown
  const uniqueHubs = Array.from(new Set(inventory.map(i => i.hub))).filter(Boolean);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 bg-slate-50/50 min-h-screen">

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Inventory Matrix</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500" /> Live Stock Intelligence
          </p>
        </div>

        <div className="flex items-end gap-3">
          {/* REFRESH */}
          <button onClick={fetchInventory} className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* HUB SELECTOR */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Warehouse / Shop</label>
            <div className="relative">
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="h-12 pl-4 pr-10 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wide outline-none focus:border-blue-500 shadow-sm appearance-none min-w-[240px] text-slate-700 cursor-pointer hover:border-slate-300 transition-all"
              >
                <option value="ALL">Global Network (All Locations)</option>
                {uniqueHubs.map(hub => (
                  <option key={hub} value={hub}>{hub}</option>
                ))}
              </select>
              <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* INTELLIGENCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        {/* 1. FAST MOVERS */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top Performer</p>
              <h3 className="text-sm font-black text-slate-900 truncate w-32" title={topMovers[0]?.name}>
                {topMovers[0]?.name || "No Data"}
              </h3>
            </div>
          </div>
          <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1 uppercase tracking-wide bg-amber-50/50 w-fit px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" /> Highest Velocity
          </div>
        </div>

        {/* 2. DEAD STOCK */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
              <Turtle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stagnant Stock</p>
              <h3 className="text-2xl font-black text-slate-900">{slowMovers.length} <span className="text-xs text-slate-400">SKUs</span></h3>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wide bg-slate-50 w-fit px-2 py-1 rounded-lg">
            <ArrowDownRight className="w-3 h-3" /> Zero Movement
          </div>
        </div>

        {/* 3. VALUATION */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</p>
              <h3 className="text-xl font-black text-slate-900 truncate">₵ {totalValue.toLocaleString()}</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[75%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
          </div>
        </div>

        {/* 4. CRITICAL ALERTS */}
        <div className={`p-6 rounded-[2rem] border shadow-sm transition-all hover:shadow-md ${lowStockItems.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${lowStockItems.length > 0 ? 'bg-white text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${lowStockItems.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>Restock Needed</p>
              <h3 className={`text-2xl font-black ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{lowStockItems.length} <span className="text-xs opacity-60">Items</span></h3>
            </div>
          </div>
          <p className={`text-[10px] font-bold uppercase ${lowStockItems.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>Below Minimum Level</p>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">

        {/* TABLE HEADER */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              {selectedHub === "ALL" ? "Global Stock List" : `${selectedHub} Stock`}
            </h3>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            {/* TABS */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'FAST', label: 'Fast Moving' },
                { id: 'SLOW', label: 'Slow Moving' },
                { id: 'LOW_STOCK', label: 'Low Stock' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filterType === f.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH */}
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SKU or Name..."
              className="w-full md:w-72 h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-32 flex flex-col items-center justify-center text-slate-400 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Syncing Database...</p>
            </div>
          ) : finalTableData.length === 0 ? (
            <div className="p-32 text-center text-slate-400 flex flex-col items-center gap-4">
              <Package className="w-12 h-12 opacity-20" />
              <p className="font-bold text-sm">No inventory matches your filters.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Product Details</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Location</th>
                  <th className="px-6 py-5 text-right">Unit Price</th>
                  <th className="px-8 py-5 w-72">Stock Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {finalTableData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        {/* DYNAMIC ICON BASED ON VELOCITY */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${item.salesVelocity > 5 ? 'bg-amber-50 border-amber-100 text-amber-600' :
                            item.salesVelocity > 0 ? 'bg-blue-50 border-blue-100 text-blue-600' :
                              'bg-white border-slate-100 text-slate-300'
                          }`}>
                          {item.salesVelocity > 5 ? <Zap className="w-5 h-5" /> :
                            item.salesVelocity > 0 ? <Activity className="w-5 h-5" /> :
                              <Package className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">{item.name}</p>
                          <div className="flex gap-3 text-[10px] font-bold text-slate-400 mt-1">
                            <span className="uppercase tracking-wider">{item.sku || "NO SKU"}</span>
                            <span className="text-slate-300">|</span>
                            <span className={item.salesVelocity > 0 ? "text-emerald-600" : "text-slate-400"}>
                              {item.salesVelocity ? `${item.salesVelocity} Sold` : "No Sales"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                        {item.subCat}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {item.hub}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                      ₵ {(item.price || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-black ${item.status === 'Low Stock' ? 'text-red-600' : 'text-slate-700'}`}>
                          {item.stock} Available
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Min: {item.minStock || 5}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 shadow-sm ${item.stock <= (item.minStock || 5) ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                          style={{ width: `${Math.min(100, (item.stock / (item.minStock * 4 || 20)) * 100)}%` }}
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

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}