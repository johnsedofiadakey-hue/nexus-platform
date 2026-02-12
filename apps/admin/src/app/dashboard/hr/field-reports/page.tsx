"use client";

import React, { useState, useEffect } from "react";
import {
    FileText, Search, Filter, RefreshCcw, ArrowLeft,
    MapPin, User, Tag, Zap, PackageSearch,
    TrendingUp, Calendar, Clock, ChevronDown, ChevronUp,
    BarChart3, Loader2, DollarSign
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DailyReport {
    id: string;
    createdAt: string;
    walkIns: number;
    inquiries: number;
    buyers: number;
    marketIntel?: string;
    stockGaps?: string;
    notes?: string;
    user: {
        name: string;
        image?: string;
        shop?: {
            name: string;
        };
    };
}

export default function FieldReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/operations/reports?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) {
                setReports(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const filteredReports = reports.filter(r =>
        r.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getConversionRate = (walkIns: number, buyers: number) => {
        if (walkIns === 0) return 0;
        return Math.round((buyers / walkIns) * 100);
    };

    const parseIntel = (intelStr?: string) => {
        if (!intelStr) return [];
        try {
            const parsed = JSON.parse(intelStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-20">
            {/* HEADER */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 px-8 py-5">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="p-2.5 -ml-2 rounded-xl hover:bg-slate-100/80 text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">Field Intelligence</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                                Centralized Operations Registry • {reports.length} Total Reports
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchReports}
                        className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                    >
                        <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-8">

                {/* FILTERS */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Filter size={18} className="text-slate-400" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Filter Registry</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative col-span-2">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by promoter name, shop, or notes..."
                                className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* TABLE REPLACED BY HIGH-DENSITY CARDS FOR BETTER MOBILE COMPATIBILITY IF NEEDED, BUT HERE AS A PROPER REGISTRY */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                                <BarChart3 size={18} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Operation Register</h3>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reconstructing Intel...</p>
                        </div>
                    ) : filteredReports.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Promoter</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Traffic</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Conversion</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Intel</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[13px]">
                                    {filteredReports.map((report) => (
                                        <React.Fragment key={report.id}>
                                            <tr className={`hover:bg-slate-50/50 transition-all group ${expandedId === report.id ? 'bg-blue-50/30' : ''}`}>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900">{new Date(report.createdAt).toLocaleDateString()}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                            <Clock size={10} /> {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                                            {report.user.image ? <img src={report.user.image} className="w-full h-full object-cover" /> : <User size={14} />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-900">{report.user.name}</span>
                                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                                                <MapPin size={10} /> {report.user.shop?.name || "Global"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <div className="text-center">
                                                            <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">In</p>
                                                            <p className="font-black text-slate-700">{report.walkIns}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Buy</p>
                                                            <p className="font-black text-emerald-600">{report.buyers}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center justify-center">
                                                        <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black flex items-center gap-2">
                                                            {getConversionRate(report.walkIns, report.buyers)}%
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-wrap gap-2">
                                                        {parseIntel(report.marketIntel).length > 0 ? (
                                                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                                <Zap size={10} /> {parseIntel(report.marketIntel).length} Intel Points
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300 uppercase">No Data</span>
                                                        )}
                                                        {report.stockGaps && (
                                                            <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                                <AlertCircle size={10} /> Gap Alert
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                                                        className={`p-2 rounded-xl transition-all ${expandedId === report.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        {expandedId === report.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* EXPANDED INTEL DETAILS */}
                                            {expandedId === report.id && (
                                                <tr className="bg-slate-50/30">
                                                    <td colSpan={6} className="px-12 py-8">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">

                                                            {/* LEFT SIDE: MARKET INTEL */}
                                                            <div className="space-y-6">
                                                                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                                                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Zap size={16} /></div>
                                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Competitor Analysis</h4>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {parseIntel(report.marketIntel).length > 0 ? (
                                                                        parseIntel(report.marketIntel).map((item, idx) => (
                                                                            <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-amber-400 transition-colors">
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{item.brand}</p>
                                                                                    <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mkt Item</div>
                                                                                </div>
                                                                                <p className="text-sm font-black text-slate-900 mb-2">{item.model}</p>
                                                                                <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                                                                    <span className="text-[10px] font-bold text-slate-400">PRICE</span>
                                                                                    <span className="text-base font-black text-slate-900">₵{Number(item.price).toLocaleString()}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="col-span-full py-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                                                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Competitor Items Captured</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* RIGHT SIDE: STOCK GAPS & NOTES */}
                                                            <div className="space-y-6">
                                                                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                                                                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><PackageSearch size={16} /></div>
                                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Critical Insights</h4>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Inventory Gaps</p>
                                                                        <p className={`text-sm font-medium leading-relaxed ${report.stockGaps ? 'text-slate-900' : 'text-slate-300'}`}>
                                                                            {report.stockGaps || "No inventory shortages reported."}
                                                                        </p>
                                                                    </div>

                                                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Promoter Commentary</p>
                                                                        <p className={`text-sm font-medium leading-relaxed italic ${report.notes ? 'text-slate-700' : 'text-slate-300'}`}>
                                                                            "{report.notes || "No additional field notes provided."}"
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-200 mb-4">
                                <FileText size={32} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AlertCircle({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
