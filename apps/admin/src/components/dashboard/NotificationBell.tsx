"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader2, MessageSquare, FileText, AlertTriangle, ExternalLink } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
    const { theme } = useTheme();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // 📥 FETCH NOTIFICATIONS
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const payload = await res.json();
            const inner = payload?.data ?? payload;
            if (inner?.notifications) {
                setNotifications(inner.notifications);
                setUnreadCount(inner.unreadCount ?? 0);
            }
        } catch (err) {
            console.error("Failed to sync notifications", err);
        }
    };

    // 🔄 POLL for updates (every 30s)
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // 🖱️ HANDLE CLICK
    const handleNotificationClick = async (n: any) => {
        if (!n.isRead) {
            // Optimistic Update
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // API Call
            await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' });
        }

        if (n.link) {
            setIsOpen(false);
            router.push(n.link);
        }
    };

    return (
        <div className="relative">
            {/* 🔔 BELL TRIGGER */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 text-slate-400 transition-colors relative hover:opacity-80 active:scale-95"
                style={{ color: theme.primaryColor }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {/* 📜 DROPDOWN LIST */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                            <span className="text-[10px] font-bold text-slate-400">{unreadCount} Unread</span>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center opacity-50">
                                    <Bell size={24} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Caught Up</p>
                                </div>
                            ) : (
                                notifications.map((n) => {
                                    const Icon = n.type === 'MESSAGE' ? MessageSquare : n.type === 'LEAVE' ? FileText : AlertTriangle;
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`w-full p-4 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors flex gap-4 ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}
                                        >
                                            <div className={`mt-1 p-2 rounded-xl h-fit ${n.type === 'ALERT' ? 'bg-rose-100 text-rose-600' : 'bg-white border border-slate-100 text-slate-500'}`}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${n.isRead ? 'text-slate-500' : 'text-blue-600'}`}>
                                                        {n.title}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-300">
                                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2">
                                                    {n.message}
                                                </p>
                                            </div>
                                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />}
                                        </button>
                                    )
                                })
                            )}
                        </div>

                        <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                            <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                View All Activity
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
