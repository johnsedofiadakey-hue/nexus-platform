"use client";

import React, { useState } from "react";
import { 
  BarChart2, 
  Zap, 
  ShieldAlert, 
  MessageSquare, 
  Send, 
  Loader2, 
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  PackageSearch
} from "lucide-react";

export default function FieldReportPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    walkIns: "",
    buyers: "",
    marketIntel: "",
    stockGaps: "",
    competitorNotes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/operations/reports", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (response.ok) setSuccess(true);
    } catch (err) {
      console.error("Sync Failure");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Report Synchronized</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Intelligence logged to LG Command Center</p>
        <button 
          onClick={() => window.location.href = "/mobile/sales"} 
          className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em]"
        >
          Return to Sales Portal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFE] font-sans">
      {/* STEALTH HEADER */}
      <div className="bg-white px-6 py-6 border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Nexus Field Intel</p>
            <h1 className="text-lg font-black text-slate-900 tracking-tighter">Daily Operations Report</h1>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-[9px] font-black text-slate-400 uppercase">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8 pb-24">
        
        {/* SECTION: FOOT TRAFFIC (QUANTITATIVE) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foot Traffic & Conversion</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Walk-ins</label>
              <input 
                type="number" 
                required
                className="w-full bg-white border border-slate-200 h-14 px-4 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                placeholder="0"
                onChange={(e) => setFormData({...formData, walkIns: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Actual Buyers</label>
              <input 
                type="number" 
                required
                className="w-full bg-white border border-slate-200 h-14 px-4 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                placeholder="0"
                onChange={(e) => setFormData({...formData, buyers: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* SECTION: COMPETITOR INTEL (QUALITATIVE) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Intelligence</h3>
          </div>
          <div className="space-y-3">
             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Competitor Activity (Samsung/Hisense)</label>
             <textarea 
               rows={3}
               className="w-full bg-white border border-slate-200 p-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 resize-none"
               placeholder="Example: Samsung is offering 10% cash-back on ACs today..."
               onChange={(e) => setFormData({...formData, competitorNotes: e.target.value})}
             />
          </div>
        </section>

        {/* SECTION: STOCK GAP ALERTS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <PackageSearch className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory & Stock Gaps</h3>
          </div>
          <div className="space-y-3">
             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Urgent Stock Gaps / Low Availability</label>
             <textarea 
               rows={2}
               className="w-full bg-white border border-slate-200 p-4 rounded-xl text-xs font-bold outline-none focus:border-amber-500 border-dashed resize-none"
               placeholder="Which LG models are customers asking for but are out of stock?"
               onChange={(e) => setFormData({...formData, stockGaps: e.target.value})}
             />
          </div>
        </section>

        {/* SECTION: GENERAL FEEDBACK */}
        <section className="space-y-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Remarks</h3>
          </div>
          <textarea 
            rows={2}
            className="w-full bg-white border border-slate-200 p-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 resize-none"
            placeholder="Any other observations from the floor?"
            onChange={(e) => setFormData({...formData, marketIntel: e.target.value})}
          />
        </section>

        {/* SYNC BUTTON */}
        <button 
          disabled={loading}
          className="w-full bg-slate-900 h-16 rounded-2xl text-white font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-200"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <Send className="w-4 h-4" /> Finalise Daily Report
            </>
          )}
        </button>
      </form>

      {/* MOBILE NAV BAR (Quick Toggle) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-30">
        <button onClick={() => window.location.href = "/mobile/sales"} className="flex flex-col items-center gap-1 opacity-40">
           <TrendingUp className="w-5 h-5" />
           <span className="text-[8px] font-black uppercase">Sales</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-blue-600">
           <BarChart2 className="w-5 h-5" />
           <span className="text-[8px] font-black uppercase">Report</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40">
           <ShieldAlert className="w-5 h-5" />
           <span className="text-[8px] font-black uppercase">Alerts</span>
        </button>
      </div>
    </div>
  );
}