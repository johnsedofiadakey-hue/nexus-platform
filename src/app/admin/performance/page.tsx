"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, Users, Target, Award, 
  ArrowLeft, Loader2, BarChart3, PieChart,
  ChevronRight, Zap, ArrowUpRight
} from "lucide-react";

/**
 * --------------------------------------------------------------------------
 * NEXUS COMMAND - RETAIL PERFORMANCE ANALYTICS
 * --------------------------------------------------------------------------
 */

export default function PerformanceAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. SYNC PERFORMANCE DATA (From existing Sales & Reports APIs)
  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        // We pulse the analytics engine to get conversion & sales data
        const res = await fetch('/api/operations/pulse?t=' + Date.now());
        if (res.ok) {
          const pulse = await res.json();
          setData(pulse);
        }
      } catch (e) {
        console.error("Analytics Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-6">
           <button onClick={() => router.push('/admin')} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all">
             <ArrowLeft className="w-5 h-5 text-slate-400" />
           </button>
           <div>
             <h1 className="text-3xl font-black text-white tracking-tighter">Retail Performance</h1>
             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                <Target className="w-3 h-3" /> Live Conversion Tracking
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* KPI OVERVIEW */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Global Conversion</p>
              <h2 className="text-4xl font-black text-white">74.2%</h2>
              <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black mt-2">
                 <ArrowUpRight className="w-3 h-3" /> +4.2% VS LW
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><Target size={120} /></div>
           </div>
           <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Walk-ins</p>
              <h2 className="text-4xl font-black text-white">1,240</h2>
              <p className="text-[10px] font-black text-blue-500 mt-2 uppercase">Across 12 Sites</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><Users size={120} /></div>
           </div>
           <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sales Velocity</p>
              <h2 className="text-4xl font-black text-white">₵ 12.5k</h2>
              <p className="text-[10px] font-black text-amber-500 mt-2 uppercase tracking-widest">In-Store Only</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><Zap size={120} /></div>
           </div>
        </div>

        {/* TOP REPS (League Table) */}
        <div className="col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-[3rem] p-8">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Agent League Table
           </h3>
           <div className="space-y-6">
              {data?.sales?.map((sale: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800 group hover:border-blue-500/30 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-black text-[10px] text-slate-500">
                         {i + 1}
                      </div>
                      <div>
                         <p className="text-xs font-black text-white uppercase tracking-tight">{sale.user.name}</p>
                         <p className="text-[9px] font-bold text-slate-600 uppercase">{sale.shop?.name || "Global"}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-blue-500">₵ {sale.totalAmount.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Revenue</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* CONVERSION ANALYSIS */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
           <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 h-full">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" /> Conversion Funnel
                 </h3>
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Real-time Feed</span>
              </div>
              
              <div className="space-y-8">
                 {data?.intel?.map((report: any, i: number) => {
                    const conv = report.walkIns > 0 ? (report.buyers / report.walkIns) * 100 : 0;
                    return (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between items-end">
                             <p className="text-[10px] font-black text-slate-300 uppercase">{report.user.name}</p>
                             <p className="text-[10px] font-black text-blue-500">{Math.round(conv)}% Conv.</p>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-1000 ${conv > 70 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${conv}%` }} />
                          </div>
                          <p className="text-[9px] font-medium text-slate-500 italic">"{report.marketIntel.slice(0, 60)}..."</p>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}