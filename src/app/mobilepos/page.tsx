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
          managerPhone: data.managerPhone
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
    <div className="min-h-screen bg-white px-6 pt-10 pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <UserCircle2 size={36} />
          <div>
            <p className="text-xs text-slate-400">Active Agent</p>
            <p className="font-bold">{identity?.agentName || "—"}</p>
          </div>
        </div>

        <button onClick={() => setShowSettings((v) => !v)}>
          <Settings />
        </button>
      </div>

      {/* 🏪 SHOP INFO CARD */}
      {identity && (
        <div className="bg-slate-50 p-5 rounded-3xl mb-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Assigned Unit</p>
              <h3 className="text-lg font-black text-slate-900 leading-none">{identity.shopName}</h3>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-lg shadow-slate-200/50 text-blue-600">
              <Store size={20} />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-200/60 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
              <UserCircle2 size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Manager</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900">{identity.managerName}</p>
                <span className="text-[10px] text-slate-300">•</span>
                <div className="flex items-center gap-1 text-slate-500">
                  <Phone size={10} />
                  <p className="text-[10px] font-mono font-bold">{identity.managerPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decor */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl" />
        </div>
      )}

      {/* SETTINGS */}
      {showSettings && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <DrawerButton
            icon={<MessageSquare />}
            label="HQ Messages"
            onClick={() => router.push("/mobilepos/messages")}
          />
          <DrawerButton
            icon={<CalendarDays />}
            label="Daily Report"
            onClick={() => router.push("/mobilepos/report")}
          />
        </div>
      )}

      {/* NEW: SMART ATTENDANCE */}
      {identity && mounted && (
        <div className="mb-10">
          <SmartAttendance
            shopLat={identity.shopLat}
            shopLng={identity.shopLng}
            radius={identity.radius}
            status={isLocating ? 'CLOCKED_OUT' : 'CLOCKED_OUT'} // TODO: Connect to real status
            onClockIn={async () => {
              toast.success("Shift Started");
              // TODO: Call API
            }}
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-8 opacity-50 pointer-events-none grayscale">
        <div className="flex items-center gap-2">
          {gpsStatus === "SEARCHING" && <Loader2 className="animate-spin" />}
          {gpsStatus === "ERROR" && <WifiOff className="text-red-500" />}
          {gpsStatus === "LOCKED" && <ShieldCheck className="text-green-600" />}
          <span className="text-xs font-bold uppercase">
            {gpsStatus === "SEARCHING"
              ? "Locating"
              : gpsStatus === "LOCKED"
                ? "Secure"
                : "GPS Error"}
          </span>
        </div>

        {/* LOCK */}
        <div className="w-48 h-48 rounded-full border flex items-center justify-center">
          {isLocating ? (
            <Loader2 className="animate-spin" size={48} />
          ) : inRange ? (
            <Unlock size={48} />
          ) : (
            <Lock size={48} />
          )}
        </div>

        <p className="font-mono text-sm">
          {distance !== null
            ? `${distance}m from ${identity?.shopName}`
            : "—"}
        </p>

        <button
          disabled={!inRange}
          onClick={() => router.push("/mobilepos/pos")}
          className={`w-full h-16 rounded-xl flex items-center justify-between px-6 ${inRange
            ? "bg-black text-white"
            : "bg-slate-200 text-slate-400"
            }`}
        >
          <span className="uppercase text-xs font-bold">
            {inRange ? "Start POS" : "Outside Zone"}
          </span>
          <ArrowRight />
        </button>

        {gpsStatus === "ERROR" && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-blue-600 mt-4"
          >
            <RefreshCcw size={14} />
            Retry GPS
          </button>
        )}
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
