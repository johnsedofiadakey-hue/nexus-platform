"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, User, MapPin, Clock, AlertCircle, RefreshCw } from "lucide-react";

export default function PulseFeed() {
  const [sales, setSales] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPulse = useCallback(async () => {
    try {
      const res = await fetch("/api/operations/pulse-feed", {
        headers: { "Accept": "application/json" }
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid Response Format (Check API path)");
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Sync Failed");
      
      setSales(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error("Pulse Sync Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 30000); // 30s refresh cycle
    return () => clearInterval(interval);
  }, [fetchPulse]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 border-l border-slate-200">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Sync Connection Lost</h3>
        <p className="text-[11px] text-slate-500 mt-2 mb-6 max-w-[200px] leading-relaxed">
          The intelligence feed is unable to reach the server.
        </p>
        <button 
          onClick={() => { setLoading(true); fetchPulse(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Feed</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {sales.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[11px] font-medium text-slate-400 italic">No transactions detected today.</p>
            </div>
          ) : (
            sales.map((sale) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 leading-none">
                      GHS {Number(sale.totalAmount).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{sale.paymentMethod}</p>
                  </div>
                </div>
                <div className="space-y-1.5 border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <MapPin className="w-3 h-3 text-slate-300" />
                    {sale.shop.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <User className="w-3 h-3 text-slate-300" />
                    {sale.user.name}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}