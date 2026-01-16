"use client";

import React, { useState } from "react";
import { CheckCircle, Search, ScanLine, X } from "lucide-react";

export default function LogSalePage() {
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Mock Inventory
  const products = [
    { id: 1, name: "LG OLED C3 55\"", price: 18000, stock: 4 },
    { id: 2, name: "LG 4K UHD 43\"", price: 4500, stock: 12 },
    { id: 3, name: "LG Soundbar S40Q", price: 2100, stock: 8 },
  ];

  return (
    <div className="pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Record New Sale</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Select Product & Confirm</p>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-6">
        <input 
          placeholder="Search product name or ID..." 
          className="w-full bg-white border border-slate-200 rounded-2xl h-14 pl-12 pr-4 text-sm font-bold shadow-sm outline-none focus:border-blue-500"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-lg text-slate-500">
          <ScanLine className="w-4 h-4" />
        </button>
      </div>

      {/* PRODUCT LIST */}
      <div className="space-y-4">
        {products.map((product) => (
          <div 
            key={product.id} 
            onClick={() => setSelectedProduct(product)}
            className={`p-5 rounded-3xl border transition-all active:scale-95 cursor-pointer ${
              selectedProduct?.id === product.id 
                ? "bg-slate-900 border-slate-900 text-white shadow-xl" 
                : "bg-white border-slate-100 text-slate-900 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                selectedProduct?.id === product.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                Stock: {product.stock}
              </span>
              {selectedProduct?.id === product.id && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            </div>
            <h3 className="text-lg font-black mb-1">{product.name}</h3>
            <p className={`text-sm font-bold ${selectedProduct?.id === product.id ? "text-emerald-400" : "text-blue-600"}`}>
              ₵ {product.price.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* FLOATING ACTION BUTTON */}
      {selectedProduct && (
        <div className="fixed bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                <p className="text-xl font-black text-slate-900">₵ {selectedProduct.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                 <button className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black">-</button>
                 <span className="font-black text-lg">1</span>
                 <button className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black">+</button>
              </div>
            </div>
            <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/30">
              Confirm Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}