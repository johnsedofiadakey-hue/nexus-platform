"use client";

import React, { useState, useEffect } from "react";
import { Search, Package, AlertTriangle, Loader2, Zap, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. LOAD LIVE DATA (Linked to Shop) ---
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Step A: Get the Shop ID first
      const initRes = await fetch("/api/mobile/init");
      const initData = await initRes.json();

      if (initData.shopId) {
        // Step B: Fetch Inventory for that specific Shop
        const res = await fetch(`/api/inventory?shopId=${initData.shopId}&t=${Date.now()}`);
        
        if (res.ok) {
          const data = await res.json();
          // Step C: Map API Data to UI Fields
          const mappedData = Array.isArray(data) ? data.map((item: any) => ({
             dbId: item.id,
             name: item.productName,      // Mapping API 'productName' -> UI 'name'
             id: item.sku || "N/A",       // Mapping API 'sku' -> UI 'id' (for search)
             stock: item.quantity,        // Mapping API 'quantity' -> UI 'stock'
             price: item.priceGHS,        // Mapping API 'priceGHS' -> UI 'price'
             status: item.quantity < 5 ? "Low Stock" : "Good",
             salesVelocity: 0             // Default (API doesn't have velocity yet)
          })) : [];

          setProducts(mappedData);
        }
      } else {
        setProducts([]); // No shop assigned
      }
    } catch (error) {
      console.error("Network Error", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. SEARCH FILTER ---
  const filteredProducts = products.filter(p => 
    (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (p.id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) // Search by SKU/ID
  );

  // --- 3. LOADING STATE ---
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Syncing Stock...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 font-sans">
      
      {/* HEADER & SEARCH */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-6 sticky top-4 z-10">
        <div className="flex justify-between items-center mb-3">
           <div className="flex items-center gap-3">
             <Link href="/mobilepos" className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-600">
               <ArrowLeft className="w-5 h-5" />
             </Link>
             <h1 className="text-xl font-black text-slate-900">Stock Room</h1>
           </div>
           <button onClick={fetchInventory} className="p-2 bg-slate-50 rounded-full text-blue-600 hover:bg-blue-50 active:scale-90 transition-transform">
             <RefreshCw className="w-4 h-4" />
           </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input 
            placeholder="Search Name or SKU..." 
            className="w-full h-11 pl-10 pr-4 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isLowStock = product.status === "Low Stock";
            // Logic for 'Fast Moving' (Disabled for now as API doesn't send velocity yet)
            const isFastMoving = false; 

            return (
              <div key={product.dbId} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                
                {/* LEFT: ICON & NAME */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isLowStock ? "bg-red-50 text-red-500" : 
                    isFastMoving ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {isLowStock ? <AlertTriangle className="w-5 h-5" /> : 
                     isFastMoving ? <Zap className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm leading-tight">{product.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex gap-2">
                      <span>{product.id}</span>
                      {isFastMoving && <span className="text-amber-500">• Fast Moving</span>}
                    </p>
                  </div>
                </div>

                {/* RIGHT: PRICE & QTY */}
                <div className="text-right">
                  <p className={`text-sm font-black ${isLowStock ? "text-red-500" : "text-slate-900"}`}>
                    {product.stock} Units
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                    ₵ {product.price?.toLocaleString()}
                  </p>
                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Package className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm font-bold">No Inventory Found</p>
            <p className="text-xs mt-1 opacity-60">Try searching for a different item.</p>
          </div>
        )}
      </div>
    </div>
  );
}