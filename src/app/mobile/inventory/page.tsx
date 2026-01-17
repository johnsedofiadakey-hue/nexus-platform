"use client";

import React, { useState, useEffect } from "react";
import { Search, Package, AlertTriangle, Loader2 } from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]); // ✅ Always an array
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();

        if (res.ok) {
          // ✅ FIX: Extract the 'items' array. Do not set the whole object.
          // If data.items is undefined, fallback to an empty array []
          setProducts(Array.isArray(data.items) ? data.items : []);
        } else {
          console.error("Inventory Load Failed", data);
          setProducts([]);
        }
      } catch (error) {
        console.error("Network Error", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  // --- SAFE FILTERING ---
  // Now this will never crash because products is guaranteed to be an array
  const filteredProducts = products.filter(p => 
    (p.productName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (p.sku?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      
      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 sticky top-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input 
            placeholder="Search Stock..." 
            className="w-full h-11 pl-10 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{product.productName}</h3>
                  <p className="text-xs text-slate-500 font-medium">SKU: {product.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${product.quantity < 5 ? "text-red-500" : "text-emerald-600"}`}>
                  {product.quantity} Units
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold uppercase">No Inventory Found</p>
          </div>
        )}
      </div>
    </div>
  );
}