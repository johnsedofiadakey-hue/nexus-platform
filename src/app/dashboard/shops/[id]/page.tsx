"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, MapPin, Users, Package, TrendingUp, 
  Activity, ShieldCheck, MoreHorizontal, ArrowRight,
  Monitor, Refrigerator, Wind, Zap, AlertTriangle
} from "lucide-react";
import dynamic from "next/dynamic";

const NodeLiveMap = dynamic(
  () => import("@/components/admin/NodeLiveMap"),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 animate-pulse rounded-3xl" /> }
);

export default function ShopDetailPortal({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("INVENTORY");

  // Mocked for Melcom Accra Mall Context
  const shop = {
    name: "Melcom - Accra Mall Hub",
    location: "Tetteh Quarshie, Accra",
    radius: 150,
    activeReps: 4,
    totalSales: "GHS 1,240,500.00",
    compliance: "98.5%"
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* --- HUB NAVIGATION & STATUS --- */}
      <div className="flex items-center justify-between mb-10">
        <Link href="/dashboard/shops" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Hub Registry
        </Link>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Node Online</span>
           </div>
           <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              <Settings className="w-4 h-4 text-slate-400" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* --- LEFT: NODE TELEMETRY & REPS --- */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          
          {/* NODE IDENTITY CARD */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
               <h1 className="text-3xl font-black tracking-tighter uppercase">{shop.name}</h1>
               <div className="flex items-center gap-2 text-blue-400 mt-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{shop.location}</span>
               </div>

               <div className="grid grid-cols-3 gap-8 mt-12 pt-10 border-t border-white/10">
                  <div>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Hub Revenue</p>
                     <p className="text-xl font-black tabular-nums">{shop.totalSales}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Grid Compliance</p>
                     <p className="text-xl font-black text-emerald-400 tabular-nums">{shop.compliance}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Personnel</p>
                     <p className="text-xl font-black tabular-nums">{shop.activeReps} On-Site</p>
                  </div>
               </div>
            </div>
            <ShieldCheck className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 opacity-10" />
          </div>

          {/* LIVE PERSONNEL TRACKER (GEOSPATIAL) */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm h-[400px] relative">
             <div className="absolute top-6 left-6 z-20">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3">
                   <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Live Presence Map</span>
                </div>
             </div>
             <NodeLiveMap radius={shop.radius} />
          </div>
        </div>

        {/* --- RIGHT: INVENTORY & SALES LEDGER --- */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
          
          <div className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-sm">
             <div className="flex border-b border-slate-100 px-8 bg-slate-50/50">
                {["INVENTORY", "RECENT SALES"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-5 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${
                      activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
             </div>

             <div className="flex-1 overflow-y-auto p-8">
                {activeTab === "INVENTORY" ? (
                  <div className="space-y-4">
                    {[
                      { icon: Monitor, name: "LG OLED 65\" C3", sku: "LG-TV-001", stock: 12, status: "GOOD" },
                      { icon: Refrigerator, name: "LG InstaView 601L", sku: "LG-RF-042", stock: 3, status: "LOW" },
                      { icon: Wind, name: "LG Dual Inverter AC", sku: "LG-AC-088", stock: 24, status: "GOOD" },
                      { icon: Zap, name: "LG Vivace Washer", sku: "LG-WM-012", stock: 0, status: "OUT" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                               <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-[11px] font-bold text-slate-900">{item.name}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.sku}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[12px] font-black text-slate-900 tabular-nums">{item.stock}</p>
                            <span className={`text-[8px] font-black uppercase tracking-tighter ${
                              item.status === 'GOOD' ? 'text-emerald-500' : 'text-red-500'
                            }`}>{item.status}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                     {/* Sales Feed specialized for this shop */}
                     <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                        <TrendingUp className="w-10 h-10 opacity-10" />
                        <p className="text-[10px] uppercase font-black tracking-widest">Aggregating Sales Telemetry...</p>
                     </div>
                  </div>
                )}
             </div>

             <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                <button className="w-full h-14 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                   Request Inventory Restock <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* CRITICAL ALERTS AT THIS NODE */}
          <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] flex items-start gap-4">
             <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
             <div>
                <h4 className="text-[11px] font-black text-red-900 uppercase">Hub Access Warning</h4>
                <p className="text-[10px] text-red-600 mt-1 uppercase font-bold leading-relaxed">
                  Multiple Geofence exits detected by Rep LG-ACC-408 in the last 60 minutes.
                </p>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Minimal Settings icon helper
function Settings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}