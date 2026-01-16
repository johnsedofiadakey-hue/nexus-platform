"use client";

import React, { useState, useEffect } from "react";
import { Building2, MapPin, Package, Plus, Search, ArrowRight, Save, Loader2, Monitor } from "lucide-react";

export default function ShopInventoryManager() {
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shops").then(res => res.json()).then(res => {
      setShops(res.data);
      if (res.data?.length > 0) setSelectedShop(res.data[0]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      {/* SHOP REGISTRY LEDGER */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Retail Node Registry</h3>
          <button className="p-1.5 bg-slate-900 text-white rounded-md hover:bg-black transition-all">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {shops.map((shop) => (
            <div 
              key={shop.id} 
              onClick={() => setSelectedShop(shop)}
              className={`p-5 cursor-pointer transition-all ${selectedShop?.id === shop.id ? 'bg-blue-50/50 border-r-4 border-blue-600' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-900">{shop.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{shop.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900">{shop._count.users}</p>
                  <p className="text-[8px] text-slate-400 uppercase font-bold">Reps</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INVENTORY UPDATE INTERFACE */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{selectedShop?.name || "Select a Node"}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Stock Allocation & Serial Tracking</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Export Manifest</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">Receive Stock</button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QUICK UPDATE FORM */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Quick Stock Adjustment</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select LG Product</label>
                <select className="w-full h-12 border border-slate-200 rounded-xl px-4 text-xs font-bold bg-white outline-none focus:border-blue-500">
                  <option>LG OLED65C3 - 65" 4K Smart TV</option>
                  <option>LG InstaView Door-in-Door Fridge</option>
                  <option>LG Dual Inverter AC - 1.5HP</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                  <input type="number" placeholder="0" className="w-full h-12 border border-slate-200 rounded-xl px-4 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</label>
                  <select className="w-full h-12 border border-slate-200 rounded-xl px-4 text-xs font-bold bg-white outline-none">
                    <option>INBOUND (+)</option>
                    <option>OUTBOUND (-)</option>
                    <option>AUDIT (REPLACE)</option>
                  </select>
                </div>
              </div>
              <button className="w-full h-14 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                <Save className="w-4 h-4" /> Commit Stock Update
              </button>
            </div>
          </div>

          {/* STOCK SUMMARY VIEW */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Current Node Inventory</h4>
            <div className="space-y-3">
              {[
                { name: "OLED TVs", qty: 24, status: "Good" },
                { name: "Fridges", qty: 8, status: "Low" },
                { name: "AC Units", qty: 45, status: "Good" }
              ].map((inv, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-700">{inv.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900">{inv.qty}</span>
                    <p className={`text-[8px] font-black uppercase ${inv.status === 'Low' ? 'text-amber-500' : 'text-emerald-500'}`}>{inv.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}