'use client';

import { useEffect, useState } from 'react';

export default function LocationTracker({ userId }: { userId: string }) {
  const [status, setStatus] = useState("Initializing GPS...");
  const [lastSent, setLastSent] = useState<string>("--:--");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GPS not supported");
      return;
    }

    console.log("Starting GPS Watcher for:", userId);
    setStatus("Acquiring Satellite...");

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStatus("GPS Locked. Sending...");

        try {
          const res = await fetch('/api/users/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              latitude,
              longitude,
              status: 'ACTIVE'
            })
          });

          if (res.ok) {
            setLastSent(new Date().toLocaleTimeString());
            setStatus("Live & Transmitting");
            setError(null);
          } else {
            setStatus("Server Error");
            setError("API Blocked");
          }
        } catch (err) {
          console.error("Transmission Error", err);
          setStatus("Connection Failed");
          setError("Network Error");
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        setError(err.message);
        setStatus("GPS Signal Lost");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userId]);

  // VISUAL DEBUGGER (Visible only on the phone)
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 text-white p-2 text-[10px] z-[9999] flex justify-between items-center border-t border-slate-700 font-mono">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
        <span>{status}</span>
      </div>
      <div className="text-slate-400">
        Last Sync: <span className="text-white">{lastSent}</span>
      </div>
    </div>
  );
}