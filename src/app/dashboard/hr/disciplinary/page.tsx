"use client";

import React, { useState } from "react";
import { 
  Gavel, Search, Filter, AlertTriangle, CheckCircle, 
  FileWarning, ChevronRight, Scale, ShieldAlert 
} from "lucide-react";

export default function ConductPage() {
  const [incidents] = useState([
    { id: "1", officer: "Kojo Bonsu", staffId: "LG-ACC-401", infraction: "Geofence Violation (Accra Mall)", severity: "LOW", status: "PENDING", date: "Jan 14, 2026" },
    { id: "2", officer: "Ama Serwaa", staffId: "LG-KUM-502", infraction: "Inventory Discrepancy (-2 Units)", severity: "HIGH", status: "UNDER_REVIEW", date: "Jan 12, 2026" },
    { id: "3", officer: "Kwesi Appiah", staffId: "LG-LAB-201", infraction: "Unauthorized Absence", severity: "MEDIUM", status: "RESOLVED", date: "Jan 08, 2026" },
  ]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <Scale className="w-8 h-8 text-slate-300" />
            Conduct & Gavel
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 ml-11">
            Internal Affairs • Disciplinary Tribunal
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all">
          <Gavel className="w-3.5 h-3.5" /> Log New Infraction
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-2xl text-red-600"><ShieldAlert className="w-6 h-6" /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Cases</p>
            <p className="text-2xl font-black text-slate-900">4</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><FileWarning className="w-6 h-6" /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Review</p>
            <p className="text-2xl font-black text-slate-900">2</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resolved (MTD)</p>
            <p className="text-2xl font-black text-slate-900">12</p>
          </div>
        </div>
      </div>

      {/* TRIBUNAL TABLE */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400" />
          <input placeholder="SEARCH CASE FILES..." className="w-full bg-transparent text-[10px] font-black uppercase outline-none" />
          <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-500 uppercase hover:bg-slate-100 rounded-lg transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Officer Detail</th>
              <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Infraction</th>
              <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Severity</th>
              <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tribunal Status</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {incidents.map((caseFile) => (
              <tr key={caseFile.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer">
                <td className="px-8 py-6">
                  <p className="text-[11px] font-black text-slate-900 uppercase">{caseFile.officer}</p>
                  <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">{caseFile.staffId}</p>
                </td>
                <td className="px-6 py-6">
                  <p className="text-[11px] font-bold text-slate-700">{caseFile.infraction}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{caseFile.date}</p>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                    caseFile.severity === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
                    caseFile.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {caseFile.severity}
                  </span>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    caseFile.status === 'PENDING' ? 'text-blue-600' :
                    caseFile.status === 'UNDER_REVIEW' ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>
                    {caseFile.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                   <button className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900">
                      <ChevronRight className="w-5 h-5" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}