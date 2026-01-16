"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Gavel, 
  AlertTriangle, 
  FileText, 
  History, 
  UserX, 
  MoreHorizontal,
  Search
} from "lucide-react";

export default function DisciplinaryLedger() {
  const [filter, setFilter] = useState("ALL");

  const incidents = [
    { id: "INC-402", name: "Kojo Bonsu", hub: "Melcom Accra Mall", category: "Geofence Violation", severity: "HIGH", date: "2026-01-14", status: "RESOLVED" },
    { id: "INC-409", name: "Ama Serwaa", hub: "Game Kumasi", category: "Customer Complaint", severity: "MEDIUM", date: "2026-01-15", status: "PENDING" },
    { id: "INC-510", name: "Kwesi Appiah", hub: "Palace Labone", category: "Inventory Discrepancy", severity: "CRITICAL", date: "2026-01-15", status: "SUSPENDED" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* TERMINAL HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 rounded-lg">
            <Gavel className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Disciplinary Authority</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Personnel Conduct & Compliance Ledger</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-900/20">
          <ShieldAlert className="w-3.5 h-3.5" /> Log New Incident
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex gap-2">
          {['ALL', 'CRITICAL', 'PENDING'].map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input placeholder="SEARCH PERSONNEL..." className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold uppercase tracking-widest outline-none w-48 focus:border-red-300" />
        </div>
      </div>

      {/* TABLE HEADERS */}
      <div className="grid grid-cols-12 px-6 py-2.5 bg-slate-50 border-b border-slate-100">
        <span className="col-span-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Personnel / Hub Node</span>
        <span className="col-span-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Incident Category</span>
        <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Severity</span>
        <span className="col-span-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Status / Control</span>
      </div>

      {/* INCIDENT LIST */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {incidents.map((inc) => (
          <div key={inc.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/80 transition-all group">
            
            {/* PERSONNEL */}
            <div className="col-span-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm group-hover:border-red-200">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 truncate tracking-tight">{inc.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{inc.hub}</span>
              </div>
            </div>

            {/* CATEGORY */}
            <div className="col-span-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{inc.category}</span>
              <p className="text-[8px] text-slate-400 font-bold tabular-nums">{inc.date}</p>
            </div>

            {/* SEVERITY */}
            <div className="col-span-2 flex justify-center">
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                inc.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' :
                inc.severity === 'HIGH' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}>
                {inc.severity}
              </span>
            </div>

            {/* STATUS & ACTIONS */}
            <div className="col-span-3 flex items-center justify-end gap-3">
              <div className="text-right mr-2">
                 <p className={`text-[9px] font-black uppercase tracking-widest ${inc.status === 'SUSPENDED' ? 'text-red-600' : 'text-slate-400'}`}>
                   {inc.status}
                 </p>
              </div>
              <button className="p-2 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all">
                <History className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
              </button>
              <button className="p-2 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all">
                <UserX className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER STATS */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">1 Suspended Personnel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Manual Audit Required</span>
          </div>
        </div>
        <button className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-b-2 border-slate-900">
          Export Conduct Report
        </button>
      </div>
    </div>
  );
}