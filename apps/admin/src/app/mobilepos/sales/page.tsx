"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, TrendingUp, DollarSign,
  Clock, Calendar, ChevronRight, Loader2
} from "lucide-react";
import { useMobileTheme } from "@/context/MobileThemeContext";

// 🎨 ACCENT MAP
const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706"
  };
  return colors[color] || colors.blue;
};

export default function MobileSalesLog() {
  const router = useRouter();
  const { darkMode, accent, themeClasses } = useMobileTheme();
  const accentHex = getColorHex(accent);

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. SYNC LIVE SALES HISTORY
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Calls the backend API we are about to create
        const res = await fetch(`/api/sales/history?t=${Date.now()}`);
        if (res.ok) {
          const payload = await res.json();
          const rows = payload?.data ?? payload;
          setSales(Array.isArray(rows) ? rows : []);
        }
      } catch (e) {
        console.error("History Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // 2. SEARCH & FILTERING
  const filteredSales = sales.filter(s =>
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayTotal = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeClasses.bg}`}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentHex }} />
        <p className={`mt-4 text-[10px] font-black uppercase tracking-widest ${themeClasses.text}`}>Loading Records...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans pb-32 transition-colors duration-500 ${themeClasses.bg}`}>

      {/* 🏗️ THEMED HEADER */}
      <div className={`px-6 py-6 border-b sticky top-0 z-20 shadow-sm ${themeClasses.nav} ${themeClasses.border}`}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className={`p-2 rounded-full hover:opacity-70 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <ArrowLeft className={`w-5 h-5 ${themeClasses.text}`} />
          </button>
          <h1 className={`text-xl font-black tracking-tight ${themeClasses.text}`}>Sales Log</h1>
        </div>

        {/* SEARCH BOX */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search Receipt ID..."
            className={`w-full h-12 pl-11 pr-4 rounded-xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            style={{ borderColor: darkMode ? undefined : accentHex }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 📊 PERFORMANCE SUMMARY CARD */}
      <div className="p-6">
        <div
          className="rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden active:scale-[0.98] transition-transform"
          style={{ backgroundColor: accentHex, boxShadow: `0 20px 40px -10px ${accentHex}60` }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Today's Sales</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-1">₵{todayTotal.toLocaleString()}</h2>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{sales.length} Sales Today</p>
          </div>

          {/* Abstract background shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* 📋 TRANSACTION LIST */}
      <div className="px-6 space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Recent Activity</h3>

        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              className={`p-5 rounded-[2rem] border shadow-sm flex items-center justify-between group active:scale-95 transition-all ${themeClasses.card} ${themeClasses.border}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentHex}15`, color: accentHex }}
                >
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className={`font-black text-xs ${themeClasses.text} opacity-70`}>#{sale.id.slice(-6).toUpperCase()}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <p className="text-[9px] font-bold uppercase">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <p className={`text-lg font-black ${themeClasses.text}`}>₵{sale.totalAmount.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Paid</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-40">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className={`text-xs font-black uppercase tracking-widest ${themeClasses.text}`}>No Sales Found</p>
          </div>
        )}
      </div>
    </div>
  );
}