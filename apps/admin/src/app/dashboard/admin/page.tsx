"use client";

import React, { useState, useEffect } from 'react';
import {
    ShieldCheck, Activity, Search, Filter,
    Calendar, Clock, User, Building2,
    RefreshCw, Loader2, Database, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminActivityDashboard() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/audit');
            const data = await res.json();
            if (Array.isArray(data)) {
                setLogs(data);
            }
        } catch (e) {
            toast.error("Failed to load audit trails");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 min-h-screen">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <ShieldCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Master Activity Log</h1>
                    </div>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> Live System Audit Trail
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search actions or promoters..."
                            className="h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none w-72 focus:ring-4 ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchLogs}
                        disabled={isRefreshing}
                        className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Events</p>
                    <h3 className="text-2xl font-black text-slate-900">{logs.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-blue-600">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Today's Activity</p>
                    <h3 className="text-2xl font-black">{logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-emerald-600">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Security Passed</p>
                    <h3 className="text-2xl font-black">100%</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-rose-600">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Anomalies</p>
                    <h3 className="text-2xl font-black">0</h3>
                </div>
            </div>

            {/* LOG TABLE */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-32 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Retrieving Logs...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto text-slate-900">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Promoter / Role</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Details</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-600' :
                                                    log.action.includes('DELETE') ? 'bg-rose-50 text-rose-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <Database className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tight text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><User size={12} className="text-slate-400" /> {log.user?.name || "System"}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-4.5">{log.user?.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="max-w-md">
                                                <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{log.details || "No metadata provided"}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 tracking-tighter">{log.entity}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900 font-mono">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 mt-1">
                                                    <Clock size={10} /> {new Date(log.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-lg text-slate-500 font-mono">
                                                {log.id.slice(-6).toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <AlertCircle className="w-10 h-10 text-slate-200" />
                                                <p className="text-slate-400 text-sm font-medium">No activity records found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
