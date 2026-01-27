"use client";
import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast"; // 🔔 Import Toast

export default function LocationGuard({ children }: { children: React.ReactNode }) {
  const lastPulse = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    // Security Check
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost';
    if (!isSecure) {
       console.warn("GPS Insecure Context");
       return;
    }

    const sendPulse = async (lat: number, lng: number) => {
      const now = Date.now();
      // Throttle: Send once every 15 seconds (made it faster for testing)
      if (now - lastPulse.current < 15000) return; 

      try {
        const res = await fetch('/api/mobile/pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });

        if (res.ok) {
           // ✅ SUCCESS: Update Ref
           lastPulse.current = now;
           // 🔔 DEBUG: Show user it worked (Remove this line later)
           console.log("💓 Pulse Sent"); 
        } else {
           // ❌ FAILURE: Usually 401 Unauthorized
           console.error("Pulse Rejected (401)");
        }
      } catch (e) {
        console.error("Pulse Network Error");
      }
    };

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        // Save to storage
        sessionStorage.setItem('nexus_gps_lat', pos.coords.latitude.toString());
        sessionStorage.setItem('nexus_gps_lng', pos.coords.longitude.toString());
        
        // 🔥 FIRE PULSE
        sendPulse(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.warn(err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return <>{children}</>;
}