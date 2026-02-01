"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - SHOP COMMAND CENTER
 * DESIGN SYSTEM: TIER-1 SAAS (Clean, High Contrast, Data-Dense)
 * FEATURES: God Mode Map, Dynamic Taxonomy, Inventory Ledger
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { 
  MapPin, Plus, Package, Edit2, X, 
  Loader2, PackagePlus, AlertTriangle, Trash2,
  Navigation, ArrowRight, ShieldCheck, RefreshCw, Building2, Search,
  Settings, FolderTree, ChevronRight, FileText, LayoutList, Map as MapIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

// 🛰️ GOD MODE MAP ENGINE (Dynamic Import)
const AdminHQMap = dynamic(
  () => import("@/components/maps/AdminHQMap"), 
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Loading Satellite Network...</span>
      </div>
    )
  }
);

export default function AdminShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true); // 🗺️ Map Toggle State
  
  // --- MODAL STATES ---
  const [activeModal, setActiveModal] = useState<'NONE' | 'SHOP_FORM' | 'INVENTORY_FORM' | 'INVENTORY_VIEW' | 'SETTINGS' | 'DETAIL_VIEW'>('NONE');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // --- INVENTORY STATES ---
  const [shopInventory, setShopInventory] = useState<any[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // --- DYNAMIC TAXONOMY STATE ---
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);

  // --- FORMS ---
  const [shopForm, setShopForm] = useState({ name: "", location: "", latitude: "", longitude: "", radius: "200", managerName: "" });
  
  const [stockForm, setStockForm] = useState({ 
    productName: "", modelNumber: "", sku: "", price: "", quantity: "1", 
    minStock: "5", category: "", subCategory: "", notes: "" 
  });

  // ==================================================================================
  // 1. DATA SYNCHRONIZATION
  // ==================================================================================

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/list?t=${Date.now()}`);
      const json = await res.json();
      setShops(Array.isArray(json) ? json : (json.data || []));
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const fetchCategories = async (shopId: string) => {
    try {
      const res = await fetch(`/api/shops/${shopId}/settings/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) { toast.error("Could not load taxonomy"); }
  };

  const fetchShopInventory = async (shopId: string) => {
    setLoadingInv(true);
    setSelectedShopId(shopId);
    setActiveModal('INVENTORY_VIEW');
    setSearchTerm("");
    fetchCategories(shopId);
    
    try {
      const res = await fetch(`/api/shops/${shopId}?t=${Date.now()}`);
      const json = await res.json();
      setShopInventory(json.inventory || json.products || []);
    } catch (e) {
      setShopInventory([]);
      toast.error("Failed to load ledger");
    } finally {
      setLoadingInv(false);
    }
  };

  // ==================================================================================
  // 2. ACTIONS: DYNAMIC CATEGORIES
  // ==================================================================================

  const handleAddCategory = async () => {
    if(!newCatName.trim()) return;
    const toastId = toast.loading("Saving...");
    try {
      const payload = activeCatId ? { name: newCatName, parentId: activeCatId } : { name: newCatName };
      const res = await fetch(`/api/shops/${selectedShopId}/settings/categories`, {
        method: 'POST', body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error();
      setNewCatName("");
      setActiveCatId(null);
      fetchCategories(selectedShopId!);
      toast.success("Saved", { id: toastId });
    } catch (e) { toast.error("Failed to save", { id: toastId }); }
  };

  const handleDeleteCategory = async (id: string, isSub: boolean) => {
    if(!confirm("Delete this category? Items using it will look unsorted.")) return;
    try {
      await fetch(`/api/shops/${selectedShopId}/settings/categories`, {
        method: 'DELETE', body: JSON.stringify({ id, isSub })
      });
      fetchCategories(selectedShopId!);
      toast.success("Deleted");
    } catch { toast.error("Delete failed"); }
  };

  // ==================================================================================
  // 3. ACTIONS: INVENTORY CRUD
  // ==================================================================================

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedShopId) return;
    const t = toast.loading("Syncing Ledger...");

    const payload = {
      id: isEditingStock ? editingStockId : undefined,
      productName: stockForm.productName,
      modelNumber: stockForm.modelNumber,
      sku: stockForm.sku,
      priceGHS: stockForm.price, 
      quantity: stockForm.quantity, 
      minStock: stockForm.minStock,
      category: stockForm.category,
      subCategory: stockForm.subCategory,
      description: stockForm.notes
    };

    try {
      const res = await fetch(`/api/shops/${selectedShopId}`, {
        method: "POST", body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success("Success", { id: t });
        fetchShopInventory(selectedShopId); 
        if(!isEditingStock) setActiveModal('INVENTORY_VIEW'); 
        setStockForm({ productName:"", modelNumber:"", sku:"", price:"", quantity:"1", minStock:"5", category:"", subCategory:"", notes:"" });
      } else { throw new Error(); }
    } catch { toast.error("Transaction Failed", { id: t }); }
  };

  const handleDeleteStock = async (itemId: string) => {
    if(!confirm("Permanently delete this item?")) return;
    try {
       await fetch(`/api/shops/${selectedShopId}`, { 
         method: 'DELETE', body: JSON.stringify({ id: itemId, type: 'INVENTORY' }) 
       });
       setShopInventory(prev => prev.filter(i => i.id !== itemId));
       toast.success("Item Deleted");
    } catch { toast.error("Failed"); }
  };

  // ==================================================================================
  // 4. ACTIONS: SHOPS
  // ==================================================================================

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = toast.loading("Configuring Hub...");
    try {
      await fetch("/api/shops/list", { 
        method: 'POST',
        body: JSON.stringify({ ...shopForm, radius: parseInt(shopForm.radius) })
      });
      toast.success("Hub Active", { id: t });
      setActiveModal('NONE');
      fetchShops();
    } catch { toast.error("Network Error", { id: t }); }
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (!confirm(`⚠️ WARNING: You are about to dismantle hub "${shopName}".\n\nALL INVENTORY & SALES HISTORY WILL BE ERASED.\n\nProceed?`)) return;
    const t = toast.loading("Dismantling...");
    try {
      const res = await fetch(`/api/shops/${shopId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Hub Dismantled", { id: t });
        fetchShops();
      } else { throw new Error(); }
    } catch { toast.error("Failed to delete", { id: t }); }
  };

  // ==================================================================================
  // 5. HELPER FUNCTIONS
  // ==================================================================================

  const openSettings = (shopId: string) => {
    setSelectedShopId(shopId);
    fetchCategories(shopId);
    setActiveModal('SETTINGS');
  }

  const openEditStock = (item: any) => {
    setEditingStockId(item.id);
    setIsEditingStock(true);
    setStockForm({
      productName: item.name || "",
      modelNumber: item.modelNumber || "",
      sku: item.barcode || "",
      price: (item.sellingPrice || 0).toString(),
      quantity: (item.stockLevel || 0).toString(),
      minStock: (item.minStock || 5).toString(),
      category: item.category || "",
      subCategory: item.subCategory || "",
      notes: item.description || ""
    });
    setActiveModal('INVENTORY_FORM');
  };

  const openAddStock = (shopId: string) => {
    if(shopId) { setSelectedShopId(shopId); fetchCategories(shopId); } 
    setIsEditingStock(false);
    
    const firstCat = categories.length > 0 ? categories[0].name : "";
    const firstSub = categories.length > 0 && categories[0].subCategories.length > 0 ? categories[0].subCategories[0].name : "";

    setStockForm({
        productName: "", modelNumber: "", sku: `SKU-${Math.floor(Math.random() * 10000)}`,
        price: "", quantity: "1", minStock: "5", 
        category: firstCat, subCategory: firstSub, notes: ""
    });
    setActiveModal('INVENTORY_FORM');
  }

  const openDetailView = (item: any) => {
    setSelectedItem(item);
    setActiveModal('DETAIL_VIEW');
  }

  const filteredInventory = shopInventory.filter(item => {
    const term = searchTerm.toLowerCase();
    const name = (item.name || "").toLowerCase();
    const sku = (item.barcode || "").toLowerCase();
    return name.includes(term) || sku.includes(term);
  });

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hub Command Center</h1>
            <p className="text-sm text-slate-500 mt-1">Manage operations, dynamic inventory, and taxonomy settings.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowMap(!showMap)} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all ${showMap ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <MapIcon size={18} /> {showMap ? 'Hide Map' : 'Show Map'}
            </button>
            <button onClick={() => { setIsEditing(false); setActiveModal('SHOP_FORM'); setShopForm({name:"", location:"", latitude:"", longitude:"", radius:"200", managerName:""}); }} 
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all">
              <Plus size={18} /> Register Hub
            </button>
          </div>
        </div>

        {/* 🗺️ GOD MODE MAP SECTION */}
        {showMap && (
          <div className="h-[400px] w-full relative z-0 rounded-2xl overflow-hidden shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
             <AdminHQMap shops={shops} />
             
             {/* Map Overlay Badge */}
             <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-lg border border-slate-200 shadow-md">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Satellite Live</span>
                </div>
             </div>
          </div>
        )}

        {/* SHOP GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Network...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map(shop => (
              <div key={shop.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-lg font-bold text-slate-700 uppercase">{shop.name.charAt(0)}</div>
                        <div>
                            <h3 className="font-bold text-slate-900">{shop.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-500"><MapPin size={12}/> {shop.location}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openSettings(shop.id)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Manage Categories">
                            <Settings size={16} />
                        </button>
                        <button onClick={() => handleDeleteShop(shop.id, shop.name)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Geofence</p>
                          <p className="text-sm font-semibold text-slate-900">{shop.radius}m</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">SKUs</p>
                          <p className="text-sm font-semibold text-slate-900">{shop._count?.inventory || shop.inventoryCount || 0}</p>
                      </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openAddStock(shop.id)} className="flex-1 py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wide">
                        + Add Stock
                    </button>
                    <button onClick={() => fetchShopInventory(shop.id)} className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-blue-600 flex items-center justify-center gap-2">
                        Inventory <ArrowRight size={12} />
                    </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================= MODAL: SETTINGS (TAXONOMY) ======================= */}
      {activeModal === 'SETTINGS' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 h-[75vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="font-bold text-xl text-slate-900">Taxonomy Settings</h3>
                        <p className="text-xs text-slate-500 font-medium">Define your own product categories and sub-categories.</p>
                    </div>
                    <button onClick={() => setActiveModal('NONE')}><X className="text-slate-400 hover:text-rose-600 transition-colors"/></button>
                </div>

                <div className="flex gap-2 mb-6 p-1">
                    <div className="flex-1 relative">
                        <FolderTree className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                            placeholder={activeCatId ? "Enter Sub-Category Name..." : "Enter Main Category Name..."}
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        />
                    </div>
                    {activeCatId && (
                        <button onClick={() => setActiveCatId(null)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel Sub</button>
                    )}
                    <button onClick={handleAddCategory} className="px-6 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-700 shadow-md transition-all">
                        {activeCatId ? "Add Sub" : "Add Root"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                            <LayoutList size={32} className="mb-2 opacity-50"/>
                            <p className="text-sm font-medium">No Categories Defined</p>
                            <p className="text-xs">Add a root category to get started.</p>
                        </div>
                    ) : categories.map((cat: any) => (
                        <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-white p-3 flex justify-between items-center group">
                                <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-xs font-bold">{cat.name.charAt(0)}</span>
                                    {cat.name}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => setActiveCatId(cat.id)} className="text-[10px] font-bold uppercase bg-slate-50 text-slate-600 px-3 py-1.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200">+ Sub</button>
                                    <button onClick={() => handleDeleteCategory(cat.id, false)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            {cat.subCategories.length > 0 && (
                                <div className="bg-slate-50 p-2 pl-4 space-y-1 border-t border-slate-100">
                                    {cat.subCategories.map((sub: any) => (
                                        <div key={sub.id} className="flex justify-between items-center px-3 py-2 rounded-lg hover:bg-white transition-colors group/sub">
                                            <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                <ChevronRight size={12} className="text-slate-300"/> {sub.name}
                                            </span>
                                            <button onClick={() => handleDeleteCategory(sub.id, true)} className="text-slate-300 hover:text-rose-600 opacity-0 group-hover/sub:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* ======================= MODAL: INVENTORY FORM ======================= */}
      {activeModal === 'INVENTORY_FORM' && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                 <div>
                    <h3 className="font-bold text-xl text-slate-900">{isEditingStock ? "Edit Product" : "Add Inventory"}</h3>
                    <p className="text-xs text-slate-500 font-medium">Detailed product specification and tracking.</p>
                 </div>
                 <button onClick={() => setActiveModal('INVENTORY_VIEW')} className="text-slate-400 hover:text-rose-600"><X /></button>
              </div>
              
              <form onSubmit={handleStockSubmit} className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Category</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all" 
                            value={stockForm.category} 
                            onChange={e => {
                                const newCat = e.target.value;
                                const catObj = categories.find(c => c.name === newCat);
                                const firstSub = catObj && catObj.subCategories.length > 0 ? catObj.subCategories[0].name : "";
                                setStockForm({ ...stockForm, category: newCat, subCategory: firstSub });
                            }}
                        >
                            <option value="">Select Category...</option>
                            {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Sub-Category</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all" 
                            value={stockForm.subCategory} 
                            onChange={e => setStockForm({...stockForm, subCategory: e.target.value})}
                            disabled={!stockForm.category}
                        >
                            <option value="">Select Sub-Category...</option>
                            {categories.find((c: any) => c.name === stockForm.category)?.subCategories.map((s: any) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Product Name</label>
                        <input className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="e.g. Samsung OLED TV" value={stockForm.productName} onChange={e=>setStockForm({...stockForm, productName:e.target.value})} required />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Model Number</label>
                        <input className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="e.g. QA65S90CAUXZN" value={stockForm.modelNumber} onChange={e=>setStockForm({...stockForm, modelNumber:e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Serial No. / Barcode</label>
                        <input className="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none" placeholder="Scan..." value={stockForm.sku} onChange={e=>setStockForm({...stockForm, sku:e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Unit Price (GHS)</label>
                        <input type="number" className="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none" placeholder="0.00" value={stockForm.price} onChange={e=>setStockForm({...stockForm, price:e.target.value})} required />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Quantity</label>
                        <input type="number" className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="0" value={stockForm.quantity} onChange={e=>setStockForm({...stockForm, quantity:e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Low Stock Alert</label>
                        <input type="number" className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="5" value={stockForm.minStock} onChange={e=>setStockForm({...stockForm, minStock:e.target.value})} />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Specifications / Notes</label>
                    <textarea className="w-full p-3 border border-slate-200 rounded-lg text-sm h-24 resize-none focus:border-blue-500 outline-none" placeholder="Enter specs, dimensions, or internal notes..." value={stockForm.notes} onChange={e=>setStockForm({...stockForm, notes:e.target.value})} />
                 </div>

                 <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-blue-600 shadow-md transition-all">
                   {isEditingStock ? "Update Product" : "Add to Inventory"}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* ======================= MODAL: INVENTORY LIST ======================= */}
      {activeModal === 'INVENTORY_VIEW' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm"><Package className="text-blue-600" size={20} /></div>
                        <div><h2 className="text-lg font-bold text-slate-900">Inventory Ledger</h2><p className="text-xs text-slate-500">Click any row to view full details.</p></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                            <input type="text" placeholder="Search SKU, Name..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={() => setActiveModal('NONE')}><X className="text-slate-400 hover:text-rose-600" /></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">
                    {filteredInventory.length === 0 ? <div className="text-center text-slate-400 py-20">No items found.</div> : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Item Details</th>
                                        <th className="px-6 py-3">Model No.</th>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3 text-right">Price</th>
                                        <th className="px-6 py-3 text-center">Stock</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredInventory.map(item => {
                                        const isLow = (item.stockLevel || 0) <= (item.minStock || 5);
                                        return (
                                            <tr key={item.id} onClick={() => openDetailView(item)} className="hover:bg-blue-50/50 cursor-pointer group transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-900">{item.name}</p>
                                                    <p className="text-xs font-mono text-slate-400">{item.barcode || "No SKU"}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-slate-500">{item.modelNumber || "-"}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex flex-col">
                                                        <span className="font-bold text-slate-700 text-xs">{item.subCategory}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">{item.category}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">₵{item.sellingPrice?.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${isLow ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {item.stockLevel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={(e) => { e.stopPropagation(); openEditStock(item); }} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 text-blue-600 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={14}/></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50/50">
                    <button onClick={() => openAddStock(selectedShopId!)} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase hover:bg-blue-700 flex gap-2 shadow-lg transition-all"><PackagePlus size={16} /> Add Goods</button>
                </div>
            </div>
        </div>
      )}

      {/* ======================= MODAL: DETAIL VIEW ======================= */}
      {activeModal === 'DETAIL_VIEW' && selectedItem && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">{selectedItem.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500 uppercase tracking-wide">{selectedItem.barcode || "NO SKU"}</span>
                            <span className="text-xs text-slate-400 font-medium">| {selectedItem.modelNumber || "No Model #"}</span>
                        </div>
                    </div>
                    <button onClick={() => setActiveModal('INVENTORY_VIEW')}><X className="text-slate-400 hover:text-slate-900" /></button>
                </div>
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Selling Price</p>
                            <p className="text-xl font-mono font-black text-slate-900">₵{selectedItem.sellingPrice?.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Available Stock</p>
                            <p className="text-xl font-black text-slate-900">{selectedItem.stockLevel}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-2">Category Taxonomy</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                            <FolderTree size={14} className="text-blue-500"/> 
                            {selectedItem.category} <ChevronRight size={12} className="text-slate-400"/> {selectedItem.subCategory}
                        </div>
                    </div>
                    {selectedItem.description && (
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase mb-2">Specification / Notes</p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                                {selectedItem.description}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={() => handleDeleteStock(selectedItem.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-slate-100"><Trash2 size={18}/></button>
                    <button onClick={() => { setActiveModal('INVENTORY_VIEW'); openEditStock(selectedItem); }} className="flex-1 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg">Edit Details</button>
                </div>
            </div>
        </div>
      )}

      {/* ======================= MODAL: SHOP FORM ======================= */}
      {activeModal === 'SHOP_FORM' && (
         <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="font-bold text-lg text-slate-900">{isEditing ? "Edit Hub Details" : "Register New Hub"}</h3>
                    <p className="text-xs text-slate-500 mt-1">Define operational coordinates and identity.</p>
                 </div>
                 <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-rose-600 transition-colors"><X /></button>
              </div>
              <form onSubmit={handleShopSubmit} className="space-y-4">
                 <input className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="Hub Name" value={shopForm.name} onChange={e=>setShopForm({...shopForm, name:e.target.value})} required />
                 <input className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="Location Description" value={shopForm.location} onChange={e=>setShopForm({...shopForm, location:e.target.value})} required />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Navigation size={14} className="absolute left-3 top-3.5 text-slate-400" />
                      <input className="w-full p-3 pl-9 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none font-mono" placeholder="Latitude" value={shopForm.latitude} onChange={e=>setShopForm({...shopForm, latitude:e.target.value})} required />
                    </div>
                    <div className="relative">
                      <Navigation size={14} className="absolute left-3 top-3.5 text-slate-400" />
                      <input className="w-full p-3 pl-9 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none font-mono" placeholder="Longitude" value={shopForm.longitude} onChange={e=>setShopForm({...shopForm, longitude:e.target.value})} required />
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <ShieldCheck className="text-blue-600" />
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Geofence Radius (Meters)</label>
                      <input className="w-full bg-transparent text-sm font-bold text-slate-900 border-none focus:ring-0 p-0 placeholder-slate-400" placeholder="200" value={shopForm.radius} onChange={e=>setShopForm({...shopForm, radius:e.target.value})} />
                    </div>
                 </div>

                 <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-blue-600 transition-all shadow-md mt-4">
                   {isEditing ? "Save Changes" : "Create Hub"}
                 </button>
              </form>
           </div>
         </div>
      )}
    </div>
  );
}