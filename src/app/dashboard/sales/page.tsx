"use client";

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, Download,
    ShoppingCart, Hash, CreditCard, User,
    MapPin, Clock, ArrowUpRight, Loader2,
    ChevronLeft, ChevronRight
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
        setLoading(true);
        try {
            const query = filterShop ? `?shopId=${filterShop}` : '';
            const res = await fetch(`/api/sales/register${query}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSales(data);
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
        s.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 xl:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500 min-h-screen">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">SALES REGISTER</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Live Transaction Ledger</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search Invoice #..."
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none w-40"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => fetchSales()} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl shadow-slate-900/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Revenue (loaded)</p>
                        <h3 className="text-3xl font-black">
                            ₵ {sales.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Transactions</p>
                    <h3 className="text-3xl font-black text-slate-900">{sales.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Avg. Ticket</p>
                    <h3 className="text-3xl font-black text-blue-600">
                        ₵ {sales.length > 0 ? Math.round(sales.reduce((acc, curr) => acc + curr.totalAmount, 0) / sales.length) : 0}
                    </h3>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-slate-300 animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Ledger...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Info</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop / Agent</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900 font-mono group-hover:text-blue-600 transition-colors">#{sale.id.slice(-8).toUpperCase()}</span>
                                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                                                    <Calendar size={10} />
                                                    {new Date(sale.createdAt).toLocaleDateString()} • {new Date(sale.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {sale.shop?.name}</span>
                                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1 ml-4">{sale.user?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                {sale.items?.slice(0, 2).map((item: any, i: number) => (
                                                    <div key={i} className="text-[11px] font-medium text-slate-600">
                                                        {item.quantity}x {item.product?.name}
                                                    </div>
                                                ))}
                                                {sale.items?.length > 2 && (
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded ml-1">+{sale.items.length - 2} more</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-sm font-black text-slate-900">₵ {sale.totalAmount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                PAID
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {filteredSales.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 text-sm font-medium">No transactions found matching your search.</td>
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
