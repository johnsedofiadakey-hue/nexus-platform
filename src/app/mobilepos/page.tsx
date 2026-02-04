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
  Phone
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import SmartAttendance from "@/components/auth/SmartAttendance";

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

  /* ---------------- STATE ---------------- */
  const [mounted, setMounted] = useState(false);
  const [identity, setIdentity] = useState<{
    shopName: string;
    agentName: string;
    shopLat: number;
    shopLng: number;
    radius: number;
    managerName?: string;
    managerPhone?: string;
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
     FETCH AGENT ASSIGNMENT (SAFE)
  -------------------------------------------------- */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status !== "authenticated" || !mounted) return;

    const fetchAssignment = async () => {
      try {
        const res = await fetch("/api/mobile/init", {
          credentials: 'include' // 🍪 Fixes logic for mobile
        });
        const data = await res.json();

        if (data?.error === "Unassigned") {
          setGpsStatus("ERROR");
          setIsLocating(false);
          toast.error("No shop assigned. Contact HQ.");
          return;
        }

        if (
          !res.ok ||
          typeof data.shopLat !== "number" ||
          typeof data.shopLng !== "number"
        ) {
          throw new Error("Invalid assignment");
        }

        setIdentity({
          agentName: data.agentName || session?.user?.name || "Agent",
          shopName: data.shopName || "Hub",
          shopLat: data.shopLat,
          shopLng: data.shopLng,
          radius: data.radius || 100,
          managerName: data.managerName,
          managerPhone: data.managerPhone,
          bypassGeofence: data.bypassGeofence
        });
      } catch {
        setGpsStatus("ERROR");
        setIsLocating(false);
        toast.error("Assignment sync failed");
      }
    };

    fetchAssignment();
  }, [status, mounted, router, session]);

  /* --------------------------------------------------
     GPS ENGINE (BULLETPROOF)
  -------------------------------------------------- */
  const startTracking = useCallback(() => {
    if (!identity || !mounted || typeof window === "undefined") return;

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
        const d = calculateDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          identity.shopLat,
          identity.shopLng
        );
        setDistance(d);
        setGpsStatus("LOCKED");
        setIsLocating(false);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 15000 }
    );

    // CONTINUOUS WATCH
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const d = calculateDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          identity.shopLat,
          identity.shopLng
        );
        setDistance(d);
        setGpsStatus("LOCKED");
        setIsLocating(false);
      },
      () => {
        setGpsStatus("ERROR");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );
  }, [identity, mounted]);

  useEffect(() => {
    if (identity) startTracking();
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [identity, startTracking]);

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
    if (!identity || distance === null) return false;
    return distance <= identity.radius;
  }, [distance, identity]);

  if (!mounted || status === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{identity?.agentName || "Agent"}</h1>
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
      {identity && (
        <div className="relative group overflow-hidden rounded-[2rem] p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all duration-300">
          {/* Dynamic Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-blue-500/20 transition-all duration-700" />

          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest backdrop-blur-md text-blue-200">
                Assigned Unit
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tighter text-white">{identity.shopName}</h2>
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
              <p className="text-sm font-bold text-white">{identity.managerPhone || "N/A"}</p>
            </div>
          </div>
        </div>
      )}

      {/* NEW: SMART ATTENDANCE */}
      {identity && mounted && (
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <SmartAttendance
            shopLat={identity.shopLat}
            shopLng={identity.shopLng}
            radius={identity.radius}
            bypassGeofence={identity.bypassGeofence}
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
