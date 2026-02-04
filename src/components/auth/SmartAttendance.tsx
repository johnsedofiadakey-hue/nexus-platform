"use client";

import React, { useState, useEffect } from "react";
import { MapPin, ShieldAlert, CheckCircle, Lock, Loader2, Globe } from "lucide-react";
import { calculateDistance } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useMobileTheme } from "@/context/MobileThemeContext";

interface SmartAttendanceProps {
    shopLat: number;
    shopLng: number;
    radius: number;
    bypassGeofence?: boolean;
}

export default function SmartAttendance({ shopLat, shopLng, radius, bypassGeofence = false }: SmartAttendanceProps) {
    const { themeClasses, darkMode } = useMobileTheme();
    const [distance, setDistance] = useState<number | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'SEARCHING' | 'LOCKED' | 'ERROR'>('SEARCHING');
    const [canClock, setCanClock] = useState(false);

    const [status, setStatus] = useState<'CLOCKED_IN' | 'CLOCKED_OUT' | 'LOADING'>('LOADING');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Initial Status Check
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/mobile/attendance');
                const data = await res.json();
                setStatus(data.status);
            } catch (e) {
                console.error(e);
                setStatus('CLOCKED_OUT');
            }
        };
        checkStatus();
    }, []);

    // 2. GPS Engine
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsStatus('ERROR');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, shopLat, shopLng);
                setDistance(d);
                setGpsStatus('LOCKED');
                // LOGIC: Allow if inside radius OR if admin enabled remote access
                setCanClock(d <= radius || bypassGeofence);
            },
            (err) => {
                console.error(err);
                setGpsStatus('ERROR');
                // If GPS fails but remote access allowed, enable it
                if (bypassGeofence) setCanClock(true);
            },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [shopLat, shopLng, radius, bypassGeofence]);

    // 3. Action Handler
    const handleToggle = async () => {
        setIsSubmitting(true);
        const action = status === 'CLOCKED_IN' ? 'CLOCK_OUT' : 'CLOCK_IN';

        try {
            // Get current exact coords one last time for validation
            navigator.geolocation.getCurrentPosition(async (pos) => {
                await processAttendance(action, pos.coords.latitude, pos.coords.longitude);
            }, (err) => {
                // If bypass is on, we can submit without coords (or 0,0) if necessary, 
                // but ideally the user should still try. Use 0,0 if bypass on and error.
                if (bypassGeofence) {
                    processAttendance(action, 0, 0);
                } else {
                    toast.error("GPS Location Invalid");
                    setIsSubmitting(false);
                }
            });

        } catch (e) {
            toast.error("Network Error - Try Again");
            setIsSubmitting(false);
        }
    };

    const processAttendance = async (action: string, lat: number, lng: number) => {
        const res = await fetch('/api/mobile/attendance', {
            method: 'POST',
            body: JSON.stringify({ action, lat, lng, bypass: bypassGeofence })
        });

        const data = await res.json();

        if (res.ok) {
            toast.success(action === 'CLOCK_IN' ? (canClock ? "Shift Started" : "Remote Shift Started") : "Shift Ended");
            setStatus(action === 'CLOCK_IN' ? 'CLOCKED_IN' : 'CLOCKED_OUT');
        } else {
            toast.error(data.error || "Action Failed");
        }
        setIsSubmitting(false);
    }

    if (status === 'LOADING') {
        return <div className={`p-6 rounded-3xl animate-pulse h-48 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}></div>;
    }

    const isZoneValid = distance !== null && distance <= radius;

    return (
        <div className={`p-6 rounded-[2rem] shadow-sm border transition-colors duration-500 ${themeClasses.card} ${themeClasses.border}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className={`text-sm font-black uppercase tracking-wide ${themeClasses.text}`}>Attendance</h3>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live GPS Tracking</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${gpsStatus === 'LOCKED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {gpsStatus === 'LOCKED' ? 'GPS Active' : 'No Signal'}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <MapPin className={`w-5 h-5 ${isZoneValid ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <div>
                        <p className={`text-xs font-bold ${themeClasses.text}`}>
                            {distance !== null ? `${distance}m from Hub` : "Locating..."}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            {isZoneValid ? "Inside Secure Zone" : bypassGeofence ? "Remote Access Authorized" : "Roaming / Off-Site Mode"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${status === 'CLOCKED_IN'
                        ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                        : isZoneValid
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : bypassGeofence
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        }`}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                    ) : status === 'CLOCKED_IN' ? (
                        <>Stop Shift <Lock className="w-4 h-4" /></>
                    ) : (
                        <>{isZoneValid ? "Start On-Site" : bypassGeofence ? "Start Remote Shift" : "Start Roaming"} <CheckCircle className="w-4 h-4" /></>
                    )}
                </button>

                {!isZoneValid && status === 'CLOCKED_OUT' && !bypassGeofence && (
                    <div className="flex items-center gap-2 text-amber-500 justify-center">
                        <ShieldAlert className="w-3 h-3" />
                        <p className="text-[10px] font-bold">You are outside the Geo-Fence</p>
                    </div>
                )}

                {bypassGeofence && !isZoneValid && (
                    <div className="flex items-center gap-2 text-blue-500 justify-center">
                        <Globe className="w-3 h-3" />
                        <p className="text-[10px] font-bold">Admin Override Active</p>
                    </div>
                )}
            </div>
        </div>
    );
}
