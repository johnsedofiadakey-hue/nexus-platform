"use client";

import React, { useState, useEffect } from "react";
import { MapPin, ShieldAlert, CheckCircle, Lock } from "lucide-react";
import { calculateDistance } from "@/lib/utils"; // You'll need to export this or copy the helper
import { toast } from "react-hot-toast";

interface SmartAttendanceProps {
    shopLat: number;
    shopLng: number;
    radius: number;
    onClockIn: () => Promise<void>;
    status: 'CLOCKED_IN' | 'CLOCKED_OUT';
}

export default function SmartAttendance({ shopLat, shopLng, radius, onClockIn, status }: SmartAttendanceProps) {
    const [distance, setDistance] = useState<number | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'SEARCHING' | 'LOCKED' | 'ERROR'>('SEARCHING');
    const [canClock, setCanClock] = useState(false);

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
                setCanClock(d <= radius);
            },
            (err) => {
                console.error(err);
                setGpsStatus('ERROR');
            },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [shopLat, shopLng, radius]);

    const handleAction = async () => {
        if (!canClock && status === 'CLOCKED_OUT') {
            toast.error("You must be inside the shop zone to clock in!");
            return;
        }
        await onClockIn();
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Attendance</h3>
                    <p className="text-xs text-slate-500">Strict Geofence Enforced</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${gpsStatus === 'LOCKED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {gpsStatus === 'LOCKED' ? 'GPS Active' : 'No Signal'}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                    <MapPin className={`w-5 h-5 ${canClock ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <div>
                        <p className="text-xs font-bold text-slate-900">
                            {distance !== null ? `${distance}m from Zone Center` : "Locating..."}
                        </p>
                        <p className="text-[10px] text-slate-400">Allowed Radius: {radius}m</p>
                    </div>
                </div>

                <button
                    onClick={handleAction}
                    disabled={status === 'CLOCKED_OUT' && !canClock}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${status === 'CLOCKED_IN'
                            ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                            : canClock
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    {status === 'CLOCKED_IN' ? (
                        <>Stop Shift <Lock className="w-4 h-4" /></>
                    ) : (
                        <>Start Shift <CheckCircle className="w-4 h-4" /></>
                    )}
                </button>

                {!canClock && status === 'CLOCKED_OUT' && (
                    <div className="flex items-center gap-2 text-red-500 justify-center">
                        <ShieldAlert className="w-3 h-3" />
                        <p className="text-[10px] font-bold">Move closer to clock in</p>
                    </div>
                )}
            </div>
        </div>
    );
}
