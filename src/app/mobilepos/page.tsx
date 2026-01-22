"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - MOBILE DASHBOARD (SHOP AWARE)
 * VERSION: 25.4.1 (FIXED PATHS & API ALIGNMENT)
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { 
  MapPin, Wifi, Clock, TrendingUp, ShoppingBag, 
  Zap, RefreshCw, Loader2, LogOut, ChevronRight, PlusCircle,
  FileText, Send, CheckCircle2, MessageSquare, ShieldAlert
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function MobileHome() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  
  // IDENTITY & KPI STATE
  const [identity, setIdentity] = useState<{ 
    agentName: string; 
    shopName: string | null;
    shopLat: number; 
    shopLng: number; 
    radius: number; 
    monthlyTargetRev: number;
    monthlyTargetVol: number;
    currentRev: number;
    currentVol: number;
  } | null>(null);

  // GPS & TELEMETRY
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  // REPORTING MODAL STATE
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportData, setReportData] = useState({
    walkIns: "",
    buyers: "", // Renamed from inquiries to match API
    marketIntel: ""
  });

  // --- 1. SYNC AGENT DATA ---
  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const res = await fetch(`/api/mobile/init?t=${Date.now()}`); 
        if (res.ok) {
          const data = await res.json();
          setIdentity(data);
        } else if(res.status === 401) {
          signOut({ callbackUrl: '/login' });
        }
      } catch (e) {
        console.error("Identity Sync Failed", e);
      }
    };
    fetchIdentity();
  }, []);

  // --- 2. GPS WATCHER ---
  useEffect(() => {
    if (!navigator.geolocation || !identity || !identity.shopLat) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });
        
        const dist = calculateDistance(userLat, userLng, identity.shopLat, identity.shopLng);
        setDistance(Math.round(dist));
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [identity]);

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // --- 3. ATTENDANCE LOGIC ---
  const handleClockAction = async () => {
    if (!identity) return;
    const newStatus = !isOnDuty;
    setIsOnDuty(newStatus); 
    try {
      // NOTE: Ensure /api/attendance endpoint exists, otherwise this will alert error
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newStatus ? 'CLOCK_IN' : 'CLOCK_OUT',
          gps: userLocation 
        })
      });
    } catch (e) {
      alert("Clocking sync failed. Check network.");
      setIsOnDuty(!newStatus);
    }
  };

  // --- 4. QUICK REPORT LOGIC ---
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      // UPDATED: Points to the unified reports API
      const res = await fetch("/api/operations/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportData({ walkIns: "", buyers: "", marketIntel: "" });
        }, 2000);
      } else {
        alert("Failed to send. Try again.");
      }
    } catch (e) {
      alert("Connection Error.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (!identity) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white text-slate-900 gap-4 z-[9999]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Establishing Nexus Link...</p>
      </div>
    );
  }

  // 🛡️ SHOP ASSIGNMENT CHECK
  const isAssigned = !!identity.shopName;
  const isInZone = distance !== null && distance <= identity.radius;
  const revPercent = identity.monthlyTargetRev > 0 ? Math.min(100, (identity.currentRev / identity.monthlyTargetRev) * 100) : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 bg-slate-50 min-h-screen">
      
      {/* 👤 GREETING SECTION */}
      <div className="flex justify-between items-start mb-6 px-4 pt-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Hello, {identity.agentName.split(' ')[0]}</h1>
          {isAssigned ? (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
               <Wifi className="w-3 h-3 text-emerald-500" /> {identity.shopName}
            </p>
          ) : (
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1 mt-1 animate-pulse">
               <ShieldAlert className="w-3 h-3" /> Unassigned / Roaming
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {/* UPDATED LINK: Messages */}
          <Link href="/mobilepos/messages" className="p-2.5 bg-white border border-slate-200 rounded-2xl text-blue-600 shadow-sm relative active:scale-95 transition-transform">
             <MessageSquare className="w-4 h-4" />
             <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 shadow-sm active:scale-95 transition-transform">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🚀 PRIMARY SHIFT CARD */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/10 min-h-[300px] flex flex-col justify-between mx-4 transition-all">
        <div className={`absolute inset-0 transition-colors duration-1000 ${
          !isAssigned ? "bg-slate-800" : isOnDuty ? "bg-slate-900" : isInZone ? "bg-gradient-to-br from-blue-600 to-indigo-800" : "bg-gradient-to-br from-slate-400 to-slate-600"
        }`} />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            {isAssigned ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest ${isInZone ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                <MapPin className="w-3 h-3" />
                {isLocating ? "Syncing GPS..." : isInZone ? "Inside Zone" : "Outside Zone"}
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] font-black uppercase tracking-widest">
                ⚠ No Shop Link
              </div>
            )}
            
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-80">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnDuty ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
              {isOnDuty ? "Shift Active" : "Duty Off"}
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-black tracking-tighter mb-1">
              {isAssigned ? (isOnDuty ? "Live Now" : "Clock In") : "Standby"}
            </h2>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
              {isAssigned ? (distance !== null ? `${distance}m to Assigned Hub` : "Acquiring Coordinates...") : "Contact HQ for Assignment"}
            </p>
          </div>

          {isAssigned ? (
            <button disabled={!isInZone && !isOnDuty} onClick={handleClockAction} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${!isInZone && !isOnDuty ? "bg-white/10 text-white/40 border border-white/10" : "bg-white text-slate-900"}`}>
              {isLocating ? <RefreshCw className="w-4 h-4 animate-spin" /> : isOnDuty ? <><Clock className="w-4 h-4 text-red-500" /> Terminate Shift</> : <><Zap className="w-4 h-4 text-blue-600 fill-blue-600" /> Verify & Start Shift</>}
            </button>
          ) : (
            <Link href="/mobilepos/messages" className="w-full py-5 rounded-2xl bg-white text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95">
               <MessageSquare className="w-4 h-4 text-blue-600" /> Request Assignment
            </Link>
          )}
        </div>
      </div>

      {/* 📊 KPI PERFORMANCE (HIDDEN IF UNASSIGNED) */}
      {isAssigned && (
        <div className="grid grid-cols-2 gap-4 mt-6 px-4">
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
               <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><TrendingUp className="w-4 h-4" /></div>
               <span className="text-[10px] font-black text-slate-400">{Math.round(revPercent)}%</span>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
            <p className="text-lg font-black text-slate-900">₵ {identity.currentRev.toLocaleString()}</p>
            <div className="w-full bg-slate-50 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${revPercent}%` }} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
               <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><ShoppingBag className="w-4 h-4" /></div>
               <span className="text-[10px] font-black text-slate-400">{identity.currentVol}u</span>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume</p>
            <p className="text-lg font-black text-slate-900">{identity.currentVol} Sold</p>
            <div className="w-full bg-slate-50 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${(identity.currentVol / (identity.monthlyTargetVol || 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ⚡ OPERATIONAL ACTIONS */}
      {isAssigned && (
        <div className="space-y-3 pt-6 px-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Field Intelligence</h3>
          
          <button 
            onClick={() => setShowReportModal(true)}
            className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm active:bg-slate-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><FileText className="w-5 h-5" /></div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-900">Quick Report</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Log Activity / Notes</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          {/* UPDATED LINK: POS */}
          <Link href="/mobilepos/pos" className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm active:bg-slate-50 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><PlusCircle className="w-5 h-5" /></div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-900">Create Sale</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Instant Transaction</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
        </div>
      )}

      {/* 📋 ACTIVITY REPORT MODAL (Quick View) */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            {reportSuccess ? (
              <div className="py-12 text-center animate-in zoom-in">
                 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Intelligence Synced</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase mt-2 tracking-widest">Admin portal updated</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black text-slate-900">Field Report</h3>
                  <button type="button" onClick={() => setShowReportModal(false)} className="text-[10px] font-black uppercase text-slate-400">Cancel</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Walk-ins</label>
                    <input type="number" required placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-center text-slate-900 outline-none focus:ring-2 focus:ring-blue-100" value={reportData.walkIns} onChange={e => setReportData({...reportData, walkIns: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Buyers</label>
                    <input type="number" required placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-center text-slate-900 outline-none focus:ring-2 focus:ring-blue-100" value={reportData.buyers} onChange={e => setReportData({...reportData, buyers: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Market Intel / Notes</label>
                  <textarea placeholder="Observation, competitor info, or customer feedback..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-blue-100 resize-none" value={reportData.marketIntel} onChange={e => setReportData({...reportData, marketIntel: e.target.value})} />
                </div>

                <button disabled={isSubmittingReport} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                  {isSubmittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Dispatch to Admin</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}