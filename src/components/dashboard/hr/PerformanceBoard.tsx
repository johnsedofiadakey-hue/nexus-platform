"use client";

import React from "react";
import {
  TrendingUp, Users, Target, BarChart3,
  MapPin, Navigation, ArrowUpRight, Zap,
  Activity, DollarSign, Tag, ShieldAlert,
  Clock, CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid, YAxis
} from "recharts";

export default function PerformanceBoard({
  sales = [],
  dailyReports = [],
  geofenceStats = []
}: any) {

  // --- 📊 ANALYTICS ENGINE ---
  const footTraffic = dailyReports.reduce((acc: number, r: any) => acc + (r.walkIns || 0), 0);
  const inquiries = dailyReports.reduce((acc: number, r: any) => acc + (r.inquiries || 0), 0);
  const actualSales = dailyReports.reduce((acc: number, r: any) => acc + (r.buyers || 0), 0);

  const conversionRate = footTraffic > 0 ? ((actualSales / footTraffic) * 100) : 0;
  const breachesCount = geofenceStats.reduce((acc: number, g: any) => acc + (g.breaches || 0), 0);

  return (
    <div className="flex flex-col h-full bg-white font-sans selection:bg-blue-100 pb-10">

      {/* 🏛️ HEADER SECTION */}
      <div className="px-8 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Executive Performance Analytics</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Deployment Intelligence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Status</span>
            <span className="text-xs font-bold text-slate-900 uppercase">Synchronized</span>
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-blue-600">
            <BarChart3 size={20} />
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">

        {/* 📊 CORE KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-500 group-hover:scale-110 transition-transform"><Activity size={16} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Foot Traffic</span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{footTraffic.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Walk-ins Captured</p>
          </div>

          <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 hover:border-amber-200 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-amber-500 group-hover:scale-110 transition-transform"><Tag size={16} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inquiries</span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{inquiries.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Active Inquiries</p>
          </div>

          <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-emerald-500 group-hover:scale-110 transition-transform"><DollarSign size={16} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Actual Sales</span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{actualSales.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Volume Closed</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 text-blue-500/10 pointer-events-none group-hover:scale-125 transition-transform duration-700">
              <TrendingUp size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20"><Zap size={16} className="animate-pulse" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">Success Rate</span>
              </div>
              <p className="text-3xl font-black text-white tracking-tighter">{conversionRate.toFixed(1)}%</p>
              <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${conversionRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* 🛡️ SITE COMPLIANCE CHART */}
          <div className="lg:col-span-12 xl:col-span-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 group">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100"><Clock size={16} /></div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Presence Compliance</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">7-Day Signal Continuity Analysis</p>
                </div>
              </div>
              {breachesCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-100/50 border border-rose-200 rounded-full animate-bounce">
                  <ShieldAlert size={12} className="text-rose-600" />
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{breachesCount} Breaches Detected</span>
                </div>
              )}
            </div>

            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geofenceStats}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#ffffff', radius: 12 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Breach Report</p>
                            <p className="text-lg font-black text-white">{payload[0].value} <span className="text-[10px] text-slate-400 uppercase ml-1">Exits</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="breaches" radius={[12, 12, 12, 12]} barSize={40}>
                    {geofenceStats.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.breaches > 2 ? 'url(#barGradient)' : '#334155'}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 💰 RECENT TERMINAL ACTIVITY */}
          <div className="lg:col-span-12 xl:col-span-4 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100"><CreditCard size={16} /></div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Digital Ledger</h4>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                  <Navigation size={48} className="text-slate-400 mb-4 animate-pulse" />
                  <p className="text-[11px] font-black uppercase tracking-widest">Scanning Network For Traffic...</p>
                </div>
              ) : sales.slice(0, 15).map((sale: any) => (
                <div key={sale.id} className="group p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:border-blue-100 transition-colors">
                      <Activity size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-none mb-1.5">₵{sale.totalAmount.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                    <ArrowUpRight size={14} />
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