"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, Users, Map as MapIcon, Loader2, ArrowUpRight } from "lucide-react";
import PulseFeed from "@/components/dashboard/PulseFeed";

const OperationsMap = dynamic(
  () => import("@/components/dashboard/OperationsMap"),
  { ssr: false, loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Acquiring Node Data...</span>
    </div>
  )}
);

export default function DashboardPage() {
  const [stats, setStats] = useState({ revenue: 0, staff: 0, shops: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/operations/map-data");
        const data = await res.json();
        const totalRev = data.reduce((acc: number, curr: any) => acc + curr.sales, 0);
        const totalStaff = data.reduce((acc: number, curr: any) => acc + curr.staffCount, 0);
        setStats({ revenue: totalRev, staff: totalStaff, shops: data.length });
      } catch (e) {
        console.error("Stats sync error");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Revenue", value: `GHS ${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", trend: "+12.5%" },
          { label: "Active Staff", value: `${stats.staff} Personnel`, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Live" },
          { label: "Regional Nodes", value: `${stats.shops} Locations`, icon: MapIcon, color: "text-amber-600", bg: "bg-amber-50", trend: "Stable" }
        ].map((card, i) => (
          <div key={i} className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-3 h-3" />
                {card.trend}
              </span>
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{card.label}</h3>
            {loading ? (
              <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <p className="text-3xl font-black text-slate-800 tracking-tighter">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* OPERATIONS CENTER: MAP + PULSE */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[700px]">
        {/* Map Container */}
        <div className="flex-[3] relative border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50">
          <div className="absolute top-6 left-6 z-10">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-4">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" />
              <div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Active Grid</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Real-time Telemetry</p>
              </div>
            </div>
          </div>
          <OperationsMap />
        </div>

        {/* Pulse Feed Container */}
        <div className="flex-1 w-full lg:w-[400px]">
          <PulseFeed />
        </div>
      </div>
    </div>
  );
}