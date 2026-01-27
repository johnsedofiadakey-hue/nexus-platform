"use client";

import React, { useState, useEffect } from "react";
import { Phone, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminCallSystem() {
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    // 📡 Poll for incoming "Assistance Requests" from Shops
    const checkCalls = async () => {
      try {
        const res = await fetch("/api/operations/pulse-feed?type=ASSISTANCE_REQ");
        if (res.ok) {
          const data = await res.json();
          // If we find a pending request that isn't dismissed
          const urgent = data.find((d: any) => d.status === "PENDING");
          if (urgent) setIncomingCall(urgent);
        }
      } catch (e) {}
    };

    const interval = setInterval(checkCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResponse = async (action: 'ACCEPT' | 'IGNORE') => {
    if (!incomingCall) return;
    
    // In a real app, you'd mark it as read in the DB here
    toast(action === 'ACCEPT' ? "Connecting to Shop..." : "Request Ignored");
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4 w-80 border border-slate-700 relative overflow-hidden">
        
        {/* Pulse Effect Background */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center animate-bounce">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest">Incoming Call</h4>
            <p className="text-xs text-blue-200 font-bold">{incomingCall.shopName || "Unknown Hub"}</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 font-medium leading-relaxed border-l-2 border-blue-600 pl-3">
          "{incomingCall.message || "Manager requesting immediate assistance at the terminal."}"
        </p>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <button 
            onClick={() => handleResponse('IGNORE')}
            className="py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-[10px] uppercase hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Ignore
          </button>
          <button 
            onClick={() => handleResponse('ACCEPT')}
            className="py-3 rounded-xl bg-blue-600 text-white font-bold text-[10px] uppercase hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
          >
            <Check className="w-4 h-4" /> Connect
          </button>
        </div>
      </div>
    </div>
  );
}