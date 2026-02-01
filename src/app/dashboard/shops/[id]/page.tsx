"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft, MapPin, Package, Plus, Trash2, X, Loader2,
  Barcode, ArrowUpCircle, Building2, Search, Filter, MoreHorizontal
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

// 🛡️ USE THE STABLE GEOFENCE MAP (Fixes Crash)
const GeofenceMap = dynamic(
  () => import("@/components/maps/GeofenceMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center border border-slate-200 rounded-md">
         <Loader2 className="w-5 h-5 text-slate-400 animate-spin mb-2" />
         <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Loading Satellite...</span>
      </div>
    )
  }
);

export default function ShopDetailPortal() {
  const params = useParams();
  const shopId = params?.id as string;

  const [shop, setShop] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    productName: "",
    sku: "",
    priceGHS: "",
    quantity: "",
    minStock: "5"
  });

  // ---------------- FETCH DATA ----------------
  const syncHub = useCallback(async () => {
    try {
      if (!shop) setLoading(true);
      const [shopRes, invRes] = await Promise.all([
        fetch(`/api/shops/${shopId}`),
        fetch(`/api/shops/${shopId}/inventory`)
      ]);

      if (!shopRes.ok) throw new Error("Fetch failed");
      
      const shopData = await shopRes.json();
      const invData = await invRes.json();

      setShop(shopData);
      setInventory(Array.isArray(invData) ? invData : []);
    } catch (e) {
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  }, [shopId, shop]);

  useEffect(() => {
    if (shopId) syncHub();
  }, [shopId, syncHub]);

  // ---------------- ACTIONS ----------------
  const submitInventory = async () => {
    if (!newItem.productName || !newItem.priceGHS) return toast.error("Name & Price required");

    const t = toast.loading("Saving...");
    try {
      const res = await fetch(`/api/shops/${shopId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: newItem.productName.trim(),
          sku: newItem.sku.trim(),
          priceGHS: newItem.priceGHS,
          quantity: newItem.quantity,
          minStock: newItem.minStock
        })
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success("Inventory Added", { id: t });
      setShowModal(false);
      setNewItem({ productName: "", sku: "", priceGHS: "", quantity: "", minStock: "5" });
      syncHub();
    } catch (e) { toast.error("Failed", { id: t }); }
  };

  const handleRestock = async (productId: string) => {
    const amountStr = prompt("Units to add:");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    setRestockingId(productId);
    try {
      const res = await fetch(`/api/shops/${shopId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESTOCK", productId, amount })
      });
      if (res.ok) { toast.success("Stock Updated"); syncHub(); } 
      else { toast.error("Failed"); }
    } finally { setRestockingId(null); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Permanently delete item?")) return;
    const t = toast.loading("Deleting...");
    try {
      await fetch(`/api/shops/${shopId}/inventory`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      toast.success("Deleted", { id: t });
      syncHub();
    } catch { toast.error("Error", { id: t }); }
  };

  // Filter Inventory
  const filteredInventory = inventory.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-6 h-6 text-slate-900 animate-spin" />
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Hub Data...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/shops" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{shop?.name}</h1>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin size={12} /> {shop?.location || "No Location"} 
              <span className="text-slate-300">|</span> 
              <span className="font-bold text-slate-700">{inventory.length} SKUs</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={syncHub}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50 transition-all"
            >
                Refresh Data
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-3 py-2 bg-slate-900 text-white border border-slate-900 rounded-md text-xs font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={14} /> Add Inventory
            </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-[1920px] mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* LEFT: SATELLITE MAP (5/12) */}
        <div className="col-span-12 lg:col-span-5 h-[600px] flex flex-col space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-1 shadow-sm flex-1 flex flex-col">
                <div className="flex-1 relative bg-slate-100 rounded overflow-hidden">
                    {/* 🛡️ USING THE STABLE MAP */}
                    <GeofenceMap
                        shopLat={shop?.latitude || 5.6037}
                        shopLng={shop?.longitude || -0.1870}
                        shopRadius={shop?.radius || 50}
                        // Admin doesn't have a user location to show here, so we omit userLat/Lng
                    />
                    <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                            <Building2 size={12}/> Hub Location Verification
                        </p>
                    </div>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-lg">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Geofence Radius</span>
                    <span className="text-xs font-mono font-bold text-slate-700">{shop?.radius} Meters</span>
                </div>
            </div>
        </div>

        {/* RIGHT: INVENTORY LEDGER (7/12) */}
        <div className="col-span-12 lg:col-span-7 h-[600px] flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm">
          
          {/* Toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
                <Package size={14} className="text-slate-500"/>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Stock Ledger</span>
            </div>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    className="h-8 pl-9 pr-4 bg-white border border-slate-200 rounded-md text-xs focus:border-blue-500 outline-none w-48 transition-all"
                    placeholder="Search SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0 z-10">
                    <tr>
                        <th className="px-5 py-3 border-b border-slate-200">Item</th>
                        <th className="px-5 py-3 border-b border-slate-200 text-right">Price</th>
                        <th className="px-5 py-3 border-b border-slate-200 text-center">Stock</th>
                        <th className="px-5 py-3 border-b border-slate-200 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-3">
                                <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                    <Barcode size={10} /> {item.barcode}
                                </p>
                            </td>
                            <td className="px-5 py-3 text-right">
                                <p className="font-mono font-bold text-slate-700">₵{item.sellingPrice?.toFixed(2)}</p>
                            </td>
                            <td className="px-5 py-3 text-center">
                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    item.stockLevel < 5 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                    {item.stockLevel} Units
                                </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleRestock(item.id)}
                                        disabled={restockingId === item.id}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-100"
                                    >
                                        {restockingId === item.id ? <Loader2 size={14} className="animate-spin"/> : <ArrowUpCircle size={14} />}
                                    </button>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors border border-transparent hover:border-rose-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredInventory.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-20 text-center text-slate-400 text-xs font-medium">
                                No inventory records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-800">New SKU Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product Name</label>
                  <input
                    placeholder="e.g. 42-inch LCD Monitor"
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    value={newItem.productName}
                    onChange={e => setNewItem({ ...newItem, productName: e.target.value })}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SKU / Barcode</label>
                    <input
                        placeholder="Scan..."
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        value={newItem.sku}
                        onChange={e => setNewItem({ ...newItem, sku: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price (GHS)</label>
                    <input
                        type="number"
                        placeholder="0.00"
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        value={newItem.priceGHS}
                        onChange={e => setNewItem({ ...newItem, priceGHS: e.target.value })}
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial Qty</label>
                    <input
                        type="number"
                        placeholder="0"
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        value={newItem.quantity}
                        onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Alert</label>
                    <input
                        type="number"
                        placeholder="5"
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        value={newItem.minStock}
                        onChange={e => setNewItem({ ...newItem, minStock: e.target.value })}
                    />
                </div>
              </div>

              <button
                onClick={submitInventory}
                className="w-full h-10 bg-slate-900 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md mt-2"
              >
                Save to Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}