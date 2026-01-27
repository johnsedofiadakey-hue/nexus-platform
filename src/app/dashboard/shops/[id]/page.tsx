"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Package,
  Plus,
  Trash2,
  X,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

const NodeLiveMap = dynamic(
  () => import("@/components/maps/LiveMap"),
  { ssr: false }
);

export default function ShopDetailPortal() {
  const params = useParams();
  const shopId = params?.id as string;

  const [shop, setShop] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    productName: "",
    sku: "",
    priceGHS: "",
    quantity: ""
  });

  // ---------------- FETCH SHOP + INVENTORY ----------------
  const syncHub = useCallback(async () => {
    try {
      setLoading(true);

      const shopRes = await fetch(`/api/shops/${shopId}`);
      if (!shopRes.ok) throw new Error("Shop fetch failed");
      const shopData = await shopRes.json();
      setShop(shopData);

      const invRes = await fetch(`/api/shops/${shopId}/inventory`);
      const invData = await invRes.json();
      setInventory(Array.isArray(invData) ? invData : []);
    } catch (e) {
      toast.error("Failed to sync shop");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopId) syncHub();
  }, [shopId, syncHub]);

  // ---------------- ADD INVENTORY ----------------
  const submitInventory = async () => {
    if (!newItem.productName || !newItem.priceGHS) {
      return toast.error("Product name and price required");
    }

    const t = toast.loading("Saving inventory...");
    try {
      const res = await fetch(`/api/shops/${shopId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: newItem.productName.trim(),
          sku: newItem.sku.trim(),
          priceGHS: newItem.priceGHS,
          quantity: newItem.quantity
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ INVENTORY ERROR:", data);
        throw new Error(data.error || "Save failed");
      }

      toast.success("Inventory saved", { id: t });
      setShowModal(false);
      setNewItem({ productName: "", sku: "", priceGHS: "", quantity: "" });
      syncHub();
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
  };

  // ---------------- DELETE INVENTORY ----------------
  const deleteItem = async (id: string) => {
    if (!confirm("Remove this item?")) return;

    const t = toast.loading("Deleting...");
    try {
      const res = await fetch(`/api/shops/${shopId}/inventory`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Item removed", { id: t });
      syncHub();
    } catch {
      toast.error("Delete failed", { id: t });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/shops"
          className="h-10 w-10 flex items-center justify-center bg-white border rounded-lg"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black">{shop?.name}</h1>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin size={12} /> {shop?.location}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* MAP */}
        <div className="xl:col-span-7 bg-white rounded-3xl p-2 h-[480px]">
          <NodeLiveMap
            shops={shop ? [shop] : []}
            reps={shop?.users || []}
            mapType="SATELLITE"
          />
        </div>

        {/* INVENTORY */}
        <div className="xl:col-span-5 bg-white rounded-3xl border flex flex-col h-[480px]">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <span className="text-xs font-black uppercase">Inventory</span>
            <button
              onClick={() => setShowModal(true)}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {inventory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-300">
                <Package size={40} />
              </div>
            ) : (
              inventory.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 border rounded-xl"
                >
                  <div>
                    <p className="font-bold text-sm">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 uppercase">
                      SKU: {item.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-black">₵{item.priceGHS.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.quantity} units
                      </p>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-slate-300 hover:text-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-lg">Add Inventory</h2>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <input
              placeholder="Product Name"
              className="w-full border rounded-xl h-12 px-4"
              value={newItem.productName}
              onChange={e =>
                setNewItem({ ...newItem, productName: e.target.value })
              }
            />

            <input
              placeholder="SKU (optional)"
              className="w-full border rounded-xl h-12 px-4"
              value={newItem.sku}
              onChange={e =>
                setNewItem({ ...newItem, sku: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Price (GHS)"
              className="w-full border rounded-xl h-12 px-4"
              value={newItem.priceGHS}
              onChange={e =>
                setNewItem({ ...newItem, priceGHS: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Quantity"
              className="w-full border rounded-xl h-12 px-4"
              value={newItem.quantity}
              onChange={e =>
                setNewItem({ ...newItem, quantity: e.target.value })
              }
            />

            <button
              onClick={submitInventory}
              className="w-full bg-blue-600 text-white h-12 rounded-xl font-bold"
            >
              Save Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
