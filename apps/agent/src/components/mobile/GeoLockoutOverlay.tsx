"use client";

import React, { useEffect, useState } from "react";
import { Lock, MapPin, RefreshCw, AlertTriangle, Phone, Signal } from "lucide-react";
import { useSession } from "next-auth/react";

/**
 * 🔒 GEO LOCKOUT OVERLAY - PRODUCTION GRADE
 * Blocks the entire screen if the user is outside their assigned zone.
 * Features:
 * - GPS accuracy validation
 * - Safety buffer to prevent false lockouts
 * - Multiple readings for consistency
 * - User-friendly accuracy display
 */

const GPS_ACCURACY_THRESHOLD = 50; // Only accept GPS readings with ≤50m accuracy
const SAFETY_BUFFER = 30; // Add 30m buffer to geofence to account for GPS inaccuracy
const CONSISTENCY_CHECKS = 2; // Must be outside zone this many times before locking

export default function GeoLockoutOverlay({
    shopLat,
    shopLng,
    radius,
    bypass
}: {
    shopLat: number;
    shopLng: number;
    radius: number;
    bypass: boolean
}) {
    const [locked, setLocked] = useState(false);
    const [distance, setDistance] = useState(0);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [checking, setChecking] = useState(true);
    const [outsideCount, setOutsideCount] = useState(0);
    const { data: session } = useSession();

    const checkLocation = () => {
        setChecking(true);
        if (!navigator.geolocation) {
            setLocked(true);
            setChecking(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;
                const gpsAccuracy = pos.coords.accuracy;
                const dist = calculateDistance(userLat, userLng, shopLat, shopLng);

                setDistance(dist);
                setAccuracy(gpsAccuracy);

                // 🛡️ PRODUCTION-SAFE LOGIC
                // Only trust GPS if accuracy is good enough
                if (gpsAccuracy > GPS_ACCURACY_THRESHOLD) {
                    console.warn(`GPS accuracy too low: ${gpsAccuracy.toFixed(0)}m. Waiting for better signal...`);
                    setChecking(false);
                    return; // Don't lock/unlock on poor GPS
                }

                // Apply safety buffer to prevent false lockouts
                const effectiveRadius = radius + SAFETY_BUFFER;
                const isOutside = dist > effectiveRadius && !bypass;

                // Check consistency before locking
                if (isOutside) {
                    setOutsideCount(prev => {
                        const newCount = prev + 1;
                        if (newCount >= CONSISTENCY_CHECKS) {
                            setLocked(true);
                        }
                        return newCount;
                    });
                } else {
                    // Inside zone - unlock immediately and reset count
                    setLocked(false);
                    setOutsideCount(0);
                }

                setChecking(false);
            },
            (err) => {
                console.warn("GPS Error", err);
                // Don't immediately lock on GPS error - user might be indoors temporarily
                setChecking(false);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 15000, // Give GPS time to get accurate fix
                maximumAge: 0 // Always get fresh reading
            }
        );
    };

    useEffect(() => {
        checkLocation();
        const interval = setInterval(checkLocation, 30000); // Re-check every 30s
        return () => clearInterval(interval);
    }, [shopLat, shopLng, radius, bypass]);

    // Haversine Formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Math.round(R * c);
    };

    if (!locked && !checking) return null; // 🟢 Safe Zone

    // If initial load, don't show full block immediately, maybe just null or loader
    if (checking && !locked) return null;

    return (
        <div className="absolute inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">

            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                <Lock className="w-10 h-10 text-red-500 relative z-10" />
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Terminal Locked</h2>

            {distance > 0 ? (
                <>
                    <p className="text-slate-400 font-medium mb-2 max-w-xs mx-auto">
                        You are <span className="text-white font-bold">{distance}m</span> away from the shop zone.
                        Allowed radius is <span className="text-white font-bold">{radius}m</span>.
                    </p>
                    {accuracy !== null && (
                        <div className="flex items-center gap-2 text-xs mb-6">
                            <Signal className={`w-4 h-4 ${
                                accuracy <= 20 ? 'text-green-400' : 
                                accuracy <= 50 ? 'text-yellow-400' : 
                                'text-red-400'
                            }`} />
                            <span className="text-slate-500">
                                GPS Accuracy: <span className={`font-bold ${
                                    accuracy <= 20 ? 'text-green-400' : 
                                    accuracy <= 50 ? 'text-yellow-400' : 
                                    'text-red-400'
                                }`}>±{accuracy.toFixed(0)}m</span>
                            </span>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-slate-400 font-medium mb-6 max-w-xs mx-auto">
                    Searching for GPS signal... Ensure location services are enabled.
                </p>
            )}

            <div className="bg-slate-800 rounded-xl p-4 w-full mb-6 border border-slate-700">
                <div className="flex items-center gap-3 text-left">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <div>
                        <p className="text-xs font-bold text-slate-300 uppercase">Security Protocol</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Return to shop premises to auto-unlock.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={checkLocation}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    {checking ? <RefreshCw className="animate-spin w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    Check Location
                </button>

                <a href="tel:+233200000000" className="w-full py-4 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Call Manager
                </a>
            </div>

            <p className="mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                Session ID: {session?.user?.email}
            </p>

        </div>
    );
}
