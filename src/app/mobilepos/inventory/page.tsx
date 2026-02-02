"use client";

import React, { useState, useEffect } from "react";
import { Search, Package, AlertTriangle, Loader2, Zap, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMobileTheme } from "@/context/MobileThemeContext";

const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706"
  };
  return colors[color] || colors.blue;
};

export default function InventoryPage() {
  const { darkMode, accent, themeClasses } = useMobileTheme();
  const accentHex = getColorHex(accent);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. SYNC WITH ASSIGNED HUB ---
  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Step A: Securely get current session's hub identity
      const initRes = await fetch("/api/mobile/init");
      const initData = await initRes.json();

      if (initData.shopId) {
        // Step B: Fetch only the inventory linked to this shop
        const res = await fetch(`/api/inventory?shopId=${initData.shopId}&t=${Date.now()}`);

        if (res.ok) {
          const data = await res.json();
          // Step C: Map DB fields to UI
          const mappedData = Array.isArray(data) ? data.map((item: any) => ({
            dbId: item.id,
            name: item.productName,
            sku: item.sku || "N/A",
            stock: item.quantity,
            price: item.priceGHS,
            status: item.quantity < 5 ? "Low Stock" : "Good"
          })) : [];

          setProducts(mappedData);
        }
      }
    } catch (error) {
      console.error("Sync Failure:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  // --- 2. SEARCH LOGIC ---
  const filteredProducts = products.filter(p =>
    (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (p.sku?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (loading && products.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${themeClasses.bg}`}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentHex }} />
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${themeClasses.text}`}>Syncing Stock Room...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 pb-24 font-sans transition-colors duration-500 ${themeClasses.bg}`}>

      {/* --- FLOATING HEADER --- */}
      <div className={`p-4 rounded-[2rem] shadow-xl border mb-6 sticky top-4 z-10 ${themeClasses.card} ${themeClasses.border}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Link href="/mobilepos" className={`p-2 rounded-full active:scale-90 transition-all ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <ArrowLeft className={`w-5 h-5 ${themeClasses.text}`} />
            </Link>
            <h1 className={`text-xl font-black tracking-tighter ${themeClasses.text}`}>Stock Room</h1>
          </div>
          <button
            onClick={fetchInventory}
            className="p-3 rounded-2xl active:rotate-180 transition-transform duration-500"
            style={{ backgroundColor: `${accentHex}15`, color: accentHex }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search SKU or Name..."
            className={`w-full h-14 pl-12 pr-4 rounded-2xl text-sm font-bold outline-none border transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'
              }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- INVENTORY GRID --- */}
      <div className="space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isLow = product.status === "Low Stock";
            return (
              <div key={product.dbId} className={`p-5 rounded-[2rem] border shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 ${themeClasses.card} ${themeClasses.border}`}>

                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLow ? "bg-red-500/10 text-red-500" : `bg-blue-500/10`
                    }`} style={!isLow ? { backgroundColor: `${accentHex}15`, color: accentHex } : {}}>
                    {isLow ? <AlertTriangle className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={`font-black text-sm leading-tight ${themeClasses.text}`}>{product.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">SKU: {product.sku}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-black ${isLow ? "text-red-500" : themeClasses.text}`}>
                    {product.stock}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Stock</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 opacity-40">
            <Package size={48} className={`mx-auto mb-4 ${themeClasses.text}`} strokeWidth={1} />
            <p className={`text-xs font-black uppercase tracking-widest ${themeClasses.text}`}>No matches found</p>
          </div>
        )}
      </div>
    </div>
  );
}