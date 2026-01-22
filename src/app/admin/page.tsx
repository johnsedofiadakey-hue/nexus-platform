"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Map, Package, TrendingUp, ShieldAlert, ChevronRight, Zap } from "lucide-react";

export default function AdminCommandHub() {
  const [pulse, setPulse] = useState<any>(null);

  useEffect(() => {
    const fetchPulse = () => fetch('/api/operations/pulse').then(r => r.json()).then(setPulse);
    fetchPulse();
    const interval = setInterval(fetchPulse, 10000); // 10s Heartbeat
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans transition-colors duration-500">
      
      {/* 🏗️ SYSTEM HEADER */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Nexus Command Center</p>
          <h1 className="text-4xl font-black tracking-tighter">Global Operations</h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
           <Activity className={`w-5 h-5 ${pulse ? "text-emerald-500 animate-pulse" : "text-slate-600"}`} />
           <p className="text-[10px] font-black uppercase tracking-widest">System Live</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* 🗺️ NAVIGATION DRAWER (Uses your existing folders) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Modules</h3>
           {[
             { name: "Monitoring", path: "/admin/monitoring", icon: Map, color: "blue", desc: "Live Staff Tracking" },
             { name: "Inventory", path: "/admin/inventory", icon: Package, color: "amber", desc: "Stock Control" },
             { name: "Performance", path: "/admin/performance", icon: TrendingUp, color: "emerald", desc: "Retail Analytics" }
           ].map(link => (
             <Link key={link.name} href={link.path} className="flex items-center justify-between p-6 bg-slate-900/50 border border-slate-800 rounded-[2rem] hover:border-blue-500/50 transition-all group active:scale-95">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${link.color}-500/10`}>
                    <link.icon className={`text-${link.color}-500 w-6 h-6`} />
                  </div>
                  <div>
                    <span className="font-black text-sm block">{link.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{link.desc}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-white" />
             </Link>
           ))}
        </div>

        {/* 📋 LIVE SENTINEL & GHOST FEED */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
           
           {/* GHOST MODE ALERTS */}
           {pulse?.ghosts?.length > 0 && (
             <section className="bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                   <ShieldAlert className="text-rose-500 w-6 h-6" />
                   <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">Ghost Mode Detected</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {pulse.ghosts.map((ghost: any) => (
                     <div key={ghost.id} className="bg-slate-900/50 p-4 rounded-2xl border border-rose-500/30 flex justify-between items-center">
                        <div>
                           <p className="text-xs font-black text-white">{ghost.name}</p>
                           <p className="text-[9px] font-bold text-rose-400 uppercase">{ghost.shop?.name || "No Shop Assigned"}</p>
                        </div>
                        <div className="text-[9px] font-black text-rose-500 px-2 py-1 bg-rose-500/10 rounded uppercase">Zero Activity</div>
                     </div>
                   ))}
                </div>
             </section>
           )}

           {/* INTEL FEED */}
           <section className="bg-slate-900/30 border border-slate-800 rounded-[3rem] p-8 backdrop-blur-md">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Sentinel Intelligence Feed</h3>
              <div className="space-y-4">
                 {pulse?.sales?.map((s: any) => (
                   <div key={s.id} className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 group hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                         <p className="text-xs font-bold text-white">Sale Processed: <span className="text-emerald-500">₵{s.totalAmount}</span></p>
                      </div>
                      <p className="text-[10px] font-black text-slate-600 uppercase group-hover:text-slate-400">{s.user.name}</p>
                   </div>
                 ))}
                 {pulse?.intel?.map((i: any) => (
                   <div key={i.id} className="flex items-center justify-between p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4">
                         <Zap className="w-4 h-4 text-blue-400" />
                         <p className="text-xs font-bold text-blue-100 italic">"{i.marketIntel.slice(0, 50)}..."</p>
                      </div>
                      <p className="text-[10px] font-black text-blue-400/50 uppercase">{i.user.name}</p>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}