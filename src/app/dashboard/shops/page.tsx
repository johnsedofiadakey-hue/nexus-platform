"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, Plus, MapPin, Radio, Package, Users, 
  TrendingUp, Search, X, Loader2, Globe, ShieldCheck,
  ChevronRight, ArrowRight, Settings
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the Global Map to prevent SSR errors
const GlobalGridMap = dynamic(
  () => import("@/components/admin/GlobalGridMap"),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 animate-pulse rounded-3xl" /> }
);

export default function ShopManagementPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<any[]>([]);

  // Mock initial state for LG Ghana Nodes
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    latitude: "",
    longitude: "",
    radius: "150"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Logic to POST to /api/shops
    setTimeout(() => {
      setLoading(false);
      setShowAddModal(false);
      // In a real app, refresh list here
    }, 1500);
  };

  return (
    <div className="p-8 max-w-[1700px] mx-auto animate-in fade-in duration-700">
      
      {/* --- STRATEGIC HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Retail Hub Authority</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Node Registry & Geofence Configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all"
          >
            <Plus className="w-4 h-4" /> Initialize New Hub
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* --- LEFT: THE HQ GLOBAL GRID MAP (THE BIG VIEW) --- */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm h-[600px] relative group">
            <div className="absolute top-6 left-6 z-20 space-y-2">
               <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-2xl">
                  <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Grid Telemetry</span>
               </div>
            </div>
            <GlobalGridMap />
          </div>

          {/* GRID SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Radio className="w-5 h-5" /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Nodes</p>
                   <p className="text-xl font-black text-slate-900">24 Active</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Geofence Status</p>
                   <p className="text-xl font-black text-slate-900 uppercase">Secured</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl text-white"><Package className="w-5 h-5" /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Linked SKUs</p>
                   <p className="text-xl font-black text-slate-900">1,204 Total</p>
                </div>
             </div>
          </div>
        </div>

        {/* --- RIGHT: HUB LEDGER (LIST) --- */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col flex-1 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Hub Ledger</h3>
                <Search className="w-4 h-4 text-slate-300" />
             </div>
             <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {[
                  { name: "Melcom - Accra Mall", loc: "Tetteh Quarshie", reps: 4, revenue: "142k" },
                  { name: "Game - Kumasi Mall", loc: "Asokwa, Kumasi", reps: 3, revenue: "98k" },
                  { name: "Palace - Labone", loc: "Labone, Accra", reps: 2, revenue: "65k" },
                  { name: "Melcom - Spintex", loc: "Spintex Road", reps: 5, revenue: "210k" },
                ].map((shop, i) => (
                  <div key={i} className="p-6 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between">
                       <div className="flex items-start gap-4">
                          <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="text-[12px] font-black text-slate-900 tracking-tight">{shop.name}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{shop.loc}</p>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-600 transition-all" />
                    </div>
                    <div className="mt-4 flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-600">{shop.reps} Reps</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-900">GHS {shop.revenue}</span>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

      </div>

      {/* --- ADD HUB MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Initialize Retail Hub</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Register new node to the LG Ghana Grid</p>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200">
                  <X className="w-6 h-6 text-slate-400" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hub Name (e.g. Melcom - West Hills)</label>
                  <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold focus:border-blue-600 outline-none transition-all" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Address / Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 text-sm font-bold focus:border-blue-600 outline-none" />
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude</label>
                     <input required placeholder="5.6225" className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold tabular-nums outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude</label>
                     <input required placeholder="-0.1730" className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold tabular-nums outline-none" />
                  </div>
               </div>

               <div className="flex items-center gap-4 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                  <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block">Geofence Radius (Meters)</label>
                    <input type="range" min="50" max="500" defaultValue="150" className="w-full mt-2 accent-blue-600" />
                  </div>
                  <span className="text-sm font-black text-blue-600 tabular-nums">150m</span>
               </div>

               <div className="pt-6">
                  <button 
                    disabled={loading}
                    className="w-full bg-slate-900 h-16 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 hover:bg-black transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Commit Node to Global Grid <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}