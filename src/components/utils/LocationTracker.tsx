"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - SATELLITE LOCATION TRACKER
 * VERSION: 5.0.0 (STABLE / TIMEOUT FIX / BATTERY OPTIMIZED)
 * --------------------------------------------------------------------------
 * Handles real-time GPS telemetry ingestion from the operative's device.
 * Syncs coordinates to the central database for HUD visualization.
 * --------------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

interface LocationConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

// ⚙️ OPTIMIZED SATELLITE CONFIGURATION
// relaxed constraints to prevent "Code 3" Timeouts
const GPS_CONFIG: LocationConfig = {
  enableHighAccuracy: true, // Request best possible accuracy
  timeout: 45000,           // Wait 45s before throwing Code 3 (Fixes timeout error)
  maximumAge: 30000,        // Accept positions up to 30s old (Prevents lag)
};

export default function LocationTracker() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<string>("Initializing Satellite Link...");
  const watchId = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isTransmitting = useRef<boolean>(false);

  // --- TELEMETRY UPLINK ENGINE ---
  const transmitLocation = async (lat: number, lng: number, accuracy: number) => {
    // Throttle: Only send updates every 15 seconds to save bandwidth/battery
    const now = Date.now();
    if (now - lastUpdateRef.current < 15000 || isTransmitting.current) return;

    if (!session?.user?.email) return;

    try {
      isTransmitting.current = true;
      
      // Send coordinate payload to Nexus Core
      const response = await fetch("/api/mobile/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          accuracy: accuracy,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        lastUpdateRef.current = now;
        setStatus("Link Active: Coordinates Synced");
      } else {
        setStatus("Link Unstable: Retrying...");
      }
    } catch (error) {
      console.warn("Telemetry Uplink Failed (Retrying in background)");
    } finally {
      isTransmitting.current = false;
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("Error: GPS Module Not Found");
      return;
    }

    // --- SUCCESS HANDLER ---
    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      transmitLocation(latitude, longitude, accuracy);
    };

    // --- ERROR HANDLER (HARDENED) ---
    const handleError = (err: GeolocationPositionError) => {
      let msg = "Signal Lost";

      switch (err.code) {
        case 1: // PERMISSION_DENIED
          msg = "GPS Access Denied by User";
          console.error("Satellite Error:", msg);
          break;
        case 2: // POSITION_UNAVAILABLE
          msg = "Network Unreachable (No GPS Fix)";
          // Silent retry - typical in tunnels/elevators
          break;
        case 3: // TIMEOUT
          // We suppress console.error here to prevent log spamming
          // The watcher will automatically try again in the next cycle
          msg = "Acquiring Signal..."; 
          break;
        default:
          msg = `GPS Error: ${err.message}`;
      }

      setStatus(msg);
    };

    // --- ACTIVATE SATELLITE WATCHER ---
    // Clears any existing ghost watchers before starting a new one
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);

    watchId.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GPS_CONFIG
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [session]); // Re-bind if session changes

  // This component is a logic utility (Headless), so it renders nothing visible
  // It runs silently in the background of the application layout.
  return null; 
}