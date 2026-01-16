"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  MapPin, 
  Calendar, 
  Power, 
  MessageSquare, 
  TrendingUp,
  Clock,
  UserCheck
} from "lucide-react";

export default function PersonnelCommand({ staff }: any) {
  const [isOnline, setIsOnline] = useState(!staff.isSuspended);

  return (
    <div className="grid grid-cols-12 gap-6 bg-[#F8FAFC] p-6 rounded-3xl border border-slate-200">
      
      {/* LEFT COLUMN: IDENTITY & CONTROL */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 overflow-hidden border-2 border-white shadow-md">
            <img src={staff.image || "/api/placeholder/100/100"} alt="Staff" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-black text-slate-900">{staff.name}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{staff.staffId} • {staff.shop.name}</p>
          
          {/* LIVE STATUS TOGGLE (The Admin's Power Switch) */}
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Access</span>
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isOnline ? 'Active' : 'Locked'}
            </button>
          </div>
        </div>

        {/* LEAVE & COMPLAINT QUICK ACTIONS */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl space-y-4">
           <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Command Actions</h3>
           <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all text-left px-4 flex justify-between items-center">
              View Leave Requests <Calendar className="w-4 h-4 text-blue-400" />
           </button>
           <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-widest transition-all text-left px-4 flex justify-between items-center">
              Log Misbehavior <ShieldAlert className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVITY TELEMETRY */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        
        {/* KPI GRID FOR WAGES */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">On-Site Hours</p>
             <p className="text-xl font-black text-slate-900">142.5 h</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sales Generated</p>
             <p className="text-xl font-black text-blue-600">GHS 84k</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Compliance</p>
             <p className="text-xl font-black text-emerald-500">98%</p>
          </div>
        </div>

        {/* RECENT SALES & GEOLOCATION LOG */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest">Recent Activity Log</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { type: 'SALE', desc: 'LG OLED 65" C3 Sold', time: '14:20', loc: 'On-site' },
              { type: 'MOVE', desc: 'Exited Geofence Radius', time: '12:05', loc: 'Off-site' },
              { type: 'LUNCH', desc: 'Lunch Break Started', time: '12:00', loc: 'On-site' },
            ].map((log, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${log.type === 'MOVE' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {log.type === 'SALE' ? <TrendingUp className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">{log.desc}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{log.time} • {log.loc}</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white rounded-md border border-slate-100">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}