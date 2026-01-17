"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, Search, Plus, Filter, AlertTriangle, 
  Building2, ArrowRight, Wallet, LayoutGrid, ArrowLeft 
} from "lucide-react";

// --- TYPES ---
interface ShopSummary {
  id: string;
  name: string;
  location: string;
  itemCount: number;
  totalValue: number;
}

interface Product {
  id: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  priceGHS: number;
  minStock: number;
}

export default function AdminInventoryPage() {
  // VIEW STATE: null = Overview Mode, string = Shop ID (Detail Mode)
  const [selectedShop, setSelectedShop] = useState<ShopSummary | null>(null);
  const [shops, setShops] = useState<ShopSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // MODAL STATE
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "", sku: "", category: "Electronics", price: "", quantity: "", minStock: "5"
  });

  // --- 1. INITIAL LOAD (OVERVIEW) ---
  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    setLoading(true);
    try {
      // In a real API, we would ask the server for these calculated stats.
      // For now, we fetch shops and calculate client-side or use mock data structure if API is simple.
      const res = await fetch("/api/shops");
      if (res.ok) {
        const data = await res.json();
        // Transform the raw shop data into summaries (Mocking value calculation for now)
        const summaries = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          itemCount: s._count?.inventory || 0,
          totalValue: 0 // In V2, API should return this sum
        }));
        setShops(summaries);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FETCH SPECIFIC SHOP INVENTORY ---
  const openShopInventory = async (shop: ShopSummary) => {
    setSelectedShop(shop);
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory?shopId=${shop.id}`);
      if (res.ok) {
        setProducts(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 3. ADD STOCK TO SELECTED SHOP ---
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    const payload = { ...formData, shopId: selectedShop.id };

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Stock Added Successfully");
      setIsAdding(false);
      openShopInventory(selectedShop); // Refresh the table
      setFormData({ name: "", sku: "", category: "Electronics", price: "", quantity: "", minStock: "5" });
    } else {
      alert("Failed to add stock");
    }
  };

  // ==================================================================================
  // VIEW 1: NETWORK OVERVIEW (THE DASHBOARD)
  // ==================================================================================
  if (!selectedShop) {
    return (
      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Inventory Hubs</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Select a retail node to manage stock</p>
        </div>

        {/* HIGH-LEVEL STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-blue-900/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10"><Wallet className="w-16 h-16" /></div>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Total Network Value</p>
             {/* This would be a real calculation in production */}
             <h2 className="text-4xl font-black tracking-tight">₵ 2.4M</h2>
             <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
               <span className="bg-emerald-500/20 px-2 py-1 rounded-md">+12%</span>
               <span>vs last month</span>
             </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
             <div className="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-blue-50 transition-colors"><Building2 className="w-16 h-16" /></div>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Active Hubs</p>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">{shops.length}</h2>
             <p className="mt-4 text-xs font-bold text-slate-400">Retail Locations</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
             <div className="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-amber-50 transition-colors"><AlertTriangle className="w-16 h-16" /></div>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Low Stock Alerts</p>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">8</h2>
             <p className="mt-4 text-xs font-bold text-amber-500">Items requiring restock</p>
          </div>
        </div>

        {/* HUBS GRID */}
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-600" /> Available Shops
          </h3>
          
          {loading ? (
             <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <button 
                  key={shop.id}
                  onClick={() => openShopInventory(shop)}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {shop.name.charAt(0)}
                    </div>
                    <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black uppercase text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      Open
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 mb-1">{shop.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-6">{shop.location}</p>
                  
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-bold text-slate-300 uppercase">Stock Level</p>
                       <p className="font-black text-slate-700">{shop.itemCount} Units</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                       <ArrowRight className="w-4 h-4" />
                     </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================================================================================
  // VIEW 2: SHOP DRILL-DOWN (THE DETAILS)
  // ==================================================================================
  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
      
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedShop(null)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedShop.name}</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Inventory Management</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Add Stock
        </button>
      </div>

      {/* ADD STOCK FORM OVERLAY */}
      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg">Add to {selectedShop.name}</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase">Close</button>
           </div>
           
           <form onSubmit={handleAddStock} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                    <input className="w-full p-3 bg-slate-50 rounded-lg border font-bold text-sm outline-none focus:border-blue-500 transition-colors" onChange={e => setFormData({...formData, name: e.target.value})} required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">SKU / Code</label>
                    <input className="w-full p-3 bg-slate-50 rounded-lg border font-bold text-sm outline-none focus:border-blue-500 transition-colors" onChange={e => setFormData({...formData, sku: e.target.value})} required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                    <input className="w-full p-3 bg-slate-50 rounded-lg border font-bold text-sm outline-none focus:border-blue-500 transition-colors" onChange={e => setFormData({...formData, category: e.target.value})} required />
                 </div>
              </div>

              <div className="md:col-span-3 grid grid-cols-3 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Price (GHS)</label>
                    <input type="number" className="w-full p-3 bg-slate-50 rounded-lg border font-bold text-sm outline-none focus:border-blue-500 transition-colors" onChange={e => setFormData({...formData, price: e.target.value})} required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                    <input type="number" className="w-full p-3 bg-slate-50 rounded-lg border font-bold text-sm outline-none focus:border-blue-500 transition-colors" onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Min Alert</label>
                    <input type="number" className="w-full p-3 bg-slate-50 rounded-lg border font-bold text-sm outline-none focus:border-blue-500 transition-colors" onChange={e => setFormData({...formData, minStock: e.target.value})} />
                 </div>
              </div>

              <div className="md:col-span-3 pt-2">
                 <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-sm shadow-lg hover:bg-blue-700 transition-all">
                    Confirm Inbound Stock
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
           <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>
        ) : products.length === 0 ? (
           <div className="p-12 text-center">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><Package className="w-8 h-8" /></div>
             <p className="text-slate-900 font-bold">No inventory found</p>
             <p className="text-slate-400 text-xs mt-1">Add items to start tracking stock for this hub.</p>
           </div>
        ) : (
          <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">Product</th>
                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SKU</th>
                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">Price</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-4 pl-6 font-bold text-slate-900">{item.productName}</td>
                     <td className="p-4 text-xs font-bold text-slate-500 uppercase">{item.category || "General"}</td>
                     <td className="p-4 text-xs font-mono text-slate-400 text-center">{item.sku}</td>
                     <td className="p-4 text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          item.quantity <= item.minStock ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                        }`}>
                          {item.quantity} Units
                        </span>
                     </td>
                     <td className="p-4 text-right pr-6 font-bold text-slate-700">₵ {item.priceGHS.toLocaleString()}</td>
                  </tr>
                ))}
             </tbody>
          </table>
        )}
      </div>

    </div>
  );
}