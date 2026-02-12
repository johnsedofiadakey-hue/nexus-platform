"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users, TrendingUp, ShoppingBag, Store,
  Activity, Target, Loader2, RefreshCw,
  ChevronRight, ArrowUpRight, BarChart3, PieChart
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

// Components
import LivePulseFeed from "@/components/dashboard/LivePulseFeed";
import ActivityLogWidget from "@/components/dashboard/ActivityLogWidget";
import AdminTargetWidget from "@/components/dashboard/AdminTargetWidget";
import LiveSalesWidget from "@/components/dashboard/LiveSalesWidget";
import TopPerformersWidget from "@/components/dashboard/TopPerformersWidget";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Stats State
  const [stats, setStats] = useState({
    onlineAgents: 0,
    offlineAgents: 0,
    totalPromoters: 0,
    totalSales: 0,
    totalTransactions: 0,
    activeShops: 0,
    topPerformers: []
  });
  const [pulseData, setPulseData] = useState([]);
  const [adminTarget, setAdminTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, pulseRes, targetsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/operations/pulse-feed'),
        fetch('/api/targets?targetType=ADMIN')
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (pulseRes.ok) {
        setPulseData(await pulseRes.json());
      }

      if (targetsRes.ok) {
        const targets = await targetsRes.json();
        setAdminTarget(targets[0] || null);
      }
    } catch (e) {
      console.error("Dashboard Sync Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [session, status, router]);

  if (status === "loading" || (loading && !stats.totalPromoters)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
          Synchronizing Nexus Hub...
        </p>
      </div>
    );
  }

  // Map stats to teamPerformance for AdminTargetWidget
  const teamPerformance = {
    totalSales: stats.totalSales,
    totalQuantity: stats.totalTransactions, // Use txn count as volume for now
    activeAgents: stats.onlineAgents
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

      {/* MISSION CONTROL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="text-blue-600" /> Administrative Command
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live System Telemetry
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Session</p>
            <p className="text-xs font-bold text-slate-900">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
          >
            <RefreshCw size={16} className={`text-slate-400 group-hover:text-blue-600 transition-colors ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* QUICK STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Daily Sales"
          value={stats.totalTransactions}
          subValue={`₵${stats.totalSales.toLocaleString()}`}
          icon={ShoppingBag}
          color="text-blue-600"
          bg="bg-blue-50"
          trend="+12.5%"
          link="/dashboard/sales"
        />
        <StatCard
          label="Promoter Roster"
          value={stats.totalPromoters}
          subValue={`${stats.onlineAgents} Active / ${stats.offlineAgents} Inactive`}
          icon={Users}
          color="text-emerald-600"
          bg="bg-emerald-50"
          trend="Live"
          link="/dashboard/agents"
        />
        <StatCard
          label="Hub Coverage"
          value={stats.activeShops}
          icon={Store}
          color="text-indigo-600"
          bg="bg-indigo-50"
          trend="Active"
          link="/dashboard/shops"
        />
        <StatCard
          label="Field Health"
          value="98.2%"
          icon={Activity}
          color="text-rose-600"
          bg="bg-rose-50"
          trend="Stable"
        />
      </div>

      {/* MISSION CRITICAL GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* LEFT COLL: TARGETS & ANALYTICS */}
        <div className="xl:col-span-2 space-y-8">
          <div className="rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl">
            <AdminTargetWidget
              adminTarget={adminTarget}
              teamPerformance={teamPerformance}
              onRefresh={fetchData}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LIVE SALES LIST (NEW) */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden h-[500px]">
              <LiveSalesWidget />
            </div>

            {/* TOP PERFORMERS (NEW) */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden h-[500px]">
              <TopPerformersWidget performers={stats.topPerformers} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* RECENT ACTIVITY */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden h-[500px]">
              <ActivityLogWidget />
            </div>

            {/* LIVE PULSE */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden h-[500px]">
              <LivePulseFeed data={pulseData} />
            </div>
          </div>
        </div>

        {/* RIGHT COLL: SYSTEM NOTICES & QUICK LINKS */}
        <div className="space-y-8">
          {/* QUICK LINK PANEL */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 h-full opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={160} />
            </div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Target className="text-blue-400" /> Fast Tracks
            </h3>
            <div className="space-y-3">
              <QuickLink href="/dashboard/sales" label="Sales Register" icon={ShoppingBag} />
              <QuickLink href="/dashboard/hr" label="Personnel Management" icon={Users} />
              <QuickLink href="/dashboard/map" label="Sentinel Radar" icon={Activity} />
              <QuickLink href="/dashboard/inventory" label="Inventory Control" icon={Store} />
            </div>
          </div>

          {/* SYSTEM HEALTH */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Environment Health</h3>
            <div className="space-y-6">
              <HealthBar label="API Response" value={95} color="bg-emerald-500" />
              <HealthBar label="Database Latency" value={92} color="bg-blue-500" />
              <HealthBar label="Field Sync Rate" value={88} color="bg-indigo-500" />
            </div>
          </div>

          {/* ANALYTICS PREVIEW */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Revenue Mix</h3>
              <PieChart size={14} className="text-slate-300" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-600">Mobile Hubs</span>
                </div>
                <span className="text-xs font-black text-slate-900">62%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">Roaming</span>
                </div>
                <span className="text-xs font-black text-slate-900">28%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Direct Delivery</span>
                </div>
                <span className="text-xs font-black text-slate-900">10%</span>
              </div>
            </div>
            <button className="w-full mt-6 py-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <BarChart3 size={12} /> Full Reports
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, color, bg, trend, link }: any) {
  const Content = (
    <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          {link && <ArrowUpRight size={20} className="text-slate-200 group-hover:text-blue-400 transition-colors" />}
        </div>
        {subValue && (
          <p className="text-[10px] font-bold text-slate-500 mt-2">{subValue}</p>
        )}
      </div>
    </div>
  );

  return link ? <Link href={link}>{Content}</Link> : Content;
}

function QuickLink({ href, label, icon: Icon }: any) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-blue-400" />
        <span className="text-sm font-bold">{label}</span>
      </div>
      <ChevronRight size={14} className="text-white/30 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

function HealthBar({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-900">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}