"use client";
import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast"; // 🔔 Import Toast
import { useSession } from "next-auth/react";

export default function LocationGuard({ children }: { children: React.ReactNode }) {
  const lastPulse = useRef<number>(0);
  const { status } = useSession();

  useEffect(() => {
    // 🛑 STOP: If not logged in, don't track.
    if (status !== "authenticated") return;

    if (typeof window === 'undefined' || !navigator.geolocation) return;

    // Security Check
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost';
    if (!isSecure) {
      console.warn("GPS Insecure Context");
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
          // ✅ SUCCESS: Update Ref
          lastPulse.current = now;
        } else {
          // ❌ FAILURE: Usually 401 Unauthorized
          // Silent fail - don't spam console
        }
      } catch (e) {
        // Silent fail
      }
    };

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        // Save to storage
        sessionStorage.setItem('nexus_gps_lat', pos.coords.latitude.toString());
        sessionStorage.setItem('nexus_gps_lng', pos.coords.longitude.toString());
        if (pos.coords.accuracy !== undefined) {
          sessionStorage.setItem('nexus_gps_accuracy', pos.coords.accuracy.toString());
        }

        // 🔥 FIRE PULSE with accuracy data
        sendPulse(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => console.warn(err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [status]); // Re-run when status changes

  return <>{children}</>;
}