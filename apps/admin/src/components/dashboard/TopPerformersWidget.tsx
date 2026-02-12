"use client";

import React from "react";
import { Trophy, TrendingUp, User, ShoppingBag, Medal } from "lucide-react";

interface Performer {
    id: string;
    name: string;
    image?: string;
    totalSales: number;
    transactionCount: number;
}

interface TopPerformersWidgetProps {
    performers: Performer[];
}

export default function TopPerformersWidget({ performers }: TopPerformersWidgetProps) {
    return (
        <div className="bg-white h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                        Daily Leaderboard
                    </h3>
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Top Promoters</span>
            </div>

            <div className="flex-1 p-5 space-y-4">
                {performers.length > 0 ? (
                    performers.map((performer, index) => (
                        <div key={performer.id} className="flex items-center gap-4 group">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                {index === 0 ? <Medal className="text-amber-400" size={20} /> :
                                    index === 1 ? <Medal className="text-slate-400" size={20} /> :
                                        index === 2 ? <Medal className="text-amber-700" size={20} /> :
                                            <span className="text-xs font-black text-slate-300">#{index + 1}</span>}
                            </div>

                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {performer.image ? (
                                        <img src={performer.image} alt={performer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-slate-400" />
                                    )}
                                </div>
                                {index === 0 && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                    {performer.name}
                                </p>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <ShoppingBag size={10} /> {performer.transactionCount} Txns
                                    </span>
                                </div>
                            </div>

                            {/* Value */}
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-900">₵{performer.totalSales.toLocaleString()}</p>
                                <div className="flex items-center justify-end gap-1 text-[9px] font-black text-emerald-600 uppercase">
                                    <TrendingUp size={8} /> High
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-50">
                        <Trophy size={40} className="text-slate-200 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Competition Pending</p>
                        <p className="text-xs text-slate-400 mt-1">First sales will activate leaderboard</p>
                    </div>
                )}
            </div>
        </div>
    );
}
