"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Power, MapPin, TrendingUp, Gavel, 
  MessageSquare, Calendar, ShieldAlert, BadgeCheck, 
  Clock, Navigation, Activity, Wallet, AlertCircle,
  ShoppingBag, ShieldCheck
} from "lucide-react";

export default function PersonnelPortal({ params }: { params: { id: string } }) {
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState("ACTIVITY");
  
  // Personnel Logic: Reflects the new Prisma 7 Category/Shop structure
  const staff = {
    id: params.id,
    name: "Kojo Bonsu",
    staffId: "LG-ACC-401",
    role: "Senior Sales Rep",
    shop: "Melcom Accra Mall",
    status: isLocked ? "LOCKED" : "ACTIVE",
    compliance: "98.2%",
    totalSales: "GHS 84,025.00",
    phone: "+233 24 123 4567",
    email: "k.bonsu@lgghana.com",
    lastSeen: "2 mins ago"
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* --- CRITICAL NAVIGATION & LOCK SWITCH --- */}
      <div className="flex items-center justify-between mb-10">
        <Link 
          href="/dashboard/hr/enrollment" 
          className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" /> 
          Return to Personnel Grid
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Terminal Access Status:</span>
          <button 
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
              isLocked 
              ? "bg-red-600 text-white shadow-red-200" 
              : "bg-emerald-500 text-white shadow-emerald-200"
            }`}
          >
            <Power className="w-4 h-4" />
            {isLocked ? "System Locked" : "System Active"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* --- LEFT: BIO & AUTHORITY HUB --- */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
               <BadgeCheck className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-3xl bg-slate-100 border-4 border-white shadow-2xl mb-6 flex items-center justify-center overflow-hidden">
                <span className="text-3xl font-black text-slate-300">KB</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{staff.name}</h2>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1 underline decoration-blue-200 underline-offset-4">{staff.staffId}</p>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-10">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Grid Compliance</p>
                    <p className="text-sm font-black text-emerald-600 tabular-nums">{staff.compliance}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Account State</p>
                    <p className={`text-sm font-black ${isLocked ? 'text-red-600' : 'text-slate-900'}`}>{staff.status}</p>
                 </div>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-slate-50 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Contact</span>
                  <span className="text-[11px] font-bold text-slate-900 tabular-nums">{staff.phone}</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Retail Hub</span>
                  <span className="text-[11px] font-bold text-slate-900 uppercase">{staff.shop}</span>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-3 shadow-2xl">
             <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 px-2">Authority Shortcuts</h3>
             <button className="w-full flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all group">
                Log Conduct Warning <Gavel className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
             </button>
             <button className="w-full flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all group">
                Comms History <MessageSquare className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
             </button>
             <button className="w-full flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all group">
                Wage Settlements <Wallet className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </div>

        {/* --- RIGHT: TELEMETRY FEED & PERFORMANCE --- */}
        <div className="col-span-12 lg:col-span-8 space-y-8 flex flex-col">
          
          <div className="grid grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><TrendingUp className="w-5 h-5" /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MTD Revenue</p>
                   <p className="text-xl font-black text-slate-900 tabular-nums">{staff.totalSales}</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Site Presence</p>
                   <p className="text-xl font-black text-slate-900 tabular-nums">142.5h</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><MapPin className="w-5 h-5" /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time GPS</p>
                   <p className="text-xl font-black text-slate-900 uppercase">On-Site</p>
                </div>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-sm">
             <div className="flex border-b border-slate-100 px-8 shrink-0 bg-slate-50/50">
                {["ACTIVITY LOG", "GEOSPATIAL", "LEAVE HISTORY"].map(tab => (
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

             <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {activeTab === "ACTIVITY LOG" ? (
                  <div className="space-y-4">
                    {[
                      { type: 'SALE', desc: 'Sold LG InstaView Fridge (Sub: REFRIGERATOR)', time: '14:20', val: 'GHS 18,400', color: 'blue' },
                      { type: 'INTEL', desc: 'Samsung Competitor Promo Reported', time: '11:05', val: 'High Alert', color: 'slate' },
                      { type: 'CHECK', desc: 'Geofence Verification: Accra Mall Hub', time: '08:32', val: 'Success', color: 'emerald' },
                      { type: 'WARN', desc: 'GHA Card Identity Check: Verified', time: 'Yesterday', val: 'Audit Pass', color: 'blue' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${
                              item.type === 'SALE' ? 'bg-blue-50 text-blue-600' : 
                              item.type === 'WARN' ? 'bg-amber-50 text-amber-600' : 
                              'bg-slate-50 text-slate-500'
                            }`}>
                               {item.type === 'SALE' ? <ShoppingBag className="w-4 h-4" /> : item.type === 'WARN' ? <ShieldAlert className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="text-[11px] font-bold text-slate-900 leading-tight">{item.desc}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.time}</p>
                            </div>
                         </div>
                         <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.val}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3 italic">
                    <AlertCircle className="w-8 h-8 opacity-20" />
                    <p className="text-[10px] uppercase font-black tracking-widest">Telemetry Module Initializing...</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}