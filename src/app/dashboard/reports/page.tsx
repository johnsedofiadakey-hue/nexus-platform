"use client";

import React, { useState } from 'react';
import { 
  FileText, Download, Calendar, Filter, 
  TrendingUp, ArrowRight, Printer, Search, 
  BarChart3, PieChart 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// Mock Data for Charts
const monthlyData = [
  { name: 'Week 1', revenue: 12500, target: 15000 },
  { name: 'Week 2', revenue: 18000, target: 15000 },
  { name: 'Week 3', revenue: 14000, target: 15000 },
  { name: 'Week 4', revenue: 22000, target: 15000 },
];

const categoryData = [
  { name: 'Electronics', value: 45 },
  { name: 'Furniture', value: 30 },
  { name: 'Home Decor', value: 15 },
  { name: 'Accessories', value: 10 },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="p-6 xl:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">INTELLIGENCE</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Deep Dive Analytics & Export</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <select className="bg-transparent text-xs font-bold text-slate-700 outline-none">
              <option>This Month (Jan 2026)</option>
              <option>Last Month (Dec 2025)</option>
              <option>Q4 2025</option>
              <option>Full Year 2025</option>
            </select>
          </div>
          
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 mb-8 border-b border-slate-200 pb-1 overflow-x-auto">
        {['sales', 'inventory', 'staff', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab 
                ? 'text-blue-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab} Report
            {activeTab === tab && (
              <span className="absolute bottom-[-5px] left-0 w-full h-1 bg-blue-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CHART SECTION */}
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Bar Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={18} /> REVENUE PERFORMANCE
              </h3>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 'bold'}} />
                  <Bar dataKey="revenue" name="Actual Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="target" name="Target Goal" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">TRANSACTION LEDGER</h3>
              <div className="flex items-center bg-slate-50 rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input type="text" placeholder="Search ID..." className="bg-transparent border-none outline-none text-xs font-bold w-24" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Transaction ID</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Shop</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm font-bold text-slate-700">
                      <td className="px-8 py-4 text-blue-600">#TRX-00{830 + i}</td>
                      <td className="px-8 py-4">Jan {20 + i}, 2026</td>
                      <td className="px-8 py-4">Accra Mall Hub</td>
                      <td className="px-8 py-4">₵ {1200 + (i * 150)}</td>
                      <td className="px-8 py-4">
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black uppercase">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 text-center">
              <button className="text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                View All Records <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR SUMMARY */}
        <div className="space-y-6">
           {/* Summary Card */}
           <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Executive Summary</h4>
              <div className="space-y-6">
                <div>
                   <p className="text-3xl font-black">₵ 145,200</p>
                   <p className="text-xs font-medium text-slate-400 mt-1">Total Period Revenue</p>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between">
                   <div>
                     <p className="text-xl font-black text-emerald-400">+12%</p>
                     <p className="text-[10px] text-slate-500 uppercase">Growth</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xl font-black text-blue-400">842</p>
                     <p className="text-[10px] text-slate-500 uppercase">Orders</p>
                   </div>
                </div>
              </div>
              <button className="w-full mt-8 bg-white text-slate-900 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                 <Printer className="w-4 h-4" /> Print Summary
              </button>
           </div>

           {/* Category Breakdown */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                 <PieChart className="w-4 h-4" /> Sales Mix
              </h4>
              <div className="space-y-4">
                {categoryData.map((cat, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                       <span>{cat.name}</span>
                       <span>{cat.value}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-blue-600 h-full rounded-full" style={{ width: `${cat.value}%`, opacity: 1 - (i * 0.2) }} />
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