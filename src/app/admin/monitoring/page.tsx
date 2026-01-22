"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, ShieldAlert, MapPin, Activity, 
  ArrowLeft, Loader2, RefreshCw, Satellite
} from "lucide-react";

/**
 * --------------------------------------------------------------------------
 * NEXUS COMMAND - GEOSPATIAL MONITORING
 * --------------------------------------------------------------------------
 */

export default function StaffMonitoring() {
  const router = useRouter();
  const [data, setData] = useState<{ staff: any[], ghosts: any[] }>({ staff: [], ghosts: [] });
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());

  // 1. SYNC LIVE GEOSPATIAL DATA
  const syncPulse = async () => {
    try {
      const res = await fetch('/api/operations/pulse?t=' + Date.now());
      if (res.ok) {
        const pulse = await res.json();
        setData({
          staff: pulse.staff || [],
          ghosts: pulse.ghosts || []
        });
        setLastSync(new Date());
      }
    } catch (e) {
      console.error("Geospatial Sync Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncPulse();
    const interval = setInterval(syncPulse, 10000); // 10s Live Heartbeat
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      
      {/* 🏗️ NAVIGATION & STATUS */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-6">
           <button onClick={() => router.push('/admin')} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all">
             <ArrowLeft className="w-5 h-5 text-slate-400" />
           </button>
           <div>
             <h1 className="text-3xl font-black text-white tracking-tighter">Sentinel View</h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                <Satellite className="w-3 h-3" /> Live Satellite Operations
             </p>
           </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-2xl">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
             Last Sync: {lastSync.toLocaleTimeString()}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 h-[75vh]">
        
        {/* 🗺️ THE CORE MAP (Placeholder for Leaflet/Google Maps) */}
        <div className="col-span-12 lg:col-span-9 bg-slate-900 rounded-[3rem] border border-slate-800 relative overflow-hidden flex items-center justify-center group shadow-2xl">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
           
           {/* RENDER ACTIVE STAFF PINGS */}
           {data.staff.map((rep) => (
             <div 
               key={rep.id} 
               className="absolute transition-all duration-1000"
               style={{ top: '45%', left: '50%' }} // You would map real Lat/Lng to % here
             >
                <div className="flex flex-col items-center group/ping">
                   <div className="bg-blue-600 text-[8px] font-black px-2 py-1 rounded-md mb-2 text-white shadow-lg opacity-0 group-hover/ping:opacity-100 transition-opacity">
                      {rep.name}
                   </div>
                   <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25" />
                      <MapPin className="w-8 h-8 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                   </div>
                </div>
             </div>
           ))}

           {/* MAP OVERLAYS */}
           <div className="absolute top-8 left-8 space-y-4">
              <div className="bg-slate-950/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-xl min-w-[200px]">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                       <Users size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase">Field Strength</p>
                       <p className="text-xl font-black text-white">{data.staff.length} Active</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                       <ShieldAlert size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase">Ghost Alerts</p>
                       <p className="text-xl font-black text-white">{data.ghosts.length}</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <p className="text-[10px] font-black uppercase tracking-[1em] text-slate-800">Geospatial Grid Locked</p>
        </div>

        {/* 📋 SENTINEL STATUS LOG */}
        <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
           <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Sentinel Pulse
           </h3>
           
           {data.staff.map((rep) => (
             <div key={rep.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl hover:border-blue-500/30 transition-all group">
                <div className="flex justify-between items-start mb-3">
                   <p className="text-xs font-black text-white">{rep.name}</p>
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                      <span>Status</span>
                      <span className="text-blue-400">Live Ping</span>
                   </div>
                   <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                      <span>Location</span>
                      <span className="text-white truncate max-w-[100px]">{rep.shop?.name || "Roaming"}</span>
                   </div>
                </div>
             </div>
           ))}

           {data.staff.length === 0 && (
             <div className="py-20 text-center opacity-30">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-xs font-black uppercase">Scanning Nodes...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}