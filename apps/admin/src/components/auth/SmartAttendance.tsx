"use client";

import React, { useState, useEffect } from "react";
import { MapPin, ShieldAlert, Loader2, Globe } from "lucide-react";
import { calculateDistance } from "@/lib/utils";
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
    const [status, setStatus] = useState<'ON_SITE' | 'OFF_SITE' | 'LOADING'>('LOADING');
    const [totalOnSiteSeconds, setTotalOnSiteSeconds] = useState(0);
    const [totalOffSiteSeconds, setTotalOffSiteSeconds] = useState(0);
    const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);

    const formatHours = (seconds: number) => {
        const safeSeconds = Math.max(0, Number(seconds || 0));
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const refreshStrictStatus = async () => {
        try {
            const res = await fetch('/api/mobile/attendance', { cache: 'no-store' });
            const payload = await res.json();
            const data = payload?.data ?? payload;
            setStatus(data?.status === 'ON_SITE' ? 'ON_SITE' : 'OFF_SITE');
            setTotalOnSiteSeconds(Number(data?.totalOnSiteSeconds || 0));
            setTotalOffSiteSeconds(Number(data?.totalOffSiteSeconds || 0));
            setCurrentSessionSeconds(Number(data?.currentSessionSeconds || 0));
        } catch {
            setStatus('OFF_SITE');
        }
    };

    useEffect(() => {
        refreshStrictStatus();
        const interval = setInterval(refreshStrictStatus, 5000);
        return () => clearInterval(interval);
    }, []);

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
            },
            (err) => {
                console.error(err);
                setGpsStatus('ERROR');
            },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [shopLat, shopLng, radius, bypassGeofence]);

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

                <div className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-center ${status === 'ON_SITE' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'}`}>
                    {status === 'ON_SITE' ? 'ON_SITE' : 'OFF_SITE'}
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">Current Session</span>
                        <span className={`font-black ${themeClasses.text}`}>{formatHours(currentSessionSeconds)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                        <span className="font-bold text-slate-500">Today Total</span>
                        <span className={`font-black ${themeClasses.text}`}>{formatHours(totalOnSiteSeconds)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                        <span className="font-bold text-slate-500">Off-Site Today</span>
                        <span className={`font-black ${themeClasses.text}`}>{formatHours(totalOffSiteSeconds)}</span>
                    </div>
                </div>

                {!isZoneValid && status === 'OFF_SITE' && !bypassGeofence && (
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
