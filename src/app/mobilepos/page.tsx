"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock,
  Unlock,
  Loader2,
  Store,
  MapPin,
  Wifi,
  WifiOff,
  ArrowRight,
  UserCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

/* --------------------------------------------------
   DISTANCE ENGINE (HAVERSINE)
-------------------------------------------------- */
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* --------------------------------------------------
   PERMISSION CHECK
-------------------------------------------------- */
const checkGpsPermission = async (): Promise<boolean> => {
  if (!navigator.permissions) return true; 

  try {
    const status = await navigator.permissions.query({
      name: "geolocation" as PermissionName
    });

    if (status.state === "denied") {
      toast.error("Location denied. Enable GPS permissions.");
      return false;
    }
    return true;
  } catch {
    return true;
  }
};

export default function MobileGpsGate() {
  const router = useRouter();

  /* --------------------------------------------------
     STATE
  -------------------------------------------------- */
  const [identity, setIdentity] = useState<{
    shopName: string;
    agentName: string;
    shopLat: number;
    shopLng: number;
  } | null>(null);

  const [distance, setDistance] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"SEARCHING" | "LOCKED" | "ERROR">("SEARCHING");
  const [isLocating, setIsLocating] = useState(true);
  const watchId = useRef<number | null>(null);
  const MAX_DISTANCE = 200; // Meters

  /* --------------------------------------------------
     FETCH IDENTITY
  -------------------------------------------------- */
  useEffect(() => {
    fetch("/api/mobile/init")
      .then((r) => r.json())
      .then((data) => {
        if (!data.shopLat || !data.shopLng) {
          setGpsStatus("ERROR");
          setIsLocating(false);
          return;
        }
        setIdentity({
          agentName: data.agentName,
          shopName: data.shopName,
          shopLat: data.shopLat,
          shopLng: data.shopLng
        });
      })
      .catch(() => {
        setGpsStatus("ERROR");
        setIsLocating(false);
      });
  }, []);

  /* --------------------------------------------------
     GPS TRACKING ENGINE
  -------------------------------------------------- */
  const startTracking = useCallback(async () => {
    if (!identity) return;
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
        setGpsStatus("ERROR");
        setIsLocating(false);
        toast.error("Security Risk: HTTPS Required");
        return;
    }

    const allowed = await checkGpsPermission();
    if (!allowed) {
      setGpsStatus("ERROR");
      setIsLocating(false);
      return;
    }

    setGpsStatus("SEARCHING");
    setIsLocating(true);

    // 1. FAST LOCK
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, identity.shopLat, identity.shopLng);
        setDistance(d);
      },
      (err) => console.warn("Quick GPS failed:", err.message),
      { enableHighAccuracy: false, timeout: 5000 }
    );

    // 2. CONTINUOUS WATCHER
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, identity.shopLat, identity.shopLng);
        setDistance(d);
        setGpsStatus("LOCKED");
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS Warning:", err.message);
        setGpsStatus("ERROR");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  }, [identity]);

  useEffect(() => {
    if (identity) startTracking();
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
  }, [identity, startTracking]);

  const inRange = distance !== null && distance <= MAX_DISTANCE;

  /* --------------------------------------------------
     UI RENDERING
  -------------------------------------------------- */
  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 pb-32 relative overflow-hidden font-sans selection:bg-indigo-100">
      
      {/* 🔮 BACKGROUND BLOBS */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-emerald-400/20 rounded-full blur-[80px]" />

      <div className="relative z-10 px-6 pt-6 flex flex-col h-full min-h-screen">
        
        {/* --- 1. DYNAMIC STATUS PILL (The "Background Refresh" Fix) --- */}
        <div className="flex justify-center mb-8">
          <div className={`
             flex items-center gap-3 px-5 py-2.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-500
             ${gpsStatus === "LOCKED" ? "bg-white/80 border-slate-200 text-slate-600" : "bg-slate-900 border-slate-800 text-white"}
          `}>
             {gpsStatus === "SEARCHING" ? (
                <>
                  <Loader2 size={14} className="animate-spin text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Acquiring Satellites...</span>
                </>
             ) : gpsStatus === "ERROR" ? (
                <>
                  <WifiOff size={14} className="text-rose-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Signal Lost</span>
                </>
             ) : (
                <>
                  <div className="relative">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                    <Wifi size={14} className="relative text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">GPS Locked • High Accuracy</span>
                </>
             )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-6">
            
            {/* --- 2. IDENTITY CARD (Glassmorphism) --- */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-6 rounded-[2rem] shadow-xl shadow-indigo-100/50 flex items-center gap-5">
               <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Store size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Current Assignment</p>
                  <h2 className="text-xl font-black text-slate-800 leading-tight">{identity?.shopName || "Identifying..."}</h2>
                  <div className="flex items-center gap-2 mt-1">
                     <UserCircle2 size={12} className="text-slate-400" />
                     <span className="text-xs font-bold text-slate-500">{identity?.agentName}</span>
                  </div>
               </div>
            </div>

            {/* --- 3. THE GATE (Main Interactive Element) --- */}
            <div className={`
               relative w-full aspect-square max-h-[380px] rounded-[3rem] flex flex-col items-center justify-center transition-all duration-700 ease-out
               ${inRange 
                 ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.5)] scale-100" 
                 : "bg-white border border-slate-200 shadow-xl scale-95 grayscale"}
            `}>
               {/* Pulse Ring */}
               {isLocating && <div className="absolute inset-0 rounded-[3rem] border-4 border-blue-400/30 animate-ping" />}

               <div className={`
                  w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500
                  ${inRange ? "bg-white text-emerald-500 rotate-0" : "bg-slate-100 text-slate-400 rotate-12"}
               `}>
                  {isLocating ? <Loader2 size={40} className="animate-spin text-blue-500" /> : 
                   inRange ? <Unlock size={40} strokeWidth={2.5} /> : <Lock size={40} strokeWidth={2.5} />}
               </div>

               <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${inRange ? "text-white" : "text-slate-400"}`}>
                  {isLocating ? "Triangulating" : inRange ? "Access Granted" : "Restricted Zone"}
               </h3>
               
               <div className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md ${inRange ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <MapPin size={14} />
                  <span className="font-mono font-bold text-sm tracking-wide">
                     {distance !== null ? `${distance}m away` : "---"}
                  </span>
               </div>
            </div>

            {/* --- 4. ACTION BUTTON (Physical Feel) --- */}
            <button
               disabled={!inRange}
               onClick={() => router.push("/mobilepos/pos")}
               className={`
                  w-full h-20 rounded-[2rem] flex items-center justify-between px-8 transition-all duration-300 transform
                  ${inRange 
                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/40 hover:scale-[1.02] active:scale-[0.98]" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-80"}
               `}
            >
               <span className="text-sm font-black uppercase tracking-widest">Enter Terminal</span>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${inRange ? "bg-white text-slate-900" : "bg-slate-300 text-slate-500"}`}>
                  <ArrowRight size={20} strokeWidth={3} />
               </div>
            </button>

        </div>
      </div>
    </div>
  );
}