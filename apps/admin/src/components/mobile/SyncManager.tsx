"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { SyncQueue } from "@/lib/sync-queue";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function SyncManager() {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        setPendingCount(SyncQueue.count());

        const handleOnline = () => { setIsOnline(true); processQueue(); };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = setInterval(() => {
            setPendingCount(SyncQueue.count());
            if (navigator.onLine && SyncQueue.count() > 0) processQueue();
        }, 10000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const processQueue = async () => {
        if (isSyncing || SyncQueue.count() === 0) return;
        setIsSyncing(true);
        const toastId = toast.loading("Syncing Offline Data...");

        const queue = SyncQueue.getAll();
        let successCount = 0;

        for (const item of queue) {
            try {
                let endpoint = '';
                if (item.type === 'REPORT') endpoint = '/api/operations/reports';
                if (item.type === 'LEAVE') endpoint = '/api/hr/leaves';

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.payload)
                });

                if (res.ok) {
                    SyncQueue.remove(item.id);
                    successCount++;
                }
            } catch (e) {
                console.error("Sync Failed for item", item.id);
            }
        }

        setIsSyncing(false);
        setPendingCount(SyncQueue.count());

        if (successCount > 0) {
            toast.success(`Synced ${successCount} items`, { id: toastId });
        } else {
            toast.dismiss(toastId);
        }
    };

    if (pendingCount === 0 && isOnline) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-slate-900/90 backdrop-blur text-white rounded-full shadow-xl border border-white/10">
            {isOnline ? (
                isSyncing ? <RefreshCw size={14} className="animate-spin text-blue-400" /> : <Wifi size={14} className="text-emerald-400" />
            ) : (
                <WifiOff size={14} className="text-rose-400" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
                {isOnline ? (isSyncing ? "Syncing..." : `${pendingCount} Pending`) : "Offline Mode"}
            </span>
        </div>
    );
}
