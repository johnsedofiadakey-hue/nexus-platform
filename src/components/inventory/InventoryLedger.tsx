"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, Search, Filter, ArrowRightLeft, ChevronRight, Loader2, AlertTriangle
} from "lucide-react";

export default function InventoryLedger() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH REAL DATA ---
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FILTERING LOGIC ---
  const filteredItems = items.filter(item => {
    const matchesCategory = filter === "All" || 
      (filter === "Raw" && item.cat === "Raw Material") ||
      (filter === "Finished" && item.cat === "Finished Good");
    
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.id.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full animate-in fade-in duration-500">
      
      {/* TOOLBAR */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Material Ledger</h2>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex gap-1">
            {['All', 'Raw', 'Finished'].map((t) => (
              <button 
                key={t} 
                onClick={() => setFilter(t)}
                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded transition-colors ${
                  filter === t ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH SKU / ITEM..."
              className="bg-white border border-slate-200 rounded-md pl-8 pr-4 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-blue-500 transition-colors w-48"
            />
          </div>
          <button onClick={fetchInventory} className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-500">
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TABLE HEADERS */}
      <div className="grid grid-cols-12 px-6 py-2.5 bg-slate-50 border-b border-slate-100">
        <span className="col-span-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</span>
        <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Formulation</span>
        <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Hub Node</span>
        <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Inventory</span>
        <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Control</span>
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Syncing Stock...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Package className="w-10 h-10 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest">No Items Found</span>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/80 transition-colors group cursor-default">
              
              {/* ITEM INFO */}
              <div className="col-span-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm ${item.status === 'Low Stock' ? 'border-amber-200 text-amber-500' : ''}`}>
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-900 truncate tracking-tight">{item.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.id}</span>
                </div>
              </div>

              {/* FORMULATION CATEGORY */}
              <div className="col-span-2 flex justify-center">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                  item.cat === 'Raw Material' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {item.cat}
                </span>
              </div>

              {/* HUB LOCATION */}
              <div className="col-span-2 text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.hub}</span>
              </div>

              {/* QUANTITY */}
              <div className="col-span-2 text-right flex flex-col items-end">
                <span className={`text-[12px] font-black tabular-nums ${item.status === 'Low Stock' ? 'text-amber-600' : 'text-slate-900'}`}>
                  {item.stock}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{item.unit}</span>
              </div>

              {/* ACTIONS */}
              <div className="col-span-2 flex justify-end gap-2">
                <button className="p-1.5 hover:bg-white hover:border-slate-200 border border-transparent rounded transition-all text-slate-400 hover:text-blue-600">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 hover:bg-white hover:border-slate-200 border border-transparent rounded transition-all text-slate-400 hover:text-slate-900">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* LEDGER FOOTER STATS */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {items.filter(i => i.status === "Low Stock").length} Low Stock Alerts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {items.length} Total SKUs
            </span>
          </div>
        </div>
        <button className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-b-2 border-slate-900">
          Open Full Stock Analysis
        </button>
      </div>
    </div>
  );
}