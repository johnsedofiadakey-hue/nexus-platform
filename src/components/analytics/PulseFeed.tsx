"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Activity, AlertCircle, CheckCircle, Clock, Loader2, RefreshCw } from "lucide-react";

export default function PulseFeed() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);

  const fetchPulses = useCallback(async () => {
    try {
      const res = await fetch("/api/operations/pulse-feed");

      if (res.ok) {
        const data = await res.json();
        // Safe check: Ensure data is an array before setting it
        if (Array.isArray(data)) {
          setFeed(data);
          setErrorCount(0); // Reset errors on success
        }
      } else {
        // Silent fail - don't crash UI, just increment counter
        setErrorCount(prev => prev + 1);
      }
    } catch (err) {
      console.warn("Pulse Feed Sync Issue (Retrying...)", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPulses();
    const interval = setInterval(fetchPulses, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchPulses]);

  if (loading && feed.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <p className="text-xs font-black uppercase tracking-widest">Connecting Live Stream...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${errorCount > 2 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Live Operations</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {errorCount > 2 ? 'Reconnecting...' : 'Real-Time Stream'}
            </p>
          </div>
        </div>
        <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {feed.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-xs font-bold text-slate-400">No recent activity detected.</p>
          </div>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.type === 'SALE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-blue-500'
                }`} />

              <div className="flex-1">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="text-xs font-black text-slate-900 leading-tight">{item.title}</h4>
                  <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">
                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 mb-1">{item.subtitle}</p>

                {item.meta && (
                  <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                    {item.meta}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}