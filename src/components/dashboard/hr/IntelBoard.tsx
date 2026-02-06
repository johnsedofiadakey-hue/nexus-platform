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
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <BarChart2 className="text-slate-300 w-10 h-10" />
                </div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No Intelligence Link</h3>
                <p className="text-[10px] text-slate-300 font-bold uppercase mt-2">Awaiting Field Deployment Logs</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
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
                    <div key={report.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* 🕒 TIMELINE CONNECTOR (Visual Only) */}
                        <div className="absolute -left-[45px] top-0 bottom-[-40px] w-px bg-slate-200 last:hidden" />

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10 group-hover:border-blue-500 group-hover:bg-blue-50 transition-all duration-300">
                                <Activity className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{date}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{time} • Transmission Successful</p>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group/card">

                            {/* 📊 KPI HIGH-CONTRAST GRID */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group-hover/card:border-blue-100 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity size={12} className="text-blue-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Foot Traffic</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{report.walkIns}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group-hover/card:border-amber-100 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag size={12} className="text-amber-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inquiries</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{report.inquiries}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group-hover/card:border-emerald-100 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign size={12} className="text-emerald-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Actual Sales</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{report.buyers}</p>
                                </div>
                                <div className="bg-slate-900 p-5 rounded-3xl shadow-lg border border-slate-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={12} className="text-blue-400" />
                                        <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest">Success Rate</span>
                                    </div>
                                    <p className="text-2xl font-black text-white leading-none">{conversionRate}%</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* 🏢 COMPETITOR INTELLIGENCE OVERHAUL */}
                                {report.marketIntel && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-amber-100/50 rounded-lg"><Zap className="w-3.5 h-3.5 text-amber-600" /></div>
                                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Competitor Pricing Intelligence</h5>
                                            </div>
                                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Market Surveillance</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {(() => {
                                                try {
                                                    const parsed = JSON.parse(report.marketIntel);
                                                    if (Array.isArray(parsed)) {
                                                        return parsed.map((item: any, idx: number) => (
                                                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100 transition-all cursor-default relative overflow-hidden group/item">
                                                                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-[2rem] -mr-4 -mt-4 opacity-50 group-hover/item:scale-110 transition-transform" />
                                                                <div className="relative z-10">
                                                                    <div className="flex flex-col mb-4">
                                                                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">{item.brand}</span>
                                                                        <span className="text-sm font-black text-slate-900">{item.model}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase uppercase tracking-widest">Market Price</span>
                                                                        <span className="text-base font-black text-slate-900 tracking-tight">₵{item.price.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ));
                                                    }
                                                } catch (e) { }
                                                return (
                                                    <div className="col-span-full bg-amber-50/50 p-4 rounded-2xl border border-amber-100 italic text-[11px] font-medium text-slate-600 leading-relaxed">
                                                        "{report.marketIntel}"
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* 📦 INVENTORY INSIGHTS */}
                                {report.stockGaps && (
                                    <div className="bg-blue-50/20 p-5 rounded-3xl border border-blue-100/50">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-blue-100/50 rounded-lg"><PackageSearch className="w-3.5 h-3.5 text-blue-600" /></div>
                                            <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Operational Stock Analysis</h5>
                                        </div>
                                        <p className="text-xs font-medium text-slate-600 leading-relaxed bg-white/50 p-4 rounded-2xl border border-white">
                                            {report.stockGaps}
                                        </p>
                                    </div>
                                )}

                                {/* 📝 FIELD NOTES */}
                                {report.notes && (
                                    <div className="p-5 rounded-3xl border border-slate-100 bg-white shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 right-0 opacity-[0.03] rotate-12 -mr-4 -mt-4">
                                            <MessageSquare size={100} />
                                        </div>
                                        <div className="flex items-center gap-3 mb-3 relative z-10">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200"><MessageSquare size={14} /></div>
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Promoter Commentary</h5>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 italic relative z-10 pl-4 border-l-2 border-slate-200">
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
