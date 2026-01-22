"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, DollarSign, PieChart, CreditCard, 
  Receipt, Wallet, ArrowUpRight, ArrowDownRight,
  Plus, Loader2, Filter, Download
} from "lucide-react";

/**
 * --------------------------------------------------------------------------
 * NEXUS COMMAND - FINANCIAL INTEGRITY & EXPENSES
 * --------------------------------------------------------------------------
 */

export default function ExpenseManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSpend: 0, revenue: 0, margin: 0 });

  // 1. SYNC FINANCIAL DATA
  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        // Fetching from your existing operations pulse to get revenue + expenses
        const res = await fetch('/api/operations/pulse?t=' + Date.now());
        if (res.ok) {
          const pulse = await res.json();
          // Mocking expense list for UI; in production, fetch from /api/expenses
          setStats({
            totalSpend: 14200,
            revenue: pulse.sales?.reduce((a: any, s: any) => a + s.totalAmount, 0) || 0,
            margin: 62.5
          });
        }
      } catch (e) {
        console.error("Financial Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchFinancials();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
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
             <h1 className="text-3xl font-black text-white tracking-tighter">Financial Integrity</h1>
             <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                <Wallet className="w-3 h-3" /> Profit & Loss Oversight
             </p>
           </div>
        </div>
        
        <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-600/20">
           <Plus className="w-4 h-4" /> Log Expense
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* FINANCIAL KPI GRID */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Operational Spend</p>
              <h2 className="text-4xl font-black text-white">₵ {stats.totalSpend.toLocaleString()}</h2>
              <div className="flex items-center gap-1 text-rose-500 text-[10px] font-black mt-2">
                 <ArrowUpRight className="w-3 h-3" /> +14% vs Last Month
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><CreditCard size={120} /></div>
           </div>
           
           <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Net Margin</p>
              <h2 className="text-4xl font-black text-white">{stats.margin}%</h2>
              <p className="text-[10px] font-black text-emerald-500 mt-2 uppercase">Stable Efficiency</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><PieChart size={120} /></div>
           </div>

           <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Liquidity Score</p>
              <h2 className="text-4xl font-black text-white">A+</h2>
              <p className="text-[10px] font-black text-blue-500 mt-2 uppercase tracking-widest">Low Risk Profile</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><Receipt size={120} /></div>
           </div>
        </div>

        {/* EXPENSE LOG (LEFTHAND SIDE) */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-[3rem] p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Receipt className="w-4 h-4 text-rose-500" /> Transaction Ledger
              </h3>
              <div className="flex gap-2">
                 <button className="p-2 bg-slate-800 rounded-lg text-slate-400"><Filter size={16}/></button>
                 <button className="p-2 bg-slate-800 rounded-lg text-slate-400"><Download size={16}/></button>
              </div>
           </div>
           
           <div className="space-y-4">
              {/* Mocking recent entries; would be mapped from database */}
              {[
                { name: "Electricity - Kumasi Hub", cat: "Utilities", amount: 450, date: "Today" },
                { name: "Staff Travel Allowances", cat: "Payroll", amount: 1200, date: "Yesterday" },
                { name: "Generator Maintenance", cat: "Ops", amount: 2800, date: "2 Days Ago" }
              ].map((exp, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-rose-500/30 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                         <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-sm font-black text-white">{exp.name}</p>
                         <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{exp.cat} • {exp.date}</p>
                      </div>
                   </div>
                   <p className="text-lg font-black text-white">- ₵{exp.amount}</p>
                </div>
              ))}
           </div>
        </div>

        {/* COST DISTRIBUTION (RIGHTHAND SIDE) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
           <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 h-full">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">Cost Allocation</h3>
              <div className="space-y-6">
                 {[
                   { label: "Inventory Sourcing", val: 65, color: "#e11d48" },
                   { label: "Logistics & Fuel", val: 20, color: "#3b82f6" },
                   { label: "Shop Utilities", val: 15, color: "#f59e0b" }
                 ].map((cost, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-slate-400">{cost.label}</span>
                        <span className="text-white">{cost.val}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${cost.val}%`, backgroundColor: cost.color }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}