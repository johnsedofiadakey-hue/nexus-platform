"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Zap, Ghost, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Alert = {
    id: string;
    type: "GHOST_ALERT" | "STOCK_LOW" | "BIG_SALE";
    user: string;
    shop: string;
    message: string;
    severity: "HIGH" | "MEDIUM" | "POSITIVE";
    timestamp: string;
};

export default function NotificationBell() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Poll for alerts every 30s
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await fetch('/api/operations/pulse-feed?t=' + Date.now());
                
                if (!res.ok) {
                    console.warn("Pulse feed returned non-OK status:", res.status);
                    return;
                }
                
                // Parse text first to handle empty responses
                const text = await res.text();
                if (!text || text.trim() === '') {
                    console.warn("Pulse feed returned empty response");
                    return;
                }
                
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    // Check if data changed to trigger "red dot"
                    if (JSON.stringify(data) !== JSON.stringify(alerts)) {
                        setAlerts(data);
                        if (data.length > 0) setHasNew(true);
                    }
                }
            } catch (e) {
                console.error("Pulse Sync Failed", e);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'GHOST_ALERT': return <Ghost className="w-5 h-5 text-slate-500" />;
            case 'STOCK_LOW': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'BIG_SALE': return <Zap className="w-5 h-5 text-blue-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => { setIsOpen(!isOpen); setHasNew(false); }}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
                <Bell className={`w-5 h-5 ${hasNew ? 'text-slate-900' : 'text-slate-400'}`} />
                {hasNew && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Notifications</h3>
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{alerts.length}</span>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {alerts.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-medium">All caught up!</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div key={alert.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3">
                                        <div className={`mt-1 p-2 rounded-lg h-fit ${alert.severity === 'HIGH' ? 'bg-red-50' :
                                                alert.severity === 'POSITIVE' ? 'bg-blue-50' : 'bg-amber-50'
                                            }`}>
                                            {getIcon(alert.type)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{alert.message}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-medium text-slate-500">{alert.shop}</span>
                                                <span className="text-[10px] text-slate-300">•</span>
                                                <span className="text-[10px] font-medium text-slate-400">{alert.user}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
