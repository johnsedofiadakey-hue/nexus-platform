"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Lock,
  Unlock,
  Loader2,
  MapPin,
  WifiOff,
  ArrowRight,
  UserCircle2,
  Settings,
  MessageSquare,
  CalendarDays,
  ShieldCheck,
  RefreshCcw,
  Store,
  Phone,
  TrendingUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import SmartAttendance from "@/components/auth/SmartAttendance";
import { useMobileData } from "@/context/MobileDataContext";

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

export default function MobileGpsGate() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { identity: contextIdentity, loading: contextLoading, error: contextError, refreshData } = useMobileData();

  /* ---------------- STATE ---------------- */
  const [mounted, setMounted] = useState(false);
  const [shopData, setShopData] = useState<{
    shopLat: number;
    shopLng: number;
    radius: number;
    bypassGeofence?: boolean;
  } | null>(null);

  const [distance, setDistance] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] =
    useState<"SEARCHING" | "LOCKED" | "ERROR">("SEARCHING");
  const [isLocating, setIsLocating] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const watchId = useRef<number | null>(null);

  /* ---------------- MOUNT ---------------- */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* --------------------------------------------------
     USE CONTEXT DATA (NO SEPARATE FETCH)
  -------------------------------------------------- */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status !== "authenticated" || !mounted) return;

    // Use MobileDataContext instead of separate fetch
    if (contextError) {
      setGpsStatus("ERROR");
      setIsLocating(false);
      if (contextError === 'NO_SHOP_ASSIGNED') {
        toast.error("No shop assigned. Contact HQ.");
      } else if (contextError === 'AUTH_FAILED') {
        router.push("/auth/signin");
      } else {
        toast.error("Connection failed. Refresh to retry.");
      }
      return;
    }

    if (contextIdentity) {
      // Extract shop geo data from context
      fetch("/api/mobile/init?geo=true")
        .then(r => r.json())
        .then(data => {
          if (data.shopLat && data.shopLng) {
            setShopData({
              shopLat: data.shopLat,
              shopLng: data.shopLng,
              radius: data.radius || 100,
              bypassGeofence: data.bypassGeofence
            });
          }
        })
        .catch(() => {
          // Use defaults if geo fetch fails
          setShopData({
            shopLat: 5.6037,
            shopLng: -0.1870,
            radius: 100
          });
        });
    }
  }, [status, mounted, router, contextIdentity, contextError]);

  /* --------------------------------------------------
     GPS ENGINE (BULLETPROOF)
  -------------------------------------------------- */
  const startTracking = useCallback(() => {
    if (!shopData || !mounted || typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setGpsStatus("ERROR");
      setIsLocating(false);
      toast.error("GPS not supported on device");
      return;
    }

    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setGpsStatus("SEARCHING");
    setIsLocating(true);

    // PRIME POSITION (CRITICAL FOR MOBILE)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // 🛡️ Check GPS accuracy before accepting position
        const accuracy = pos.coords.accuracy;
        if (accuracy > 100) {
          console.warn(`GPS accuracy too low: ${accuracy.toFixed(0)}m. Waiting for better signal...`);
          toast('Waiting for better GPS signal...', { icon: '📶' });
          return; // Don't accept inaccurate positions
        }

        const d = calculateDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          shopData.shopLat,
          shopData.shopLng
        );
        setDistance(d);
        setGpsStatus("LOCKED");
        setIsLocating(false);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    // CONTINUOUS WATCH
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        // 🛡️ Validate accuracy
        const accuracy = pos.coords.accuracy;
        if (accuracy > 100) {
          console.warn(`Skipping inaccurate GPS: ±${accuracy.toFixed(0)}m`);
          return;
        }

        const d = calculateDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          shopData.shopLat,
          shopData.shopLng
        );
        setDistance(d);
        setGpsStatus("LOCKED");
        setIsLocating(false);
      },
      () => {
        setGpsStatus("ERROR");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );
  }, [shopData, mounted]);

  useEffect(() => {
    if (shopData) startTracking();
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [shopData, startTracking]);

  /* --------------------------------------------------
     FAIL-SAFE (NO INFINITE LOADING)
  -------------------------------------------------- */
  useEffect(() => {
    if (!isLocating) return;
    const timer = setTimeout(() => {
      setGpsStatus("ERROR");
      setIsLocating(false);
      toast.error("GPS timeout. Enable location & retry.");
    }, 35000);
    return () => clearTimeout(timer);
  }, [isLocating]);

  /* ---------------- GATE ---------------- */
  const inRange = useMemo(() => {
    if (!shopData || distance === null) return false;
    return distance <= shopData.radius;
  }, [distance, shopData]);

  if (!mounted || status === "loading\" || contextLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!contextIdentity || !shopData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900">
        <WifiOff className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-lg text-red-300 font-bold">Connection Failed</p>
        <button
          onClick={() => refreshData(true)}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
        >
          <RefreshCcw className="w-4 h-4 mr-2 inline" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full px-6 pt-8 pb-32 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center animate-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/30">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
              <UserCircle2 size={32} className="text-slate-400" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Welcome Back</p>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{contextIdentity?.agentName || "Agent"}</h1>
          </div>
        </div>

        <button
          onClick={() => setShowSettings((v) => !v)}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all active:scale-95 shadow-sm"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* 🏪 SHOP INFO CARD (Glassmorphism) */}
      {contextIdentity && (
        <div className="relative group overflow-hidden rounded-[2rem] p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all duration-300">
          {/* Dynamic Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-blue-500/20 transition-all duration-700" />

          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest backdrop-blur-md text-blue-200">
                Assigned Unit
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tighter text-white">{contextIdentity.shopName}</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5">
              <Store size={24} className="text-blue-300" />
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 pt-6 border-t border-white/10">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
              <Phone size={14} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manager Line</p>
              <p className="text-sm font-bold text-white">{contextIdentity.managerPhone || "N/A"}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 PERFORMANCE PROGRESS CARD */}
      {contextIdentity?.targetProgress && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Sales Targets</h3>
                <p className="text-sm font-black text-slate-900 dark:text-white">Performance Progress</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full border border-emerald-100 dark:border-emerald-900/30">
              Live Tracking
            </span>
          </div>

          <div className="space-y-4">
            {/* Sales Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales (GHS)</p>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  ₵{contextIdentity.targetProgress.achievedValue.toLocaleString()} <span className="text-slate-400">/ ₵{contextIdentity.targetProgress.targetValue.toLocaleString()}</span>
                </p>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((contextIdentity.targetProgress.achievedValue / contextIdentity.targetProgress.targetValue) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Volume Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units Sold</p>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {contextIdentity.targetProgress.achievedQuantity} <span className="text-slate-400">/ {contextIdentity.targetProgress.targetQuantity}</span>
                </p>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((contextIdentity.targetProgress.achievedQuantity / contextIdentity.targetProgress.targetQuantity) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: SMART ATTENDANCE */}
      {shopData && mounted && (
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <SmartAttendance
            shopLat={shopData.shopLat}
            shopLng={shopData.shopLng}
            radius={shopData.radius}
            bypassGeofence={shopData.bypassGeofence}
          />
        </div>
      )}

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
        <button
          onClick={() => router.push("/mobilepos/messages")}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-all text-left group hover:border-blue-500/30"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MessageSquare size={20} />
          </div>
          <p className="font-extrabold text-slate-900 dark:text-white">HQ Chat</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Direct Support Line</p>
        </button>

        <button
          onClick={() => router.push("/mobilepos/report")}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-all text-left group hover:border-emerald-500/30"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <CalendarDays size={20} />
          </div>
          <p className="font-extrabold text-slate-900 dark:text-white">Daily Report</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Submit End of Day</p>
        </button>
      </div>

      {/* GPS STATUS (Subtle) */}
      <div className="flex items-center justify-center gap-2 opacity-40 grayscale py-4">
        <div className={`w-2 h-2 rounded-full ${gpsStatus === 'LOCKED' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
        <p className="text-[10px] font-mono text-slate-400">{gpsStatus === 'LOCKED' ? `GPS LOCKED • ${distance}m` : 'SEARCHING...'}</p>
      </div>

    </div>
  );
}

/* -------------------------------------------------- */

function DrawerButton({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="border rounded-xl p-4 flex flex-col items-center gap-2"
    >
      {icon}
      <span className="text-xs font-bold uppercase">{label}</span>
    </button>
  );
}
