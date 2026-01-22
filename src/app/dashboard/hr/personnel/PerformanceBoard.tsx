"use client";

import React, { useState, useMemo } from "react";
import { 
  TrendingUp, ShoppingBag, Award, ArrowUpRight, Calendar, Package, 
  Target, Users, FileText, Edit3, Save, X 
} from "lucide-react";

export default function PerformanceBoard({ sales = [], dailyReports = [], targets = {}, onSaveTargets }: any) {
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [targetForm, setTargetForm] = useState({
    monthlyRevenue: targets?.revenue || 0,
    monthlyVolume: targets?.volume || 0
  });

  // --- METRICS CALCULATION ---
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);
    const totalVolume = sales.reduce((acc: number, curr: any) => {
        return acc + (curr.items?.reduce((q: number, i: any) => q + i.quantity, 0) || 0);
    }, 0);
    
    // Footfall Logic
    const totalWalkIns = dailyReports.reduce((acc: number, r: any) => acc + (r.walkIns || 0), 0);
    const conversionRate = totalWalkIns > 0 ? Math.round((sales.length / totalWalkIns) * 100) : 0;

    return { totalRevenue, totalVolume, totalWalkIns, conversionRate, count: sales.length };
  }, [sales, dailyReports]);

  // Target Progress
  const revProgress = targetForm.monthlyRevenue > 0 ? Math.min(100, (stats.totalRevenue / targetForm.monthlyRevenue) * 100) : 0;
  const volProgress = targetForm.monthlyVolume > 0 ? Math.min(100, (stats.totalVolume / targetForm.monthlyVolume) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       {/* --- TARGETS SECTION --- */}
       <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start mb-6 relative z-10">
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <Target className="w-5 h-5 text-emerald-400" />
                 <h3 className="text-sm font-black uppercase tracking-widest">Monthly Targets</h3>
               </div>
               <p className="text-xs text-slate-400">Performance vs Goals</p>
             </div>
             <button 
               onClick={() => {
                 if (isEditingTargets) onSaveTargets(targetForm);
                 setIsEditingTargets(!isEditingTargets);
               }}
               className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
             >
               {isEditingTargets ? <><Save className="w-4 h-4" /> Save Goals</> : <><Edit3 className="w-4 h-4" /> Edit</>}
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             {/* Revenue Target */}
             <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                   <span className="text-slate-400">Revenue Goal</span>
                   {isEditingTargets ? (
                     <input 
                       type="number" 
                       className="bg-white/10 border border-white/20 rounded px-2 py-0.5 w-24 text-right outline-none focus:border-emerald-500"
                       value={targetForm.monthlyRevenue}
                       onChange={e => setTargetForm({...targetForm, monthlyRevenue: parseInt(e.target.value)})}
                     />
                   ) : (
                     <span>₵ {targetForm.monthlyRevenue.toLocaleString()}</span>
                   )}
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-2">
                   <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${revProgress}%` }} />
                </div>
                <p className="text-[10px] text-emerald-400 font-bold text-right">{revProgress.toFixed(1)}% Achieved</p>
             </div>

             {/* Volume Target */}
             <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                   <span className="text-slate-400">Volume Goal</span>
                   {isEditingTargets ? (
                     <input 
                       type="number" 
                       className="bg-white/10 border border-white/20 rounded px-2 py-0.5 w-24 text-right outline-none focus:border-blue-500"
                       value={targetForm.monthlyVolume}
                       onChange={e => setTargetForm({...targetForm, monthlyVolume: parseInt(e.target.value)})}
                     />
                   ) : (
                     <span>{targetForm.monthlyVolume} Units</span>
                   )}
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-2">
                   <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${volProgress}%` }} />
                </div>
                <p className="text-[10px] text-blue-400 font-bold text-right">{volProgress.toFixed(1)}% Achieved</p>
             </div>
          </div>
       </div>

       {/* --- FOOTFALL & CONVERSION --- */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                   <Users className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Footfall</p>
                   <h3 className="text-2xl font-black text-slate-900">{stats.totalWalkIns}</h3>
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase">Potential Customers Visited</p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                   <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Rate</p>
                   <h3 className="text-2xl font-black text-slate-900">{stats.conversionRate}%</h3>
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase">Walk-in to Sale Ratio</p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                   <Award className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actual Sales</p>
                   <h3 className="text-2xl font-black text-slate-900">{stats.count}</h3>
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase">Completed Transactions</p>
          </div>
       </div>

       {/* --- DAILY REPORT LOGS --- */}
       <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm min-h-[400px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
               <FileText className="w-5 h-5 text-blue-600" /> Daily Activity Logs
             </h3>
             <span className="text-xs font-bold text-slate-400 uppercase">{dailyReports.length} Reports Filed</span>
          </div>
          <div className="overflow-x-auto">
             {dailyReports.length === 0 ? (
                <div className="p-20 text-center text-slate-400">
                   <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                   <p className="font-bold text-sm">No daily reports found.</p>
                </div>
             ) : (
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Walk-ins</th>
                         <th className="px-6 py-4">Inquiries</th>
                         <th className="px-6 py-4 w-1/2">Market Intel / Notes</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                      {dailyReports.map((report: any) => (
                         <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-slate-500">
                               <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(report.createdAt).toLocaleDateString()}
                               </div>
                            </td>
                            <td className="px-6 py-4 font-black">{report.walkIns}</td>
                            <td className="px-6 py-4 font-black">{report.inquiries}</td>
                            <td className="px-6 py-4 text-slate-500 italic">
                               "{report.marketIntel || "No notes provided"}"
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             )}
          </div>
       </div>
    </div>
  );
}