"use client";

import React, { useState } from "react";
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  FileCheck, 
  Download, 
  History,
  Info,
  BadgeCheck
} from "lucide-react";

export default function WageSettlement({ staffId }: { staffId: string }) {
  const [isSettled, setIsSettled] = useState(false);

  // Strategic Data for LG Ghana Personnel
  const settlementData = {
    period: "JANUARY 2026",
    basePay: 2500.00,
    commission: 1680.50,
    deductions: 120.00, // e.g., Unexcused absence
    netTotal: 4060.50,
    salesCount: 14,
    geofenceCompliance: "98.2%"
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* TERMINAL HEADER */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Wage Settlement Terminal</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Payroll Cycle: {settlementData.period}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <BadgeCheck className="w-4 h-4 text-emerald-400" />
           <span className="text-[10px] font-black uppercase tracking-widest">Audit Ready</span>
        </div>
      </div>

      {/* FINANCIAL BREAKDOWN GRID */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Retainer</p>
          <p className="text-xl font-black text-slate-900 tabular-nums">GHS {settlementData.basePay.toFixed(2)}</p>
        </div>
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden">
          <ArrowUpRight className="absolute -right-2 -top-2 w-12 h-12 text-blue-200 opacity-30" />
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Performance Commission</p>
          <p className="text-xl font-black text-blue-900 tabular-nums">GHS {settlementData.commission.toFixed(2)}</p>
        </div>
        <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Grid Compliance</p>
          <p className="text-xl font-black text-slate-900 tabular-nums">{settlementData.geofenceCompliance}</p>
        </div>
      </div>

      {/* SETTLEMENT LEDGER */}
      <div className="px-6 pb-6 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px] font-bold">
              <tr>
                <td className="px-4 py-3 text-slate-600">Performance Sales Value (2% Rate)</td>
                <td className="px-4 py-3 text-right tabular-nums">GHS 84,025.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-600">Geofence Compliance Penalty</td>
                <td className="px-4 py-3 text-right tabular-nums text-red-500">- GHS {settlementData.deductions.toFixed(2)}</td>
              </tr>
              <tr className="bg-slate-900 text-white font-black">
                <td className="px-4 py-3 uppercase tracking-widest text-[10px]">Net Settlement Amount</td>
                <td className="px-4 py-3 text-right text-sm tabular-nums underline decoration-blue-500 underline-offset-4">GHS {settlementData.netTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
           <Info className="w-4 h-4 text-slate-300 shrink-0" />
           <p className="text-[9px] text-slate-400 leading-relaxed italic">
             Calculations based on verified GPS telemetry and mobile transaction logs. Discrepancies must be raised within 48h of settlement.
           </p>
        </div>
      </div>

      {/* AUTHORITY ACTIONS */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase hover:text-slate-900 transition-all">
          <History className="w-4 h-4" /> View History
        </button>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase hover:bg-white transition-all">
            <Download className="w-3.5 h-3.5" /> PDF Statement
          </button>
          <button 
            disabled={isSettled}
            onClick={() => setIsSettled(true)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md ${
              isSettled ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSettled ? <><FileCheck className="w-3.5 h-3.5" /> Settled</> : "Authorise Payout"}
          </button>
        </div>
      </div>
    </div>
  );
}