"use client";

import React from "react";
import {
  TrendingUp, Users, Target, BarChart3,
  MapPin, Navigation, ArrowUpRight, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid
} from "recharts";

export default function PerformanceBoard({
  sales = [],
  dailyReports = [],
  geofenceStats = []
}: any) {

  // --- 📈 PERFORMANCE INTELLIGENCE ---
  const footTraffic = dailyReports.reduce((acc: number, r: any) => acc + (r.walkIns || 0), 0);
  const curiosity = dailyReports.reduce((acc: number, r: any) => acc + (r.inquiries || 0), 0);
  const successCount = dailyReports.reduce((acc: number, r: any) => acc + (r.buyers || 0), 0);
  const successRate = footTraffic > 0 ? ((successCount / footTraffic) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8 space-y-8 h-full flex flex-col bg-white">

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Performance Overview</span>
          <span className="text-[9px] font-bold text-blue-500 uppercase mt-0.5">Live Operational Intelligence</span>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <BarChart3 size={18} className="text-blue-600" />
        </div>
      </div>

      {/* --- KPI GRID: FOOT TRAFFIC, CURIOSITY & SUCCESS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Users size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Foot Traffic</span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{footTraffic}</p>
        </div>

        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-500">
              <ArrowUpRight size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Customer Inquiries</span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{curiosity}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Zap size={14} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/60">Success Rate</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tighter">{successRate}%</p>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 w-20 h-20 text-white/10" />
        </div>
      </div>

      {/* --- 🛡️ PUNCTUALITY ANALYTICS --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-rose-500" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Site Punctuality (7D)</h4>
          </div>
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            {geofenceStats.reduce((acc: number, g: any) => acc + (g.breaches || 0), 0)} Signal Disruptions
          </span>
        </div>

        <div className="h-[180px] w-full bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={geofenceStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 animate-in zoom-in">
                        <p className="text-[9px] font-black text-rose-500 uppercase">{payload[0].value} Area Exits Detected</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="breaches" radius={[8, 8, 8, 8]} barSize={24}>
                {geofenceStats.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.breaches > 2 ? '#ef4444' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* --- 💰 RECENT SALES FEED --- */}
      <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Target size={14} className="text-blue-500" />
          <span className="text-[10px] font-black uppercase text-slate-400">Recent Terminal Activity</span>
        </div>
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {sales.length === 0 ? (
            <div className="py-16 text-center opacity-20">
              <Navigation size={30} className="mx-auto mb-2" />
              <p className="text-[9px] font-black uppercase">Scanning Network Traffic...</p>
            </div>
          ) : sales.slice(0, 10).map((sale: any) => (
            <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50/30 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <Zap size={12} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">GH₵ {sale.totalAmount.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(sale.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="text-[8px] font-black px-3 py-1 bg-white rounded-lg shadow-sm uppercase border border-slate-100 text-slate-500 group-hover:text-blue-600 transition-colors">{sale.paymentMethod}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}