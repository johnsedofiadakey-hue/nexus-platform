"use client";

import React from 'react';
import { Trophy, TrendingUp, Award, Target, Percent, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function PerformanceEngine() {
  // Mock Data: In production, this is a calculated view from your DB
  const performanceData = [
    { id: 1, name: "Kwame Mensah", shop: "Accra Mall", score: 94, conversion: 65, attendance: 98, revenue: 45000, trend: "up" },
    { id: 2, name: "Abena Selorm", shop: "Kumasi Hub", score: 88, conversion: 42, attendance: 100, revenue: 32000, trend: "up" },
    { id: 3, name: "John Doe", shop: "Accra Mall", score: 42, conversion: 12, attendance: 65, revenue: 8000, trend: "down" },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Trophy className="text-amber-500" /> PERFORMANCE INTELLIGENCE
          </h1>
          <p className="text-slate-500 font-medium">Data-driven staff rankings and scoring</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                LAST 30 DAYS
            </div>
        </div>
      </div>

      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {performanceData.slice(0, 3).map((staff, index) => (
          <div key={staff.id} className={`relative overflow-hidden bg-white p-6 rounded-3xl border shadow-sm ${index === 0 ? 'border-amber-200 ring-2 ring-amber-100' : 'border-slate-100'}`}>
            {index === 0 && <Award className="absolute -right-4 -top-4 w-24 h-24 text-amber-50 opacity-50" />}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${index === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                    #{index + 1}
                </div>
                {staff.trend === "up" ? <ArrowUpRight className="text-emerald-500" /> : <ArrowDownRight className="text-rose-500" />}
              </div>
              <h3 className="text-lg font-black text-slate-900">{staff.name}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase mb-4">{staff.shop}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">NEXUS SCORE</span>
                  <span className="text-blue-600">{staff.score}/100</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${staff.score}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Zap className="text-blue-600" size={20} /> LIVE LEADERBOARD
            </h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <th className="px-6 py-4">Staff Member</th>
              <th className="px-6 py-4 flex items-center gap-1"><Percent size={12}/> Conversion</th>
              <th className="px-6 py-4">Attendance</th>
              <th className="px-6 py-4">Revenue (GHS)</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {performanceData.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-5">
                  <p className="font-black text-slate-800">{staff.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{staff.shop}</p>
                </td>
                <td className="px-6 py-5">
                    <span className={`font-bold ${staff.conversion > 50 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {staff.conversion}%
                    </span>
                </td>
                <td className="px-6 py-5">
                    <span className={`font-bold ${staff.attendance < 90 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {staff.attendance}%
                    </span>
                </td>
                <td className="px-6 py-5">
                    <span className="font-mono font-bold text-slate-800">
                        {new Intl.NumberFormat().format(staff.revenue)}
                    </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-lg hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100">
                    VIEW AUDIT
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