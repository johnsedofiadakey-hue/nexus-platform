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
  geofenceStats = [] // Passed from the new Analytics Sync
}: any) {

  // --- 📈 CONVERSION INTELLIGENCE ---
  const totalWalkIns = dailyReports.reduce((acc: number, r: any) => acc + (r.walkIns || 0), 0);
  const totalBuyers = dailyReports.reduce((acc: number, r: any) => acc + (r.buyers || 0), 0);
  const conversionRate = totalWalkIns > 0 ? ((totalBuyers / totalWalkIns) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8 space-y-8 h-full flex flex-col bg-white">

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Activity Summary</span>
          <span className="text-[9px] font-bold text-blue-500 uppercase mt-0.5">Live Connection</span>
        </div>
        <BarChart3 size={18} className="text-blue-600" />
      </div>

      {/* --- KPI CARDS: FOOTFALL & CONVERSION --- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <Users size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Total Walk-ins</span>
            </div>
            <ArrowUpRight size={12} className="text-slate-300 group-hover:text-blue-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalWalkIns}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Zap size={14} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/60">Conversion</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tighter">{conversionRate}%</p>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5" />
        </div>
      </div>

      {/* --- 🛡️ GEOFENCE ANALYTICS: DRIFT PATTERN --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-rose-500" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location History (7D)</h4>
          </div>
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
            {geofenceStats.reduce((acc: number, g: any) => acc + (g.breaches || 0), 0)} Out of Area
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
                        <p className="text-[9px] font-black text-rose-500 uppercase">{payload[0].value} Left Shop Area</p>
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
                    // Visual warning: Deep red if more than 2 breaches
                    fill={entry.breaches > 2 ? '#ef4444' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* --- 💰 SALES VELOCITY --- */}
      <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Target size={14} className="text-rose-500" />
          <span className="text-[10px] font-black uppercase text-slate-400">Terminal Sales History</span>
        </div>
        <div className="space-y-3 overflow-y-auto pr-2">
          {sales.length === 0 ? (
            <div className="py-10 text-center opacity-20">
              <Navigation size={30} className="mx-auto mb-2" />
              <p className="text-[9px] font-black uppercase">Waiting for Traffic</p>
            </div>
          ) : sales.slice(0, 5).map((sale: any) => (
            <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all">
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">GH₵ {sale.totalAmount}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(sale.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-[8px] font-black px-3 py-1 bg-white rounded-lg shadow-sm uppercase border border-slate-50">{sale.paymentMethod}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}