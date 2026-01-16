"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { TrendingUp, Filter, Download, Maximize2 } from "lucide-react";

export default function SalesAnalysis() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data tailored for LG Ghana context if API is pending
  const mockData = [
    { hub: "Accra Mall", category: "OLED TV", sales: 85000, color: "#2563eb" },
    { hub: "Accra Mall", category: "Appliances", sales: 42000, color: "#3b82f6" },
    { hub: "Kumasi Mall", category: "OLED TV", sales: 32000, color: "#0f172a" },
    { hub: "Kumasi Mall", category: "Appliances", sales: 58000, color: "#1e293b" },
    { hub: "Palace", category: "AC Units", sales: 21000, color: "#64748b" },
  ];

  useEffect(() => {
    // In production, fetch from /api/analytics/sales-mix
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Regional Sales Mix</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Performance by Hub & Category</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-md transition-colors">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-md transition-colors">
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* CHART AREA */}
      <div className="flex-1 p-6 min-h-[300px]">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregating Data...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                hide 
              />
              <YAxis 
                dataKey="hub" 
                type="category" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b', textAnchor: 'end' }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{payload[0].payload.category}</p>
                        <p className="text-sm font-black text-white tabular-nums">GHS {payload[0].value?.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* SUMMARY LEGEND */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Hub</p>
          <p className="text-xs font-black text-slate-900">Accra Mall</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Highest SKU</p>
          <p className="text-xs font-black text-blue-600">OLED 65" C3</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Grid Health</p>
          <p className="text-xs font-black text-emerald-500">OPTIMAL</p>
        </div>
      </div>
    </div>
  );
}