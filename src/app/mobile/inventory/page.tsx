"use client";

import React from "react";
import { Search, Filter, Package } from "lucide-react";

export default function InventoryPage() {
  const inventory = [
    { id: 1, name: "LG OLED C3 55\"", category: "TVs", price: 18000, stock: 4, status: "Low" },
    { id: 2, name: "LG 4K UHD 43\"", category: "TVs", price: 4500, stock: 12, status: "Good" },
    { id: 3, name: "LG Soundbar S40Q", category: "Audio", price: 2100, stock: 8, status: "Good" },
    { id: 4, name: "LG XBOOM Go", category: "Audio", price: 850, stock: 2, status: "Critical" },
  ];

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-black text-slate-900">Shop Stock</h1>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Melcom Accra Mall</p>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
           <Filter className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {inventory.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <span className={`w-2 h-2 rounded-full block ${
                   item.status === 'Good' ? 'bg-emerald-500' : 
                   item.status === 'Low' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
             </div>
             
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-2">
               <Package className="w-5 h-5" />
             </div>
             
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.category}</p>
               <h3 className="text-sm font-black text-slate-900 leading-tight mb-2">{item.name}</h3>
               <p className="text-emerald-600 font-bold text-xs">₵ {item.price.toLocaleString()}</p>
             </div>

             <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">In Stock</span>
                <span className="text-sm font-black text-slate-900">{item.stock}</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}