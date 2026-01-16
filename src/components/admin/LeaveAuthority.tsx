"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  AlertCircle,
  ShieldLock,
  ArrowRight
} from "lucide-react";

export default function LeaveAuthority() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Mocking the pending queue for LG Ghana reps
  const pendingLeaves = [
    { 
      id: "LV-901", 
      userId: "usr-01", 
      name: "Kojo Bonsu", 
      hub: "Melcom Accra Mall", 
      start: "2026-01-20", 
      end: "2026-01-25", 
      reason: "Medical Checkup",
      performance: "94%" 
    },
    { 
      id: "LV-904", 
      userId: "usr-04", 
      name: "Ama Serwaa", 
      hub: "Game Kumasi", 
      start: "2026-02-01", 
      end: "2026-02-05", 
      reason: "Family Emergency",
      performance: "88%" 
    }
  ];

  const handleAction = async (id: string, userId: string, action: 'APPROVE' | 'REJECT') => {
    setLoadingId(id);
    // Logic to POST to /api/hr/leave-authority
    setTimeout(() => setLoadingId(null), 1500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg">
            <ShieldLock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Leave Authority Terminal</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Personnel Access & Lockdown Control</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest">
          <AlertCircle className="w-3 h-3" /> {pendingLeaves.length} Pending Actions
        </div>
      </div>

      {/* COLUMN HEADERS */}
      <div className="grid grid-cols-12 px-6 py-2.5 bg-slate-50 border-b border-slate-100">
        <span className="col-span-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Personnel / Hub Node</span>
        <span className="col-span-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Requested Period</span>
        <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Grid Performance</span>
        <span className="col-span-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Decision Authority</span>
      </div>

      {/* REQUEST LIST */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {pendingLeaves.map((req) => (
          <div key={req.id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-slate-50/80 transition-all group">
            
            {/* PERSONNEL INFO */}
            <div className="col-span-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-900">{req.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{req.hub}</span>
              </div>
            </div>

            {/* DATE RANGE */}
            <div className="col-span-3 flex flex-col items-center">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 tabular-nums uppercase">
                {req.start} <ArrowRight className="w-3 h-3 text-slate-300" /> {req.end}
              </div>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">"{req.reason}"</span>
            </div>

            {/* PERFORMANCE METRIC */}
            <div className="col-span-2 text-center">
              <span className="text-[11px] font-black text-slate-900 tabular-nums">{req.performance}</span>
              <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter">Compliance</p>
            </div>

            {/* AUTHORITY BUTTONS */}
            <div className="col-span-3 flex justify-end gap-2">
              <button 
                onClick={() => handleAction(req.id, req.userId, 'REJECT')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 uppercase hover:bg-white hover:text-red-600 hover:border-red-100 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" /> Deny
              </button>
              <button 
                onClick={() => handleAction(req.id, req.userId, 'APPROVE')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
              >
                {loadingId === req.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Approve & Lock</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TERMINAL FOOTER */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Auto-Lock Enabled</span>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 font-medium uppercase italic">Approving a request immediately revokes system tokens for the specified period.</p>
      </div>
    </div>
  );
}