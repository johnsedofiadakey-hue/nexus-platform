"use client";

import React, { useState, useEffect } from "react";
import { 
  MapPin, Wifi, Clock, TrendingUp, Users, ShoppingBag, 
  Zap, AlertTriangle, RefreshCw, Loader2, LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function MobileHome() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  
  // IDENTITY STATE
  const [identity, setIdentity] = useState<{ 
    agentName: string; 
    shopName: string; 
    shopLat: number; 
    shopLng: number; 
    radius: number; 
    monthlyTargetRev: number;
    monthlyTargetVol: number;
    currentRev: number;
    currentVol: number;
  } | null>(null);

  // GPS STATES
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  // --- 1. FETCH IDENTITY FROM NEW ENDPOINT ---
  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        // ✅ CHANGED: Now pointing to the dedicated mobile init API
        const res = await fetch("/api/mobile/init?t=" + Date.now()); 
        
        if (res.ok) {
          const data = await res.json();
          setIdentity(data);
        } else {
          if(res.status === 401) signOut({ callbackUrl: '/login' });
        }
      } catch (e) {
        console.error("Failed to load identity", e);
      }
    };
    fetchIdentity();
  }, []);

  // --- 2. GPS ENGINE ---
  useEffect(() => {
    if (!navigator.geolocation || !identity) {
      if(identity) setGpsError("GPS not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });
        
        // Calc Distance
        const dist = calculateDistance(userLat, userLng, identity.shopLat, identity.shopLng);
        setDistance(Math.round(dist));
        setIsLocating(false);
        setGpsError(null);

        // Live Telemetry
        try {
           await fetch('/api/user/location', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ lat: userLat, lng: userLng })
           });
        } catch(e) {}
      },
      (error) => {
        setGpsError("GPS Signal Lost");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [identity]);

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const handleClockAction = async () => {
    if (!identity) return;
    const newStatus = !isOnDuty;
    setIsOnDuty(newStatus); 
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newStatus ? 'CLOCK_IN' : 'CLOCK_OUT',
          gps: userLocation 
        })
      });
    } catch (e) {
      alert("Network Error");
      setIsOnDuty(!newStatus);
    }
  };

  if (!identity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-bold uppercase tracking-widest">Initializing Field App...</p>
      </div>
    );
  }

  const isInZone = distance !== null && distance <= identity.radius;
  const revPercent = identity.monthlyTargetRev > 0 ? Math.min(100, (identity.currentRev / identity.monthlyTargetRev) * 100) : 0;
  const volPercent = identity.monthlyTargetVol > 0 ? Math.min(100, (identity.currentVol / identity.monthlyTargetVol) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 p-6 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2">
         <div>
           <h1 className="text-2xl font-black text-slate-900">Nexus Mobile</h1>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Agent: {identity.agentName}</p>
         </div>
         <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100">
           <LogOut className="w-5 h-5" />
         </button>
      </div>

      {/* HERO CARD */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-6 text-white shadow-2xl shadow-blue-900/20">
        <div className={`absolute inset-0 transition-colors duration-700 ${
          isOnDuty ? "bg-gradient-to-bl from-emerald-600 to-teal-900" : isInZone ? "bg-gradient-to-bl from-blue-600 to-indigo-900" : "bg-gradient-to-bl from-slate-600 to-slate-800"
        }`} />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors ${isInZone ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100" : "bg-red-500/20 border-red-400/30 text-red-100"}`}>
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">{isLocating ? "GPS..." : isInZone ? "In Zone" : "Out of Range"}</span>
            </div>
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-black/20 backdrop-blur border border-white/10`}>
              {isOnDuty ? <Wifi className="w-3 h-3 text-emerald-300 animate-pulse" /> : <Wifi className="w-3 h-3 text-slate-400" />}
              {isOnDuty ? "Live" : "Offline"}
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-1">{isOnDuty ? "Shift Active" : "Start Shift"}</h1>
            <h2 className="text-xl font-bold text-white/60 mb-4">{identity.shopName}</h2>
            {!isLocating && (
              <div className="flex items-center gap-4 text-xs font-bold text-white/80">
                <div><span className="block text-[9px] uppercase opacity-50">Distance</span><span className={`text-lg ${isInZone ? "text-white" : "text-red-300"}`}>{distance}m</span></div>
                <div className="h-8 w-px bg-white/20" />
                <div><span className="block text-[9px] uppercase opacity-50">Limit</span><span className="text-lg text-white">{identity.radius}m</span></div>
              </div>
            )}
          </div>

          <button disabled={!isInZone} onClick={handleClockAction} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all ${!isInZone ? "bg-slate-400 text-slate-200 cursor-not-allowed" : "bg-white text-slate-900"}`}>
            {isLocating ? <RefreshCw className="w-4 h-4 animate-spin" /> : isOnDuty ? <> <Clock className="w-4 h-4 text-red-500" /> End Shift </> : !isInZone ? <> <MapPin className="w-4 h-4" /> Go to Shop </> : <> <Zap className="w-4 h-4 text-blue-600 fill-blue-600" /> Verify GPS & Clock In </>}
          </button>
        </div>
      </div>

      {/* TARGETS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3"><TrendingUp className="w-5 h-5" /></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
            <p className="text-xl font-black text-slate-900">₵ {identity.currentRev.toLocaleString()}</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className={`bg-blue-600 h-full rounded-full`} style={{ width: `${revPercent}%` }} /></div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3"><ShoppingBag className="w-5 h-5" /></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume</p>
            <p className="text-xl font-black text-slate-900">{identity.currentVol} Units</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className={`bg-purple-600 h-full rounded-full`} style={{ width: `${volPercent}%` }} /></div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        <Link href="/mobile/sales" className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl whitespace-nowrap shadow-sm active:bg-slate-50">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><Users className="w-4 h-4" /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase">Make Sale</p><p className="text-xs font-black text-slate-900">Open POS</p></div>
        </Link>
        <button className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl whitespace-nowrap shadow-sm active:bg-slate-50">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600"><Clock className="w-4 h-4" /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase">Request</p><p className="text-xs font-black text-slate-900">Leave</p></div>
        </button>
      </div>
    </div>
  );
}