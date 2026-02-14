"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Building2, MapPin, Package, Plus, Search, ArrowRight, Save, Loader2, Monitor, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ShopInventoryManager() {
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // --- FORM STATE ---
  const [updateForm, setUpdateForm] = useState({
    itemId: "",
    quantity: "",
    action: "INBOUND (+)"
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shops/list");
      const json = await res.json();
      const shopList = Array.isArray(json) ? json : json.data || [];
      setShops(shopList);
      if (shopList.length > 0 && !selectedShop) {
        setSelectedShop(shopList[0]);
      }
    } catch (e) {
      toast.error("Nexus: Hub registry sync failed");
    } finally {
      setLoading(false);
    }
  }, [selectedShop]);

  const fetchShopInventory = useCallback(async (shopId: string) => {
    try {
      const res = await fetch(`/api/inventory?shopId=${shopId}`);
      const payload = await res.json();
      const inner = payload?.data ?? payload;
      const rows = inner?.items ?? inner;
      setInventory(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("Failed to load node inventory");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectedShop?.id) fetchShopInventory(selectedShop.id);
  }, [selectedShop, fetchShopInventory]);

  const handleCommitUpdate = async () => {
    if (!updateForm.itemId || !updateForm.quantity) return toast.error("Specify SKU and Quantity");
    
    setSyncing(true);
    const t = toast.loading("Nexus: Authorizing Ledger Update...");
    
    try {
      // Calculate final quantity based on action
      const currentItem = inventory.find(i => i.id === updateForm.itemId);
      const currentQty = currentItem?.quantity || 0;
      const adjustment = parseInt(updateForm.quantity);
      
      let newQty = currentQty;
      if (updateForm.action === "INBOUND (+)") newQty += adjustment;
      if (updateForm.action === "OUTBOUND (-)") newQty = Math.max(0, currentQty - adjustment);
      if (updateForm.action === "AUDIT (REPLACE)") newQty = adjustment;

      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updateForm.itemId, quantity: newQty })
      });

      if (res.ok) {
        toast.success("Ledger Synchronized", { id: t });
        fetchShopInventory(selectedShop.id);
        setUpdateForm({ ...updateForm, quantity: "" });
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error("Nexus: Sync rejected", { id: t });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px] animate-in fade-in duration-500">
      {/* 🏛️ HUB REGISTRY LEDGER */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2rem] flex flex-col overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Retail Nodes</h3>
            <span className="text-[8px] font-bold text-blue-500 uppercase">Geofence Registry</span>
          </div>
          {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {shops.map((shop) => (
            <div 
              key={shop.id} 
              onClick={() => setSelectedShop(shop)}
              className={`p-6 cursor-pointer transition-all flex items-center justify-between group ${selectedShop?.id === shop.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${selectedShop?.id === shop.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                  {shop.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{shop.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={10} className="text-slate-300" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{shop.location}</p>
                  </div>
                </div>
              </div>
              <ArrowRight size={14} className={`transition-transform ${selectedShop?.id === shop.id ? 'translate-x-0 opacity-100 text-blue-600' : '-translate-x-2 opacity-0'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 📦 NODE CONTROL INTERFACE */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm">
        <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedShop?.name || "Initializing..."}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Stock Allocation Authority</p>
            </div>
          </div>
          <div className="flex gap-3">
             <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Node Active</span>
             </div>
          </div>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* 🛠️ QUICK UPDATE FORM */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
               <Package size={14} className="text-blue-500" />
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Adjustment</h4>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Authority SKU</label>
                <select 
                  value={updateForm.itemId}
                  onChange={(e) => setUpdateForm({ ...updateForm, itemId: e.target.value })}
                  className="w-full h-14 border border-slate-200 rounded-2xl px-5 text-xs font-black bg-slate-50 outline-none focus:border-blue-500 transition-all"
                >
                  <option value="">Choose item to adjust...</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                  <input 
                    type="number" 
                    value={updateForm.quantity}
                    onChange={(e) => setUpdateForm({ ...updateForm, quantity: e.target.value })}
                    placeholder="0" 
                    className="w-full h-14 border border-slate-200 rounded-2xl px-5 text-sm font-black outline-none focus:bg-white transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operation</label>
                  <select 
                    value={updateForm.action}
                    onChange={(e) => setUpdateForm({ ...updateForm, action: e.target.value })}
                    className="w-full h-14 border border-slate-200 rounded-2xl px-5 text-xs font-black bg-white outline-none focus:border-blue-500 transition-all"
                  >
                    <option>INBOUND (+)</option>
                    <option>OUTBOUND (-)</option>
                    <option>AUDIT (REPLACE)</option>
                  </select>
                </div>
              </div>
              
              <button 
                onClick={handleCommitUpdate}
                disabled={syncing}
                className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {syncing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                Commit Ledger Update
              </button>
            </div>
          </div>

          {/* 📊 LIVE NODE INVENTORY VIEW */}
          <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 flex flex-col">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Current Node State</h4>
            <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
              {inventory.length === 0 ? (
                <div className="py-20 text-center opacity-20 grayscale">
                   <Package size={40} className="mx-auto mb-2" />
                   <p className="text-[9px] font-black uppercase tracking-widest">Node Empty</p>
                </div>
              ) : inventory.map((item, i) => {
                const isLow = item.quantity <= (item.minStock || 5);
                return (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLow ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                        {isLow ? <AlertCircle size={18} /> : <Monitor size={18} />}
                      </div>
                      <div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.name}</span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black tabular-nums ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity}</span>
                      <p className={`text-[8px] font-black uppercase tracking-tighter ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>{isLow ? 'Restock' : 'Stable'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}