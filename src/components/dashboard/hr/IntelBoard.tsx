import React from "react";
import {
    BarChart2, Zap, PackageSearch, MessageSquare,
    Calendar, ArrowRight, TrendingUp, AlertCircle
} from "lucide-react";

interface DailyReport {
    id: string;
    createdAt: string;
    walkIns: number;
    inquiries: number;
    buyers: number;
    marketIntel?: string;
    stockGaps?: string;
    notes?: string;
}

interface IntelBoardProps {
    reports: DailyReport[];
}

export default function IntelBoard({ reports }: IntelBoardProps) {
    if (!reports || reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <BarChart2 className="text-slate-300 w-8 h-8" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Intelligence Logged</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reports.map((report) => {
                const date = new Date(report.createdAt).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric'
                });
                const time = new Date(report.createdAt).toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit'
                });

                // Success Rate (Simplified English for Conversion)
                const rate = report.walkIns > 0
                    ? Math.round((report.buyers / report.walkIns) * 100)
                    : 0;

                return (
                    <div key={report.id} className="relative pl-6 pb-6 border-l w-full border-slate-200 last:border-0 group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[5.5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white group-hover:bg-blue-600 transition-colors shadow-sm" />

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">{date} • {time}</span>
                        </div>

                        {/* Performance Grid (Simplified) */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Foot Traffic</p>
                                <p className="text-sm font-black text-slate-900">{report.walkIns}</p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Inquiries</p>
                                <p className="text-sm font-black text-amber-600">{report.inquiries}</p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Actual Sales</p>
                                <p className="text-sm font-black text-emerald-600">{report.buyers}</p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Success Rate</p>
                                <p className="text-sm font-black text-blue-600">{rate}%</p>
                            </div>
                        </div>

                        {/* Intel Sections */}
                        <div className="space-y-2">
                            {report.marketIntel && (
                                <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Competitor Pricing</p>
                                    </div>
                                    {/* Attempt JSON Parse */}
                                    {(() => {
                                        try {
                                            const parsed = JSON.parse(report.marketIntel);
                                            if (Array.isArray(parsed)) {
                                                return (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {parsed.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded-xl border border-amber-100 shadow-sm text-[10px]">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-slate-900 uppercase tracking-tight">{item.brand}</span>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.model}</span>
                                                                </div>
                                                                <span className="font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">₵{item.price}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                        } catch (e) { }
                                        return <p className="text-[11px] font-medium text-slate-700 leading-relaxed">{report.marketIntel}</p>;
                                    })()}
                                </div>
                            )}

                            {report.stockGaps && (
                                <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <PackageSearch className="w-3.5 h-3.5 text-blue-500" />
                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Inventory Status</p>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-700 leading-relaxed">{report.stockGaps}</p>
                                </div>
                            )}

                            {report.notes && (
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Promoter Field Notes</p>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-700 italic border-l-2 border-slate-200 pl-3">
                                        "{report.notes}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
