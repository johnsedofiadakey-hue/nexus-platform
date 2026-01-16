"use client";

import React, { useState, useEffect } from "react";
import { 
  MapPin, Wifi, Clock, ArrowRight, 
  TrendingUp, Users, ShoppingBag, 
  CheckCircle, Zap, AlertTriangle, RefreshCw
} from "lucide-react";

// --- 🎯 TARGET: MELCOM ACCRA MALL COORDINATES ---
// In a real app, this comes from the database based on the user's assigned shop.
const SHOP_LOCATION = {
  name: "Melcom Accra Mall",
  lat: 5.622600, // Latitude of Accra Mall
  lng: -0.173600, // Longitude of Accra Mall
  radius: 200 // Allowed radius in meters
};

export default function MobileHome() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  
  // GPS STATES
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  // --- 1. THE GEOLOCATION ENGINE ---
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported");
      return;
    }

    // Watch position in real-time
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        setUserLocation({ lat: userLat, lng: userLng });
        
        // Calculate Distance (Haversine Formula)
        const dist = calculateDistance(userLat, userLng, SHOP_LOCATION.lat, SHOP_LOCATION.lng);
        setDistance(Math.round(dist)); // Round to nearest meter
        setIsLocating(false);
        setGpsError(null);
      },
      (error) => {
        setGpsError("GPS Signal Lost");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // --- HELPER: CALCULATE DISTANCE (Haversine) ---
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // --- LOGIC: ARE THEY IN ZONE? ---
  // Returns TRUE only if distance is known AND within radius
  const isInZone = distance !== null && distance <= SHOP_LOCATION.radius;

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. HERO CARD: LIVE GPS STATUS */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-6 text-white shadow-2xl shadow-blue-900/20">
        <div className={`absolute inset-0 transition-colors duration-700 ${
          isOnDuty 
            ? "bg-gradient-to-bl from-emerald-600 to-teal-900" 
            : isInZone ? "bg-gradient-to-bl from-blue-600 to-indigo-900" : "bg-gradient-to-bl from-slate-600 to-slate-800"
        }`} />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className="relative z-10">
          {/* Header Status Bar */}
          <div className="flex justify-between items-start mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors ${
              isInZone ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100" : "bg-red-500/20 border-red-400/30 text-red-100"
            }`}>
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isLocating ? "Triangulating..." : isInZone ? "In Zone (Verified)" : "Out of Bounds"}
              </span>
            </div>
            
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-black/20 backdrop-blur border border-white/10`}>
              {isOnDuty ? <Wifi className="w-3 h-3 text-emerald-300 animate-pulse" /> : <Wifi className="w-3 h-3 text-slate-400" />}
              {isOnDuty ? "Live Uplink" : "Offline"}
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-1">
              {isOnDuty ? "Shift Active" : "Start Shift"}
            </h1>
            <h2 className="text-xl font-bold text-white/60 mb-4">
              {SHOP_LOCATION.name}
            </h2>

            {/* Distance Meter */}
            {!isLocating && (
              <div className="flex items-center gap-4 text-xs font-bold text-white/80">
                <div>
                   <span className="block text-[9px] uppercase opacity-50">Distance to Hub</span>
                   <span className={`text-lg ${isInZone ? "text-white" : "text-red-300"}`}>{distance}m</span>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                   <span className="block text-[9px] uppercase opacity-50">Geofence Limit</span>
                   <span className="text-lg text-white">{SHOP_LOCATION.radius}m</span>
                </div>
              </div>
            )}
            
            {/* Warning Message if Out of Zone */}
            {!isInZone && !isLocating && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                 <AlertTriangle className="w-5 h-5 text-red-300" />
                 <p className="text-[10px] font-bold text-red-100 uppercase leading-tight">
                   You must be within {SHOP_LOCATION.radius}m of the shop to clock in. Move closer.
                 </p>
              </div>
            )}
          </div>

          {/* The Clock In Button (Disabled if Out of Zone) */}
          <button 
            disabled={!isInZone}
            onClick={() => setIsOnDuty(!isOnDuty)}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all ${
              !isInZone 
                ? "bg-slate-400 text-slate-200 cursor-not-allowed" 
                : "bg-white text-slate-900"
            }`}
          >
            {isLocating ? (
               <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isOnDuty ? (
              <> <Clock className="w-4 h-4 text-red-500" /> End Shift </>
            ) : !isInZone ? (
              <> <MapPin className="w-4 h-4" /> Move Closer to Clock In </>
            ) : (
              <> <Zap className="w-4 h-4 text-blue-600 fill-blue-600" /> Verify GPS & Clock In </>
            )}
          </button>
        </div>
      </div>

      {/* 2. LIVE TARGETS (Colorful Progress) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
            <p className="text-xl font-black text-slate-900">₵ 2,400</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
               <div className="bg-blue-600 w-[45%] h-full rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-50 rounded-full group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume</p>
            <p className="text-xl font-black text-slate-900">4 Units</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
               <div className="bg-purple-600 w-[30%] h-full rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS ROW */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Quick Actions</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <button className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl whitespace-nowrap shadow-sm active:bg-slate-50">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><Users className="w-4 h-4" /></div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Log</p>
              <p className="text-xs font-black text-slate-900">Walk-In</p>
            </div>
          </button>
          <button className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl whitespace-nowrap shadow-sm active:bg-slate-50">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600"><Clock className="w-4 h-4" /></div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Request</p>
              <p className="text-xs font-black text-slate-900">Break</p>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}