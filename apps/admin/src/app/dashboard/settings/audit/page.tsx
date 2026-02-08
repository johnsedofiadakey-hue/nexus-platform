"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Search, FileText, User, RefreshCw, Loader2 } from "lucide-react";

export default function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/audit");
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">SYSTEM AUDIT</h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Security & Compliance Ledger
                    </p>
                </div>
                <button onClick={fetchLogs} className="p-3 bg-white border border-slate-200 rounded-xl hover:text-blue-600 transition-colors">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* SEARCH */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    placeholder="Search by User, Action, or Entity..."
                    className="flex-1 font-bold text-sm text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User / Actor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-slate-400 font-bold text-sm">No Audit Records Found</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <span className="text-xs font-bold text-slate-500 font-mono">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{log.user?.name || "Unknown"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${log.action.includes("DELETE") ? "bg-red-50 text-red-600 border-red-100" :
                                                    log.action.includes("CREATE") ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{log.entity} <span className="text-slate-400">#{log.entityId}</span></span>
                                                <span className="text-[10px] text-slate-400 truncate w-64">{log.details}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
