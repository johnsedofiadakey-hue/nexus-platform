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
  RefreshCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
        const res = await fetch("/api/mobile/init");
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
          radius: data.radius || 100
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
      () => {},
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

      {/* STATUS */}
      <div className="flex flex-col items-center gap-8">
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
          className={`w-full h-16 rounded-xl flex items-center justify-between px-6 ${
            inRange
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
