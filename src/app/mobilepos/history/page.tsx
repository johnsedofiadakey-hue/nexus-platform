"use client";

import React, { useState, useEffect } from "react";
import { History, Search, Calendar, ChevronRight, Loader2, ArrowLeft, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMobileTheme } from "@/context/MobileThemeContext"; // 👈 Theme Integration

// Helper for dynamic colors
const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706"
  };
  return colors[color] || colors.blue;
};

export default function MobileHistory() {
  const router = useRouter();
  const { darkMode, accent, themeClasses } = useMobileTheme();
  const accentHex = getColorHex(accent);

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Use the secure API that checks the session automatically
        const res = await fetch(`/api/sales/history?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setSales(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("History Sync Failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Filter Logic
  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate Daily Total
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${themeClasses.bg}`}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentHex }} />
        <p className={`text-xs font-bold uppercase tracking-widest ${themeClasses.text}`}>Loading History...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans pb-24 transition-colors duration-500 ${themeClasses.bg}`}>
      
      {/* HEADER */}
      <div className={`px-6 py-6 border-b sticky top-0 z-20 shadow-sm ${themeClasses.nav} ${themeClasses.border}`}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className={`p-2 rounded-full hover:opacity-70 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <ArrowLeft className={`w-5 h-5 ${themeClasses.text}`} />
          </button>
          <div>
            <h1 className={`text-xl font-black tracking-tight ${themeClasses.text}`}>Sales Log</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              My Transactions
            </p>
          </div>
        </div>

        {/* SEARCH BOX */}
        <div className="relative">
           <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
           <input 
             placeholder="Search Receipt ID..."
             className={`w-full h-12 pl-11 pr-4 rounded-xl text-xs font-bold outline-none border transition-all ${
               darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
             }`}
             style={{ focusBorderColor: accentHex }}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="p-6">
        <div 
          className="rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden"
          style={{ backgroundColor: accentHex, boxShadow: `0 20px 40px -10px ${accentHex}50` }}
        >
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2 opacity-80">
               <TrendingUp className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Total Logged</span>
             </div>
             <h2 className="text-3xl font-black tracking-tighter">₵ {totalRevenue.toLocaleString()}</h2>
             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">{sales.length} Transactions Found</p>
          </div>
          {/* Decorative Blob */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
        </div>
      </div>

      {/* LIST */}
      <div className="px-6 space-y-3">
        {filteredSales.length === 0 ? (
          <div className="text-center p-10 opacity-50">
            <History className={`w-12 h-12 mx-auto mb-2 ${themeClasses.text}`} />
            <p className={`text-xs font-bold uppercase ${themeClasses.text}`}>No history found</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div 
              key={sale.id} 
              className={`p-4 rounded-[2rem] border shadow-sm flex justify-between items-center group active:scale-95 transition-all ${themeClasses.card} ${themeClasses.border}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <Calendar className={`w-5 h-5 text-slate-400`} />
                </div>
                <div>
                  <p className={`font-black text-sm ${themeClasses.text}`}>#{sale.id.slice(-6).toUpperCase()}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {new Date(sale.createdAt).toLocaleDateString()} • {new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-black ${themeClasses.text}`}>₵{sale.totalAmount.toLocaleString()}</p>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center justify-end gap-1 ${
                    sale.paymentMethod === 'MOMO' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10'
                }`}>
                  {sale.paymentMethod || 'CASH'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}