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

                // Conversion Rate
                const rate = report.walkIns > 0
                    ? Math.round((report.buyers / report.walkIns) * 100)
                    : 0;

                return (
                    <div key={report.id} className="relative pl-6 pb-6 border-l w-[350px] md:w-full border-slate-200 last:border-0 group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white group-hover:bg-blue-500 transition-colors shadow-sm" />

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{date} • {time}</span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Walk-ins</p>
                                <p className="text-sm font-black text-slate-900">{report.walkIns}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Buyers</p>
                                <p className="text-sm font-black text-emerald-600">{report.buyers}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Conv. %</p>
                                <p className="text-sm font-black text-blue-600">{rate}%</p>
                            </div>
                        </div>

                        {/* Intelligence Cards */}
                        <div className="space-y-2">
                            {report.marketIntel && (
                                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Market Intel</p>
                                    </div>

                                    {/* Attempt JSON Parse */}
                                    {(() => {
                                        try {
                                            const parsed = JSON.parse(report.marketIntel);
                                            if (Array.isArray(parsed)) {
                                                return (
                                                    <div className="space-y-2">
                                                        {parsed.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center text-[10px] border-b border-amber-200/50 last:border-0 pb-1 last:pb-0">
                                                                <div>
                                                                    <span className="font-bold text-slate-700">{item.brand}</span>
                                                                    <span className="text-slate-500 ml-1">{item.model}</span>
                                                                </div>
                                                                <span className="font-mono font-bold text-amber-700">GHS {item.price}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return <p className="text-xs font-medium text-slate-700 leading-relaxed">{report.marketIntel}</p>;
                                        } catch (e) {
                                            return <p className="text-xs font-medium text-slate-700 leading-relaxed">{report.marketIntel}</p>;
                                        }
                                    })()}
                                </div>
                            )}

                            {report.stockGaps && (
                                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Stock Gaps</p>
                                    </div>
                                    <p className="text-xs font-medium text-slate-700 leading-relaxed">{report.stockGaps}</p>
                                </div>
                            )}

                            {report.notes && (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MessageSquare className="w-3 h-3 text-slate-400" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Field Notes</p>
                                    </div>
                                    <p className="text-xs font-medium text-slate-600 italic">"{report.notes}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
