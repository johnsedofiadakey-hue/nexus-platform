"use client";
import React, { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Loader2, MapPinOff } from "lucide-react";

const PROMOTER_ROLES = ["WORKER", "AGENT", "ASSISTANT", "PROMOTER"];

export default function LocationGuard({ children }: { children: React.ReactNode }) {
  const lastPulse = useRef<number>(0);
  const { status, data: session } = useSession();
  const [gpsReady, setGpsReady] = React.useState(false);
  const [gpsBlocked, setGpsBlocked] = React.useState(false);
  const [bypassEnabled, setBypassEnabled] = React.useState(false);
  const [bypassResolved, setBypassResolved] = React.useState(false);

  const role = String((session?.user as any)?.role || "");
  const isStrictPromoter = PROMOTER_ROLES.includes(role);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    const loadBypassStatus = async () => {
      try {
        const res = await fetch('/api/mobile/init', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return;
        const payload = await res.json();
        const data = payload?.data ?? payload;
        if (cancelled) return;

        const bypass = Boolean(data?.bypassGeofence);
        setBypassEnabled(bypass);
        if (bypass) {
          setGpsReady(true);
          setGpsBlocked(false);
        }
      } catch {
        // Ignore init fetch errors; GPS watcher will continue to enforce strict mode.
      } finally {
        if (!cancelled) setBypassResolved(true);
      }
    };

    loadBypassStatus();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      if (isStrictPromoter && !bypassEnabled) setGpsBlocked(true);
      return;
    }

    const isSecure = window.isSecureContext || window.location.hostname === 'localhost';
    if (!isSecure) {
      console.warn("GPS Insecure Context");
      if (isStrictPromoter && !bypassEnabled) setGpsBlocked(true);
      return;
    }

    const sendPulse = async (lat: number, lng: number, accuracy?: number) => {
      const now = Date.now();
      // Throttle: Send once every 30 seconds (Optimized)
      if (now - lastPulse.current < 30000) return;

      try {
        const res = await fetch('/api/mobile/pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // 🍪 Include auth cookies
          body: JSON.stringify({ lat, lng, accuracy })
        });

        if (res.ok) {
          lastPulse.current = now;
          setGpsReady(true);
          setGpsBlocked(false);
        } else {
          if (isStrictPromoter && !bypassEnabled) setGpsBlocked(true);
        }
      } catch (e) {
        if (isStrictPromoter && !bypassEnabled) setGpsBlocked(true);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendPulse(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => {
        if (isStrictPromoter && !bypassEnabled) setGpsBlocked(true);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        sessionStorage.setItem('nexus_gps_lat', pos.coords.latitude.toString());
        sessionStorage.setItem('nexus_gps_lng', pos.coords.longitude.toString());
        if (pos.coords.accuracy !== undefined) {
          sessionStorage.setItem('nexus_gps_accuracy', pos.coords.accuracy.toString());
        }

        sendPulse(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => {
        if (isStrictPromoter && !bypassEnabled) setGpsBlocked(true);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [status, isStrictPromoter, bypassEnabled]);

  if (status === "authenticated" && isStrictPromoter && !bypassResolved) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="max-w-sm space-y-4">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-400" />
          <h2 className="text-lg font-black uppercase tracking-wider">Checking Access</h2>
          <p className="text-sm text-slate-300">Validating your geofence permissions...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && isStrictPromoter && !gpsReady && !bypassEnabled) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="max-w-sm space-y-4">
          {gpsBlocked ? <MapPinOff className="w-10 h-10 mx-auto text-rose-400" /> : <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-400" />}
          <h2 className="text-lg font-black uppercase tracking-wider">GPS Required</h2>
          <p className="text-sm text-slate-300">
            Promoter access is strict. Turn on precise location and remain inside your assigned shop geofence to continue.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}