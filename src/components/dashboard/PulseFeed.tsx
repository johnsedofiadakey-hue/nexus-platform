"use client";

import React, { useEffect, useState } from "react";
import { Activity, Clock, MapPin, User, Package, AlertCircle, RefreshCcw } from "lucide-react";

interface PulseItem {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  items: string; // JSON string from DB
  createdAt: string;
  shop: {
    name: string;
    location: string;
  };
  user: {
    name: string;
    role: string;
  };
}

export default function PulseFeed() {
  const [pulses, setPulses] = useState<PulseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPulses = async () => {
    try {
      const response = await fetch("/api/operations/pulse-feed");
      const result = await response.json();
      
      if (result.success) {
        setPulses(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Synchronisation failure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPulses();
    const interval = setInterval(fetchPulses, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col p-6 space-y-4">
        <div className="h-4 w-1/3 bg-slate-50 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Feed Interrupted</h4>
        <p className="text-[10px] text-slate-400 mt-1 uppercase leading-relaxed">{error}</p>
        <button 
          onClick={() => { setLoading(true); fetchPulses(); }}
          className="mt-4 flex items-center gap-2 text-[9px] font-black bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors uppercase tracking-widest"
        >
          <RefreshCcw className="w-3 h-3" /> Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col overflow-hidden shadow-sm">
      {/* LEDGER HEADER */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 w-1.5 h-4 rounded-full" />
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em]">Operational Ledger</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Real-Time</span>
        </div>
      </div>

      {/* COLUMN HEADERS */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 grid grid-cols-12 gap-4">
        <span className="col-span-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Entity / Hub</span>
        <span className="col-span-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Metric</span>
        <span className="col-span-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Time</span>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
        {pulses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-300">
            <Package className="w-6 h-6 mb-2 opacity-20" />
            <span className="text-[10px] font-medium uppercase tracking-widest">No active telemetry</span>
          </div>
        ) : (
          pulses.map((pulse) => (
            <div key={pulse.id} className="px-5 py-4 hover:bg-slate-50/80 transition-colors group cursor-default">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* User & Shop Info */}
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm group-hover:border-blue-200 transition-colors">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-900 truncate">
                      {pulse.user.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                      <MapPin className="w-2.5 h-2.5" />
                      {pulse.shop.name}
                    </div>
                  </div>
                </div>

                {/* Amount / Payment */}
                <div className="col-span-3 text-right flex flex-col">
                  <span className="text-[11px] font-bold text-slate-900 tabular-nums">
                    {pulse.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">
                    {pulse.paymentMethod.replace('_', ' ')}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="col-span-3 text-right flex flex-col items-end">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 tabular-nums">
                    <Clock className="w-2.5 h-2.5 text-slate-300" />
                    {new Date(pulse.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter mt-0.5">Confirmed</span>
                </div>
              </div>

              {/* Tighter Item Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5 pl-11">
                {JSON.parse(pulse.items).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-100 rounded text-[9px] font-medium text-slate-500 shadow-sm">
                    <span className="text-blue-600 font-bold tabular-nums">{item.qty}×</span>
                    <span className="truncate max-w-[100px]">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* LEDGER FOOTER */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Nodes Active: {Array.from(new Set(pulses.map(p => p.shop.name))).length}
        </span>
        <button className="text-[9px] font-black text-slate-900 uppercase tracking-widest hover:underline decoration-blue-500 decoration-2 underline-offset-4 transition-all">
          Generate Full Report
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}