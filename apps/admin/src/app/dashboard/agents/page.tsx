"use client";

import React, { useEffect, useState } from "react";
import {
    Users, Search, Wifi, MapPin, ShoppingBag, Clock, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AgentsPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchAgents();
        const interval = setInterval(fetchAgents, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/dashboard/agents');
            if (res.ok) {
                const payload = await res.json();
                const list = payload?.data ?? payload;
                setAgents(Array.isArray(list) ? list : []);
            }
        } finally {
            setLoading(false);
        }
    };

    const filtered = agents.filter(a =>
        (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.shopName || '').toLowerCase().includes(search.toLowerCase())
    );

    const formatHours = (seconds: number) => {
        const safeSeconds = Math.max(0, Number(seconds || 0));
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="p-6 md:p-10 min-h-screen bg-slate-50/50">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Users className="text-blue-600" /> Field Personnel
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-2">
                            Live monitoring of sales force activity and attendance.
                        </p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search promoters..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64"
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center opacity-50">
                        <Loader2 className="animate-spin mb-4" />
                        <p className="text-xs font-bold uppercase">Syncing Roster...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map(agent => (
                            <div key={agent.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                {/* Status Bar */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-blue-500 transition-colors" />

                                <div className="flex justify-between items-start mb-6 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black uppercase ${agent.isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {agent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-tight">{agent.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{agent.role}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1 ${agent.isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                        <Wifi size={10} /> {agent.isOnline ? 'LIVE' : 'OFF'}
                                    </div>
                                </div>

                                <div className="space-y-3 pl-2">
                                    <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-slate-500 font-bold flex items-center gap-2"><MapPin size={12} /> Hub</span>
                                        <span className="font-bold text-slate-900 truncate max-w-[120px]">{agent.shopName}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-slate-500 font-bold flex items-center gap-2"><ShoppingBag size={12} /> Sales Today</span>
                                        <span className="font-bold text-slate-900">{agent.salesToday}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-slate-500 font-bold flex items-center gap-2"><Clock size={12} /> Shift</span>
                                        <span className={`font-bold ${agent.attendanceStatus === 'ON_SITE' ? 'text-emerald-600' : 'text-rose-500'
                                            }`}>
                                            {agent.attendanceStatus === 'ON_SITE'
                                                ? `On Duty (${new Date(agent.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                                                : 'OFF_SITE'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-slate-500 font-bold">On-Site Hours</span>
                                        <span className="font-bold text-slate-900">{formatHours(agent.totalOnSiteSecondsToday)}</span>
                                    </div>
                                </div>

                                {!agent.isOnline && agent.lastSeen && (
                                    <p className="text-[9px] text-slate-300 font-mono text-center mt-4 pl-2">
                                        Last Signal: {formatDistanceToNow(new Date(agent.lastSeen))} ago
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
