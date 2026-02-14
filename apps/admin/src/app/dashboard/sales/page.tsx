"use client";

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, Download,
    ShoppingCart, Hash, CreditCard, User,
    MapPin, Clock, ArrowUpRight, Loader2,
    ChevronLeft, ChevronRight, Tags, Package, Briefcase,
    Activity, Building2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SalesRegisterPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterShop, setFilterShop] = useState("");

    useEffect(() => {
        fetchSales();
        const interval = setInterval(fetchSales, 15000); // 🔄 Live Sync every 15s
        return () => clearInterval(interval);
    }, [filterShop]);

    const fetchSales = async () => {
        try {
            const query = filterShop ? `?shopId=${filterShop}` : '';
            const res = await fetch(`/api/sales/register${query}`);
            const payload = await res.json();
            const rows = payload?.data ?? payload;
            if (Array.isArray(rows)) {
                setSales(rows);
            }
        } catch (e) {
            toast.error("Failed to load Sales Register");
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(s =>
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.items?.some((i: any) =>
            i.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.product?.brand?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 min-h-screen">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 text-slate-900">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Sales Register</h1>
                    <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Transaction Intelligence
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Txn ID, Promoter, Item..."
                            className="h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none w-72 focus:ring-4 ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-32 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing Ledger...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto text-slate-900">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Promoter</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredSales.map((sale) => {
                                    const firstItem = sale.items?.[0]?.product;
                                    const otherItemsCount = (sale.items?.length || 0) - 1;

                                    return (
                                        <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 font-mono">#{sale.id.slice(-8).toUpperCase()}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 flex items-center gap-1">
                                                        <Clock size={10} /> {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={12} className="text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700">{sale.shop?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={12} className="text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700">{sale.user?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wide border border-blue-100/50">
                                                    {firstItem?.category || "General"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{firstItem?.name || "Product"}</span>
                                                    {otherItemsCount > 0 && (
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">+{otherItemsCount} More Items</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                    {firstItem?.brand || "—"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums">
                                                ₵ {sale.totalAmount.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredSales.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center text-slate-400 text-sm font-medium italic">No transactions found matching your search.</td>
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

