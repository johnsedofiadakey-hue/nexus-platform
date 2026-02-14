"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, User, Building2, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface SaleItem {
    id: string;
    totalAmount: number;
    createdAt: string;
    user: { name: string };
    shop: { name: string };
}

export default function LiveSalesWidget() {
    const [sales, setSales] = useState<SaleItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        try {
            const response = await fetch("/api/sales/register?limit=10");
            if (response.ok) {
                const payload = await response.json();
                const rows = payload?.data ?? payload;
                setSales(Array.isArray(rows) ? rows : []);
            }
        } catch (error) {
            console.error("Failed to fetch live sales:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
        const interval = setInterval(fetchSales, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-blue-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                        Live Sales Stream
                    </h3>
                </div>
                <Link
                    href="/dashboard/sales"
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest flex items-center gap-1"
                >
                    Register <ChevronRight size={12} />
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && sales.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Ledger...</p>
                    </div>
                ) : sales.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {sales.map((sale) => (
                            <div
                                key={sale.id}
                                className="px-5 py-4 hover:bg-slate-50/80 transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold text-slate-400">#{sale.id.slice(-6).toUpperCase()}</span>
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">₵{sale.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-300 flex items-center gap-1">
                                        <Clock size={10} /> {formatTime(sale.createdAt)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User size={12} className="text-slate-500" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{sale.user?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                        <Building2 size={10} />
                                        <span className="truncate max-w-[100px]">{sale.shop?.name}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <ShoppingCart size={32} className="text-slate-100 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Sales Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
