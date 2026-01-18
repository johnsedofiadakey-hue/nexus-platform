"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, MapPin, Plus, User, Package, Edit2, Phone, X, 
  Loader2, Clock, PackagePlus, AlertTriangle, Hash, Search, Save, Minus, Eye, Trash2
} from "lucide-react";

// --- CATEGORY DATA (LG/Samsung Context) ---
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
    name: "", location: "", lat: "", lng: "", radius: "150", 
    managerName: "", managerPhone: "", openingTime: "08:00 AM"
  });

  const [stockForm, setStockForm] = useState({
    productName: "", modelNumber: "", sku: "", price: "", 
    quantity: "1", minStock: "5", category: "HOME_APPLIANCE", subCategory: "Air Condition"
  });

  // --- INVENTORY VIEW STATE ---
  const [shopInventory, setShopInventory] = useState<any[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [auditChanges, setAuditChanges] = useState<Record<string, number>>({}); // Track unsaved edits

  // --- 1. LOAD DATA ---
  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops?t=${Date.now()}`);
      if (res.ok) setShops(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const fetchShopInventory = async (shopId: string) => {
    setLoadingInv(true);
    setSelectedShopId(shopId);
    setActiveModal('INVENTORY_VIEW');
    setAuditChanges({}); // Reset unsaved changes
    try {
      const res = await fetch(`/api/inventory?shopId=${shopId}&t=${Date.now()}`);
      if (res.ok) setShopInventory(await res.json());
    } finally {
      setLoadingInv(false);
    }
  };

  // --- ACTIONS: MODAL OPENERS ---
  const openCreateShop = () => {
    setShopForm({ name: "", location: "", lat: "", lng: "", radius: "150", managerName: "", managerPhone: "", openingTime: "08:00 AM" });
    setIsEditing(false);
    setActiveModal('SHOP_FORM');
  };

  const openEditShop = (shop: any) => {
    setShopForm({
      name: shop.name, location: shop.location || "",
      lat: shop.latitude?.toString() || "", lng: shop.longitude?.toString() || "",
      radius: shop.radius?.toString() || "150",
      managerName: shop.managerName || "", managerPhone: shop.managerPhone || "",
      openingTime: shop.openingTime || "08:00 AM"
    });
    setIsEditing(true);
    setSelectedShopId(shop.id);
    setActiveModal('SHOP_FORM');
  };

  const openAddStock = (shopId: string) => {
    setSelectedShopId(shopId);
    setIsEditingStock(false); // Ensure we are in Add mode
    setStockForm({
      productName: "", modelNumber: "", sku: `SKU-${Math.floor(Math.random() * 10000)}`, 
      price: "", quantity: "10", minStock: "5", category: "HOME_APPLIANCE", subCategory: "Air Condition"
    });
    setActiveModal('INVENTORY_FORM');
  };

  // Open Edit Modal for a specific Item
  const openEditStockItem = (item: any) => {
    setEditingStockId(item.dbId);
    setIsEditingStock(true);
    setStockForm({
      productName: item.name, 
      modelNumber: "", // Name usually includes model now
      sku: item.sku || "", 
      price: item.price.toString(), 
      quantity: item.stock.toString(), 
      minStock: item.minStock?.toString() || "5", 
      category: "HOME_APPLIANCE", 
      subCategory: item.subCat
    });
    setActiveModal('INVENTORY_FORM');
  };

  // --- ACTIONS: SUBMISSIONS ---
  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? "PATCH" : "POST";
    const payload = isEditing ? { ...shopForm, id: selectedShopId } : shopForm;

    try {
      const res = await fetch("/api/shops", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setActiveModal('NONE');
        fetchShops();
      } else {
        alert("Operation failed. Check inputs.");
      }
    } catch (error) {
      alert("Network Error");
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Merge Model Number into Name if adding new
    const finalProductName = (!isEditingStock && stockForm.modelNumber) 
      ? `${stockForm.productName} (${stockForm.modelNumber})` 
      : stockForm.productName;

    const payload = isEditingStock 
      ? { ...stockForm, productName: finalProductName, id: editingStockId } // PATCH payload
      : { ...stockForm, productName: finalProductName, shopId: selectedShopId }; // POST payload

    const method = isEditingStock ? "PATCH" : "POST";

    try {
      const res = await fetch("/api/inventory", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isEditingStock ? "Item Updated!" : "Inventory Added!");
        setActiveModal('NONE');
        // If we came from the view modal, refresh it
        if(selectedShopId) fetchShopInventory(selectedShopId);
        fetchShops(); 
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error || "Unknown Error"}`);
      }
    } catch (e) {
      alert("Connection Error");
    }
  };

  // Delete Stock
  const handleDeleteStock = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/inventory?id=${itemId}`, { method: "DELETE" });
      
      if (res.ok) {
        setShopInventory(prev => prev.filter(i => i.dbId !== itemId));
        alert("Item Deleted.");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert("Network Error");
    }
  };

  // --- ACTIONS: AUDIT LOGIC ---
  const adjustStock = (itemId: string, currentQty: number, delta: number) => {
    // 1. Optimistic Update (Visual)
    setShopInventory(prev => prev.map(item => {
      if (item.dbId === itemId) {
        return { ...item, stock: Math.max(0, item.stock + delta) };
      }
      return item;
    }));
    
    // 2. Track Change
    setAuditChanges(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || currentQty) + delta
    }));
  };

  const saveAudit = async (itemId: string, newQty: number) => {
    try {
      await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, quantity: newQty })
      });
      
      // Clear dirty state
      const newAudits = { ...auditChanges };
      delete newAudits[itemId];
      setAuditChanges(newAudits);
      
      fetchShops(); 
    } catch (e) {
      alert("Save failed");
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Shop Locations</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Physical Retail Network</p>
        </div>
        <button 
          onClick={openCreateShop}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* --- MODAL: CREATE/EDIT SHOP --- */}
      {activeModal === 'SHOP_FORM' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                 <h3 className="font-black text-lg text-slate-900">{isEditing ? "Edit Shop" : "New Location"}</h3>
               </div>
               <button onClick={() => setActiveModal('NONE')} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleShopSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop Name</label>
                 <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, name: e.target.value})} value={shopForm.name} required />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                 <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, location: e.target.value})} value={shopForm.location} required />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lat</label>
                 <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, lat: e.target.value})} value={shopForm.lat} required />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lng</label>
                 <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, lng: e.target.value})} value={shopForm.lng} required />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radius (M)</label>
                 <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, radius: e.target.value})} value={shopForm.radius} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager</label>
                 <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   onChange={e => setShopForm({...shopForm, managerName: e.target.value})} value={shopForm.managerName} />
              </div>
              <div className="md:col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => setActiveModal('NONE')} className="px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 text-[10px] uppercase">Cancel</button>
                <button type="submit" className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-slate-800">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD/EDIT INVENTORY --- */}
      {activeModal === 'INVENTORY_FORM' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                 <h3 className="font-black text-lg text-slate-900">{isEditingStock ? "Edit Item Details" : "Add Stock to Hub"}</h3>
                 <p className="text-xs text-slate-500 font-medium">LG/Samsung Product Entry</p>
               </div>
               <button onClick={() => setActiveModal(isEditingStock ? 'INVENTORY_VIEW' : 'NONE')} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleStockSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</label>
                 <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   value={stockForm.productName} onChange={e => setStockForm({...stockForm, productName: e.target.value})} required />
              </div>
              
              {!isEditingStock && (
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Hash className="w-3 h-3" /> Model Number
                   </label>
                   <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                     value={stockForm.modelNumber} onChange={e => setStockForm({...stockForm, modelNumber: e.target.value})} />
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Code</label>
                 <input className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   value={stockForm.sku} onChange={e => setStockForm({...stockForm, sku: e.target.value})} required />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price (GHS)</label>
                 <input type="number" className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" 
                   value={stockForm.price} onChange={e => setStockForm({...stockForm, price: e.target.value})} required />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Stock</label>
                 <input type="number" className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm" 
                   value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Alert Level</label>
                 <input type="number" className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm" 
                   value={stockForm.minStock} onChange={e => setStockForm({...stockForm, minStock: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                 <select className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500"
                   value={stockForm.category} onChange={e => setStockForm({...stockForm, category: e.target.value, subCategory: CATEGORIES[e.target.value as keyof typeof CATEGORIES][0]})}>
                   <option value="HOME_APPLIANCE">Home Appliance</option>
                   <option value="HOME_ENTERTAINMENT">Home Entertainment</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub-Category</label>
                 <select className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500"
                   value={stockForm.subCategory} onChange={e => setStockForm({...stockForm, subCategory: e.target.value})}>
                   {CATEGORIES[stockForm.category as keyof typeof CATEGORIES].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                 </select>
              </div>
              <div className="md:col-span-2 pt-6">
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                   <PackagePlus className="w-4 h-4" /> {isEditingStock ? "Update Item" : "Add to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: VIEW & AUDIT INVENTORY --- */}
      {activeModal === 'INVENTORY_VIEW' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
               <div>
                 <h3 className="font-black text-lg text-slate-900">Hub Inventory Ledger</h3>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Real-time Stock Levels & Audit</p>
               </div>
               <button onClick={() => setActiveModal('NONE')}><X className="w-6 h-6 text-slate-400 hover:text-red-500" /></button>
            </div>
            
            {/* Inventory List */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {loadingInv ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Ledger...</p>
                </div>
              ) : shopInventory.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-400">Empty Warehouse</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shopInventory.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                       {/* Item Info */}
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === 'Low Stock' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {item.status === 'Low Stock' ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                            <div className="flex gap-2 text-[10px] font-bold uppercase text-slate-400">
                               <span>{item.id}</span>
                               <span className="text-slate-200">•</span>
                               <span className="text-blue-500">{item.subCat}</span>
                            </div>
                          </div>
                       </div>
                       
                       {/* Controls */}
                       <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                             <p className="text-[9px] font-bold text-slate-400 uppercase">Unit Price</p>
                             <p className="font-black text-sm text-slate-700">₵ {item.price}</p>
                          </div>
                          
                          {/* Stock Audit Buttons */}
                          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                             <button onClick={() => adjustStock(item.dbId, item.stock, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-red-600 font-bold text-lg transition-colors">-</button>
                             <span className="w-10 text-center font-black text-sm text-slate-900">{item.stock}</span>
                             <button onClick={() => adjustStock(item.dbId, item.stock, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-emerald-600 font-bold text-lg transition-colors">+</button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                             {/* Save Audit Button */}
                             {auditChanges[item.dbId] !== undefined && (
                               <button 
                                 onClick={() => saveAudit(item.dbId, item.stock)}
                                 className="w-8 h-8 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-lg flex items-center justify-center animate-in zoom-in"
                                 title="Save Changes"
                               >
                                 <Save className="w-4 h-4" />
                               </button>
                             )}
                             
                             {/* Edit Item Button */}
                             <button 
                               onClick={() => openEditStockItem(item)}
                               className="w-8 h-8 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-colors"
                               title="Edit Details"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>

                             {/* Delete Item Button */}
                             <button 
                               onClick={() => handleDeleteStock(item.dbId)}
                               className="w-8 h-8 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors"
                               title="Delete Item"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t bg-white flex-shrink-0 flex justify-end gap-3">
               <button onClick={() => { setIsEditingStock(false); setActiveModal('INVENTORY_ADD'); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                 <Plus className="w-4 h-4" /> Add New Item
               </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOPS GRID LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Loading Network...</p>
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
           <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
           <h3 className="text-lg font-black text-slate-900">No Shops Found</h3>
           <p className="text-sm text-slate-500 mt-1">Add your first location to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all relative group">
              
              {/* Edit Action */}
              <button 
                onClick={() => openEditShop(shop)}
                className="absolute top-8 right-8 p-2 rounded-xl text-slate-300 hover:bg-slate-100 hover:text-blue-600 transition-colors z-10"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Icon & Name */}
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl mb-6">
                {shop.name.charAt(0)}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-1">{shop.name}</h3>
              
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide mb-8">
                <MapPin className="w-3.5 h-3.5" />
                {shop.location}
              </div>

              {/* Details Grid */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                 
                 {/* Manager Info */}
                 <div>
                   <p className="text-[10px] font-black text-slate-300 uppercase mb-2">Manager</p>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-slate-700">{shop.managerName || "Unassigned"}</span>
                     {shop.managerPhone && <span className="text-xs text-slate-400">{shop.managerPhone}</span>}
                   </div>
                 </div>
                 
                 {/* Inventory Actions */}
                 <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Stock</p>
                     {/* Show Inventory count if available, else show "View Details" to encourage viewing */}
                     {shop._count?.inventory ? (
                        <span className="text-xl font-black text-slate-900">{shop._count.inventory} Units</span>
                     ) : (
                        <span className="text-xs font-bold text-slate-400">View Details</span>
                     )}
                   </div>
                   
                   <div className="flex gap-2">
                     <button 
                       onClick={() => openAddStock(shop.id)}
                       className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                       title="Add Item"
                     >
                       <Plus className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => fetchShopInventory(shop.id)}
                       className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2"
                     >
                       <Eye className="w-3.5 h-3.5" /> View
                     </button>
                   </div>
                 </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}