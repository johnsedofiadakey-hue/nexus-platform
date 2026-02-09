import React from "react";
import {
    BarChart2, Zap, PackageSearch, MessageSquare,
    Calendar, ArrowRight, TrendingUp, AlertCircle,
    User, Store, Tag, DollarSign, Activity
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
            <div className="flex flex-col items-center justify-center p-16 bg-slate-50 border border-slate-200">
                <div className="w-16 h-16 bg-white border border-slate-200 flex items-center justify-center mb-4">
                    <BarChart2 className="text-slate-300 w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">No Field Reports</h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-2">Awaiting Intelligence Data</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reports.map((report) => {
                const date = new Date(report.createdAt).toLocaleDateString(undefined, {
                    weekday: 'long', month: 'long', day: 'numeric'
                });
                const time = new Date(report.createdAt).toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit'
                });

                const conversionRate = report.walkIns > 0
                    ? Math.round((report.buyers / report.walkIns) * 100)
                    : 0;

                return (
                    <div key={report.id} className="relative group">
                        {/* Timeline Connector */}
                        <div className="absolute -left-[45px] top-0 bottom-[-24px] w-px bg-slate-200 last:hidden" />

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-white border border-slate-200 flex items-center justify-center z-10 group-hover:border-blue-500 transition-colors">
                                <Activity className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">{date}</h4>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{time} • Logged</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-6 hover:border-slate-300 transition-colors">

                            {/* KPI GRID */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="bg-slate-50 border border-slate-200 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity size={11} className="text-blue-600" />
                                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Foot Traffic</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{report.walkIns}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag size={11} className="text-amber-600" />
                                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Inquiries</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{report.inquiries}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign size={11} className="text-emerald-600" />
                                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Sales</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{report.buyers}</p>
                                </div>
                                <div className="bg-slate-900 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={11} className="text-blue-400" />
                                        <span className="text-[9px] font-semibold text-blue-300 uppercase tracking-wider">Conversion</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{conversionRate}%</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* COMPETITOR INTELLIGENCE */}
                                {report.marketIntel && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-amber-100 border border-amber-200"><Zap className="w-3 h-3 text-amber-700" /></div>
                                                <h5 className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Competitor Pricing</h5>
                                            </div>
                                            <span className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1">Market Intel</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {(() => {
                                                try {
                                                    const parsed = JSON.parse(report.marketIntel);
                                                    if (Array.isArray(parsed)) {
                                                        return parsed.map((item: any, idx: number) => (
                                                            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between hover:border-amber-400 hover:bg-amber-50/50 transition-colors cursor-default">
                                                                <div>
                                                                    <div className="flex flex-col mb-3">
                                                                        <span className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1">{item.brand}</span>
                                                                        <span className="text-sm font-bold text-slate-900">{item.model}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Price</span>
                                                                        <span className="text-base font-bold text-slate-900">₵{item.price.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ));
                                                    }
                                                } catch (e) { }
                                                return (
                                                    <div className="col-span-full bg-amber-50 p-4 border border-amber-200 italic text-[11px] font-medium text-slate-700 leading-relaxed">
                                                        "{report.marketIntel}"
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* INVENTORY INSIGHTS */}
                                {report.stockGaps && (
                                    <div className="bg-blue-50 p-4 border border-blue-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-blue-100 border border-blue-200"><PackageSearch className="w-3 h-3 text-blue-700" /></div>
                                            <h5 className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Stock Analysis</h5>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed bg-white p-3 border border-blue-100">
                                            {report.stockGaps}
                                        </p>
                                    </div>
                                )}

                                {/* FIELD NOTES */}
                                {report.notes && (
                                    <div className="p-4 border border-slate-200 bg-slate-50 relative">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500"><MessageSquare size={12} /></div>
                                            <h5 className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Promoter Commentary</h5>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 italic pl-3 border-l-2 border-slate-300">
                                            "{report.notes}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
