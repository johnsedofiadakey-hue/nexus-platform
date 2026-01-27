"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - SHOP COMMAND CENTER
 * VERSION: 25.9.0 (AUDIT TRAIL ENABLED)
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, MapPin, Plus, Package, Edit2, X, 
  Loader2, PackagePlus, AlertTriangle, Hash, Save, Eye, Trash2,
  Navigation, Globe, Smartphone, User, RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";

// --- CATEGORY DATA ---
const CATEGORIES = {
  "HOME_APPLIANCE": [
    "Air Condition", "Refrigerator", "Chest Freezer", 
    "Microwave", "Vacuum Cleaner", "Washing Machine", "Gas Cooker"
  ],
  "HOME_ENTERTAINMENT": [
    "TV", "Audio", "Home Theatre"
  ]
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- MODAL STATES ---
  const [activeModal, setActiveModal] = useState<'NONE' | 'SHOP_FORM' | 'INVENTORY_FORM' | 'INVENTORY_VIEW'>('NONE');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // --- INVENTORY EDIT STATE ---
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  
  // --- FORM DATA ---
  const [shopForm, setShopForm] = useState({
    name: "", 
    location: "", 
    latitude: "", 
    longitude: "", 
    radius: "200", 
    managerName: "", 
    managerPhone: "", 
    openingTime: "08:00 AM"
  });

  const [stockForm, setStockForm] = useState({
    productName: "", 
    modelNumber: "", 
    sku: "", 
    price: "", 
    quantity: "1", 
    minStock: "5", 
    category: "HOME_APPLIANCE", 
    subCategory: "Air Condition"
  });

  // --- INVENTORY VIEW STATE ---
  const [shopInventory, setShopInventory] = useState<any[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [auditChanges, setAuditChanges] = useState<Record<string, number>>({}); 

  // --- 1. DATA SYNCHRONIZATION ---
  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      // 🚀 Using the LIST route for the main grid
      const res = await fetch(`/api/shops/list?t=${Date.now()}`);
      const json = await res.json();
      
      if (Array.isArray(json)) setShops(json);
      else if (json && Array.isArray(json.data)) setShops(json.data);
      else setShops([]);
      
    } catch (error) {
      console.error("Fetch Error", error);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ UPDATED: Fetch Inventory from the SHOP Endpoint (Source of Truth)
  const fetchShopInventory = async (shopId: string) => {
    setLoadingInv(true);
    setSelectedShopId(shopId);
    setActiveModal('INVENTORY_VIEW');
    setAuditChanges({}); 
    
    try {
      // Use the unified endpoint which returns { inventory: [] }
      const res = await fetch(`/api/shops/${shopId}?t=${Date.now()}`);
      const json = await res.json();
      
      // Safety check: Ensure inventory exists
      setShopInventory(json.inventory || []);
    } catch (e) {
      setShopInventory([]);
      toast.error("Failed to load ledger");
    } finally {
      setLoadingInv(false);
    }
  };

  // --- 2. MODAL LOGIC ---
  const openCreateShop = () => {
    setShopForm({ name: "", location: "", latitude: "", longitude: "", radius: "200", managerName: "", managerPhone: "", openingTime: "08:00 AM" });
    setIsEditing(false);
    setActiveModal('SHOP_FORM');
  };

  const openEditShop = (shop: any) => {
    setShopForm({
      name: shop.name, 
      location: shop.location || "",
      latitude: shop.latitude?.toString() || "", 
      longitude: shop.longitude?.toString() || "",
      radius: shop.radius?.toString() || "200",
      managerName: shop.managerName || "", 
      managerPhone: shop.managerPhone || "",
      openingTime: shop.openingTime || "08:00 AM"
    });
    setIsEditing(true);
    setSelectedShopId(shop.id);
    setActiveModal('SHOP_FORM');
  };

  const openAddStock = (shopId: string) => {
    setSelectedShopId(shopId);
    setIsEditingStock(false); 
    setStockForm({
      productName: "", modelNumber: "", sku: `SKU-${Math.floor(Math.random() * 10000)}`, 
      price: "", quantity: "10", minStock: "5", category: "HOME_APPLIANCE", subCategory: "Air Condition"
    });
    setActiveModal('INVENTORY_FORM');
  };

  const openEditStockItem = (item: any) => {
    setEditingStockId(item.id); 
    setIsEditingStock(true);
    setStockForm({
      productName: item.productName || item.name || "",
      modelNumber: "", 
      sku: item.sku || "", 
      price: (item.priceGHS || item.price || 0).toString(), 
      quantity: (item.quantity || 0).toString(), 
      minStock: (item.minStock || 5).toString(), 
      category: item.category || "HOME_APPLIANCE", 
      subCategory: item.subCategory || "Air Condition"
    });
    setActiveModal('INVENTORY_FORM');
  };

  // --- 3. SUBMISSIONS & PERSISTENCE ---
  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = toast.loading("Nexus: Syncing Hub Data...");
    
    // Assuming standard Create/Update logic for shops
    try {
      const res = await fetch("/api/shops/list", { 
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           ...shopForm,
           latitude: parseFloat(shopForm.latitude),
           longitude: parseFloat(shopForm.longitude),
           radius: parseInt(shopForm.radius)
        })
      });

      if (res.ok) {
        toast.success("Hub Identity Secured", { id: t });
        setActiveModal('NONE');
        fetchShops();
      } else {
        throw new Error("Registry Update Denied");
      }
    } catch (error) {
       toast.error("Network Error", { id: t });
    }
  };

  // 🛡️ UPDATED: HANDLES BOTH ADD AND EDIT WITH AUDIT TRAIL
  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedShopId) return;

    const t = toast.loading("Syncing Ledger...");
    
    // 1. Prepare Data
    const finalProductName = (!isEditingStock && stockForm.modelNumber) 
      ? `${stockForm.productName} (${stockForm.modelNumber})` 
      : stockForm.productName;

    const payload = { 
      ...stockForm, 
      productName: finalProductName, // Map 'name' to 'productName'
      priceGHS: stockForm.price,     // Map 'price' to 'priceGHS'
      id: isEditingStock ? editingStockId : undefined // If ID exists, it updates. If undefined, it creates.
    }; 

    try {
      // 2. Send to Unified God Mode Route
      const res = await fetch(`/api/shops/${selectedShopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseJson = await res.json(); // <--- This contains the 'audit' data

      if (res.ok) {
        // 3. ✨ DISPLAY AUDIT TRAIL ✨
        const auditInfo = responseJson.audit;
        // Format time nicely (e.g., "10:45 AM")
        const time = auditInfo?.date ? new Date(auditInfo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
        
        // Show context-aware success message
        if (isEditingStock) {
           toast.success(`Updated at ${time} | New Total: ${auditInfo?.newTotal}`, { id: t });
        } else {
           toast.success(`Added at ${time} | Qty: ${auditInfo?.qtyAdded}`, { id: t });
        }

        // 4. Refresh List & Switch View
        if (selectedShopId) {
           await fetchShopInventory(selectedShopId);
           if(activeModal !== 'INVENTORY_VIEW') setActiveModal('INVENTORY_VIEW');
           fetchShops(); // Refresh main list counts
        }

        // Reset Form
        if (!isEditingStock) {
           setStockForm({
             productName: "", modelNumber: "", sku: `SKU-${Math.floor(Math.random() * 10000)}`, 
             price: "", quantity: "1", minStock: "5", category: "HOME_APPLIANCE", subCategory: "Air Condition"
           });
        }
      } else {
        throw new Error(responseJson.error || responseJson.message || "Inventory Rejected");
      }
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
  };

  const handleDeleteStock = async (itemId: string) => {
    if (!confirm("Permanent deletion will purge stock history. Continue?")) return;
    const t = toast.loading("Purging...");
    try {
      // 🚀 TARGET: Unified God Mode Route (DELETE)
      const res = await fetch(`/api/shops/${selectedShopId}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId })
      });
      
      if (res.ok) {
        setShopInventory(prev => prev.filter(i => i.id !== itemId));
        toast.success("Item Purged", { id: t });
        fetchShops(); // Update count on main card
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error("Operation Failed", { id: t });
    }
  };

  // Local optimistic update for audit
  const adjustStock = (itemId: string, delta: number) => {
    setShopInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(0, (item.quantity || 0) + delta) };
      }
      return item;
    }));
    setAuditChanges(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + delta }));
  };

  return (
    <div className="p-10 max-w-[1650px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* HEADER COMMANDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Hub Registry</h1>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.4em]">Geofencing & Inventory Authority</p>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={fetchShops}
             className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
             <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={openCreateShop}
            className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Register New Hub
          </button>
        </div>
      </div>

      {/* --- MODAL: HUB REGISTRATION --- */}
      {activeModal === 'SHOP_FORM' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div>
                 <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">{isEditing ? "Modify Hub Identity" : "New Node Enrollment"}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure Geofence Coordinates</p>
               </div>
               <button onClick={() => setActiveModal('NONE')} className="w-10 h-10 flex items-center justify-center hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleShopSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hub Name</label>
                 <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" 
                   onChange={e => setShopForm({...shopForm, name: e.target.value})} value={shopForm.name} required placeholder="Melcom Accra Mall" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">City / Location</label>
                 <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, location: e.target.value})} value={shopForm.location} required />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 text-blue-500"><Navigation className="w-3 h-3"/> Latitude</label>
                 <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, latitude: e.target.value})} value={shopForm.latitude} required placeholder="5.6037" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 text-blue-500"><Navigation className="w-3 h-3"/> Longitude</label>
                 <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, longitude: e.target.value})} value={shopForm.longitude} required placeholder="-0.1870" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Radius Boundary (Meters)</label>
                 <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, radius: e.target.value})} value={shopForm.radius} placeholder="200" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hub Manager</label>
                 <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, managerName: e.target.value})} value={shopForm.managerName} />
              </div>
              <div className="md:col-span-2 flex gap-4 pt-6">
                <button type="button" onClick={() => setActiveModal('NONE')} className="px-10 py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-50 text-[10px] uppercase tracking-widest">Discard</button>
                <button type="submit" className="flex-1 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all">
                  Confirm Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- GRID LIST --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Syncing Nexus Satellite...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white p-1 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all relative group overflow-hidden">
               <div className="p-8">
                {/* Hub Context */}
                <div className="flex items-center justify-between mb-8">
                   <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl">
                      {shop.name.charAt(0)}
                   </div>
                   <button 
                     onClick={() => openEditShop(shop)}
                     className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
                   >
                     <Edit2 className="w-5 h-5" />
                   </button>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tighter uppercase">{shop.name}</h3>
                
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-10">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {shop.location}
                </div>

                <div className="space-y-6 border-t border-slate-50 pt-8">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Geofence</p>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{shop.radius}m Radius</p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Level</p>
                        <p className="text-xs font-black text-emerald-500 uppercase tracking-tighter">
                            {/* LIVE COUNT from _count */}
                            {shop._count?.inventory !== undefined ? `${shop._count.inventory} Items` : "Active"}
                        </p>
                     </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => openAddStock(shop.id)}
                      className="flex-1 h-12 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center gap-2 hover:border-blue-200 hover:text-blue-600 transition-all font-black text-[9px] uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" /> Add SKU
                    </button>
                    <button 
                      onClick={() => fetchShopInventory(shop.id)}
                      className="flex-1 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all font-black text-[9px] uppercase tracking-widest shadow-xl"
                    >
                      <Eye className="w-4 h-4" /> Inventory
                    </button>
                  </div>
                </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* --- INVENTORY VIEW --- */}
      {activeModal === 'INVENTORY_VIEW' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border-8 border-white animate-in zoom-in duration-300">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <div className="flex items-center gap-5">
                 <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                   <Package className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase">Hub Ledger</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Stock Verification & Audit</p>
                 </div>
               </div>
               <button onClick={() => setActiveModal('NONE')} className="w-12 h-12 flex items-center justify-center hover:bg-red-50 hover:text-red-500 rounded-full transition-all border border-slate-100"><X className="w-7 h-7" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 bg-white">
              {loadingInv ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Fetching Ledger...</p>
                </div>
              ) : shopInventory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                  <Package className="w-20 h-20 mb-4" />
                  <p className="font-black text-slate-900 uppercase tracking-[0.5em]">Node Empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shopInventory.map((item) => {
                    const stockId = item.id;
                    const qty = item.quantity ?? 0;
                    const isLow = qty <= (item.minStock || 5);
                    const displayName = item.productName || item.name;
                    const price = item.priceGHS || item.price;
                    
                    return (
                    <div key={stockId} className="group p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-blue-100 transition-all bg-white shadow-sm hover:shadow-md">
                       <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLow ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                            {isLow ? <AlertTriangle className="w-7 h-7" /> : <Package className="w-7 h-7" />}
                          </div>
                          <div>
                            <h4 className="font-black text-lg text-slate-900 tracking-tight">{displayName}</h4>
                            <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                               <span className="text-blue-500">{item.sku}</span>
                               <span className="text-slate-200">/</span>
                               <span>{item.category || "General"}</span>
                            </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-8">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">MSRP</p>
                             <p className="font-black text-base text-slate-900 tabular-nums font-mono tracking-tighter">₵ {price}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                             <span className={`w-12 text-center font-black text-lg tabular-nums ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{qty}</span>
                          </div>

                          <div className="flex items-center gap-2">
                             <button onClick={() => openEditStockItem(item)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center"><Edit2 size={20} /></button>
                             <button onClick={() => handleDeleteStock(stockId)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"><Trash2 size={20} /></button>
                          </div>
                       </div>
                    </div>
                  );
                 })}
                </div>
              )}
            </div>
            <div className="p-10 border-t bg-slate-50/50 flex-shrink-0 flex justify-end gap-4">
               <button onClick={() => { setIsEditingStock(false); openAddStock(selectedShopId!); }} className="h-14 px-10 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl flex items-center gap-3">
                 <PackagePlus className="w-5 h-5" /> Enroll SKU
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: INVENTORY FORM --- */}
      {activeModal === 'INVENTORY_FORM' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div>
                 <h3 className="font-black text-xl text-slate-900 tracking-tight uppercase">{isEditingStock ? "Update Ledger Item" : "New SKU Enrollment"}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">LG / Samsung Product Authority</p>
               </div>
               <button onClick={() => setActiveModal(isEditingStock ? 'INVENTORY_VIEW' : 'NONE')} className="w-10 h-10 flex items-center justify-center hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleStockSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Designation</label>
                 <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 focus:bg-white" 
                   value={stockForm.productName} onChange={e => setStockForm({...stockForm, productName: e.target.value})} required placeholder="LG OLED C3 65 inch" />
              </div>
              
              {!isEditingStock && (
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Model Designation</label>
                   <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                     value={stockForm.modelNumber} onChange={e => setStockForm({...stockForm, modelNumber: e.target.value})} placeholder="OLED65C3PSA" />
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authority SKU Code</label>
                 <input className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   value={stockForm.sku} onChange={e => setStockForm({...stockForm, sku: e.target.value})} required placeholder="LG-TV-001" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authority Price (GHS)</label>
                 <input type="number" className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   value={stockForm.price} onChange={e => setStockForm({...stockForm, price: e.target.value})} required />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Initial Inventory Level</label>
                 <input type="number" className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm" 
                   value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Alert Level</label>
                 <input type="number" className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm" 
                   value={stockForm.minStock} onChange={e => setStockForm({...stockForm, minStock: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Class</label>
                 <select className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500"
                   value={stockForm.category} onChange={e => setStockForm({...stockForm, category: e.target.value, subCategory: CATEGORIES[e.target.value as keyof typeof CATEGORIES][0]})}>
                   <option value="HOME_APPLIANCE">Home Appliance</option>
                   <option value="HOME_ENTERTAINMENT">Home Entertainment</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sub-Class Designation</label>
                 <select className="w-full h-14 px-5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500"
                   value={stockForm.subCategory} onChange={e => setStockForm({...stockForm, subCategory: e.target.value})}>
                   {CATEGORIES[stockForm.category as keyof typeof CATEGORIES].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                 </select>
              </div>
              <div className="md:col-span-2 pt-8">
                <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                   <PackagePlus className="w-5 h-5" /> {isEditingStock ? "Synchronize Item" : "Authorize Ledger Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}