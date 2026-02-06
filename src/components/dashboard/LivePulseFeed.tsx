"use client";

import React from 'react';
import {
    Activity,
    ShoppingCart,
    UserCheck,
    FileText,
    AlertCircle,
    TrendingUp,
    MapPin,
    Clock
} from 'lucide-react';

interface PulseItem {
    id: string;
    type: string;
    user: string;
    shop: string;
    message: string;
    severity: string;
    timestamp: string;
}

export default function LivePulseFeed({ data }: { data: PulseItem[] }) {
    const getIcon = (type: string, severity: string) => {
        switch (type) {
            case 'SALE_EVENT':
                return <ShoppingCart size={14} className={severity === 'POSITIVE' ? 'text-emerald-500' : 'text-blue-500'} />;
            case 'CHECK_IN':
                return <UserCheck size={14} className="text-indigo-500" />;
            case 'FIELD_REPORT':
                return <FileText size={14} className="text-amber-500" />;
            case 'GHOST_ALERT':
                return <AlertCircle size={14} className="text-rose-500" />;
            case 'STOCK_LOW':
                return <AlertCircle size={14} className="text-orange-500" />;
            default:
                return <Activity size={14} className="text-slate-400" />;
        }
    };

    const getTimeAgo = (timestamp: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Activity size={16} className="text-blue-600" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Activity Pulse</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Live Updates</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {data.length > 0 ? (
                    data.map((item) => (
                        <div
                            key={item.id}
                            className="flex gap-4 group animate-in slide-in-from-bottom-2 duration-300"
                        >
                            <div className="relative flex flex-col items-center">
                                <div className={`p-2 rounded-xl border shadow-sm transition-all group-hover:scale-110 ${item.severity === 'HIGH' ? 'bg-rose-50 border-rose-100' :
                                        item.severity === 'POSITIVE' ? 'bg-emerald-50 border-emerald-100' :
                                            'bg-slate-50 border-slate-100'
                                    }`}>
                                    {getIcon(item.type, item.severity)}
                                </div>
                                <div className="w-px flex-1 bg-slate-100 mt-2" />
                            </div>

                            <div className="flex-1 pb-4">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-[11px] font-black text-slate-900 leading-none">
                                        {item.user}
                                    </p>
                                    <span className="text-[9px] font-bold text-slate-400 leading-none flex items-center gap-1">
                                        <Clock size={10} /> {getTimeAgo(item.timestamp)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium mb-2 pr-4">{item.message}</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        <MapPin size={10} /> {item.shop}
                                    </div>
                                    {item.type === 'SALE_EVENT' && item.severity === 'POSITIVE' && (
                                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                                            <TrendingUp size={10} /> High Value
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <Activity size={24} className="text-slate-300" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Network...</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Acquiring real-time activity stream</p>
                    </div>
                )}
            </div>
        </div>
    );
}
