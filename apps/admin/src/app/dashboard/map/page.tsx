"use client";

import React, { useState, useEffect } from 'react';
import {
   Map as MapIcon, Navigation, Crosshair,
   Shield, User, Wifi, Battery, Search, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SentinelMapPage() {
   const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
   const [units, setUnits] = useState<any[]>([]);
   const [stats, setStats] = useState({ onlineAgents: 0, totalSales: 0, activeShops: 0 });
   const [loading, setLoading] = useState(true);

   const fetchData = async () => {
      try {
         const res = await fetch('/api/dashboard/stats');
         if (res.ok) {
            const data = await res.json();
            setUnits(data.agents || []);
            setStats(data.stats || { onlineAgents: 0, totalSales: 0, activeShops: 0 });
         }
      } catch (e) {
         toast.error("Live feed disconnected");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Poll every 30s (reduced from 10s)
      return () => clearInterval(interval);
   }, []);

   return (
      <div className="h-[calc(100vh-80px)] p-4 xl:p-6 flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 text-slate-900">

         {/* SIDEBAR: UNIT LIST */}
         <div className="w-full md:w-96 flex flex-col gap-4">
            {/* Search Header */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                     <Crosshair className="text-red-500 animate-pulse" /> SENTINEL
                  </h2>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                     {loading && <RefreshCw className="w-3 h-3 animate-spin" />} Live Feed
                  </span>
               </div>
               <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Locate Promoter ID..." className="w-full bg-slate-50 rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
               </div>

               {/* Quick Stats Row */}
               <div className="flex justify-between mt-4 px-2">
                  <div className="text-center">
                     <p className="text-[10px] text-slate-400 uppercase font-bold">Online</p>
                     <p className="text-lg font-black">{stats.onlineAgents}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] text-slate-400 uppercase font-bold">Sales</p>
                     <p className="text-lg font-black">₵{stats.totalSales}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] text-slate-400 uppercase font-bold">Shops</p>
                     <p className="text-lg font-black">{stats.activeShops}</p>
                  </div>
               </div>
            </div>

            {/* List of Units */}
            <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Field Units ({units.length})</p>
               </div>
               <div className="overflow-y-auto p-2 space-y-2 flex-1 custom-scrollbar">
                  {units.length === 0 ? (
                     <div className="p-8 text-center text-slate-400 text-xs">No active promoters found.</div>
                  ) : units.map((unit) => (
                     <div
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedUnit === unit.id
                              ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                              : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-900'
                           }`}
                     >
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${unit.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                              <span className="font-black text-sm">{unit.name || "Promoter"}</span>
                           </div>
                           <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${selectedUnit === unit.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>ID: {unit.id.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className={`text-[10px] font-medium uppercase tracking-wide ${selectedUnit === unit.id ? 'text-slate-400' : 'text-slate-500'}`}>{unit.location}</p>
                              <p className={`text-[10px] mt-1 ${selectedUnit === unit.id ? 'text-blue-400' : 'text-blue-600'}`}>
                                 {unit.status === 'ONLINE' ? 'Active now' : `Seen: ${new Date(unit.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </p>
                           </div>
                           {unit.status === 'ONLINE' && (
                              <div className="flex items-center gap-1 opacity-60">
                                 <Wifi className="w-3 h-3" />
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* MAIN: RADAR MAP VIEWPORT */}
         <div className="flex-1 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-slate-400 border border-slate-800">

            {/* Map Grid Background */}
            <div className="absolute inset-0 opacity-20"
               style={{
                  backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
               }}
            />

            {/* Radar Rings Animation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-[300px] h-[300px] border border-blue-500/30 rounded-full absolute animate-[ping_3s_ease-in-out_infinite]" />
               <div className="w-[600px] h-[600px] border border-blue-500/10 rounded-full absolute" />
               <div className="w-[900px] h-[900px] border border-blue-500/5 rounded-full absolute" />
            </div>

            {/* Simulated Map Content */}
            <div className="relative z-10 text-center space-y-4">
               <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-500/30 mx-auto">
                  <MapIcon className="w-8 h-8 text-blue-400" />
               </div>

               <h2 className="text-2xl font-black text-white tracking-tight uppercase">Global View</h2>
               <p className="max-w-md mx-auto text-sm font-medium opacity-60">
                  Real-time geospatial tracking is active. Select a unit from the sidebar to triangular position and view telemetry data.
               </p>

               <div className="flex flex-col gap-2">
                  <p className="text-xs font-mono text-emerald-400">
                     {stats.onlineAgents > 0
                        ? `${stats.onlineAgents} Units Transmitting GPS Data`
                        : "Waiting for Promoter Pulse..."}
                  </p>
               </div>
            </div>

            {/* Floating Status Corner */}
            <div className="absolute bottom-8 left-8 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50">
               <div className="flex items-center gap-3 mb-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">Network Stable</span>
               </div>
               <p className="text-[10px] text-slate-400">Latency: 24ms • Encryption: AES-256</p>
            </div>
         </div>
      </div>
   );
}