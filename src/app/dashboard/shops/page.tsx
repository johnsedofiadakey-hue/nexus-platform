"use client";

import React, { useState, useEffect } from "react";
import { Building2, MapPin, Plus, User, Package, Edit2, Phone, X, Loader2, Clock } from "lucide-react";

export default function AdminShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // FORM STATE
  const [formData, setFormData] = useState({
    name: "", location: "", lat: "", lng: "", radius: "150", 
    managerName: "", managerPhone: "", openingTime: "08:00 AM"
  });

  // --- 1. LOAD DATA ---
  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      // timestamp 't' prevents the browser from using old cached data
      const res = await fetch(`/api/shops?t=${Date.now()}`);
      if (res.ok) setShops(await res.json());
    } finally {
      setLoading(false);
    }
  };

  // --- 2. MODAL ACTIONS ---
  const openCreateModal = () => {
    setFormData({ name: "", location: "", lat: "", lng: "", radius: "150", managerName: "", managerPhone: "", openingTime: "08:00 AM" });
    setIsEditing(false);
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (shop: any) => {
    setFormData({
      name: shop.name,
      location: shop.location || "",
      lat: shop.latitude.toString(),
      lng: shop.longitude.toString(),
      radius: shop.radius.toString(),
      managerName: shop.managerName || "",
      managerPhone: shop.managerPhone || "",
      openingTime: shop.openingTime || "08:00 AM"
    });
    setIsEditing(true);
    setEditId(shop.id);
    setIsModalOpen(true);
  };

  // --- 3. SUBMIT (CREATE OR UPDATE) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const method = isEditing ? "PATCH" : "POST";
    const payload = isEditing ? { ...formData, id: editId } : formData;

    try {
      const res = await fetch("/api/shops", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchShops(); // Refresh list immediately
        // No alert needed, visual update is enough
      } else {
        alert("Operation failed. Please check your inputs.");
      }
    } catch (error) {
      alert("Network Error");
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
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* MODAL (FORM) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                 <h3 className="font-black text-lg text-slate-900">{isEditing ? "Edit Shop Details" : "Add New Shop"}</h3>
                 <p className="text-xs text-slate-500 font-medium">Enter location and management details.</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* General Info */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop Name</label>
                 <input 
                   placeholder="e.g. Melcom Mall" 
                   className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                   onChange={e => setFormData({...formData, name: e.target.value})} 
                   value={formData.name} 
                   required 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City / Area</label>
                 <input 
                   placeholder="e.g. Accra Central" 
                   className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                   onChange={e => setFormData({...formData, location: e.target.value})} 
                   value={formData.location} 
                   required 
                 />
              </div>
              
              {/* GPS Coordinates */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GPS Latitude</label>
                 <input 
                   placeholder="e.g. 5.6037" 
                   className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                   onChange={e => setFormData({...formData, lat: e.target.value})} 
                   value={formData.lat} 
                   required 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GPS Longitude</label>
                 <input 
                   placeholder="e.g. -0.1870" 
                   className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                   onChange={e => setFormData({...formData, lng: e.target.value})} 
                   value={formData.lng} 
                   required 
                 />
              </div>

              {/* Operations */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geofence Radius (Meters)</label>
                 <input 
                   type="number" 
                   placeholder="150" 
                   className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                   onChange={e => setFormData({...formData, radius: e.target.value})} 
                   value={formData.radius} 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Hours</label>
                 <input 
                   placeholder="08:00 AM - 05:00 PM" 
                   className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                   onChange={e => setFormData({...formData, openingTime: e.target.value})} 
                   value={formData.openingTime} 
                 />
              </div>

              {/* Management Section (Full Width) */}
              <div className="md:col-span-2 pt-6 border-t border-slate-100 mt-2">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <User className="w-3 h-3" /> Management Contact
                 </p>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Name</label>
                      <input 
                        placeholder="e.g. John Doe" 
                        className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                        onChange={e => setFormData({...formData, managerName: e.target.value})} 
                        value={formData.managerName} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Phone</label>
                      <input 
                        placeholder="e.g. +233 54..." 
                        className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                        onChange={e => setFormData({...formData, managerPhone: e.target.value})} 
                        value={formData.managerPhone} 
                      />
                    </div>
                 </div>
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                >
                   {isEditing ? "Update Configuration" : "Launch Location"}
                </button>
              </div>
            </form>
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
            <div key={shop.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative">
              
              {/* Edit Action */}
              <button 
                onClick={() => openEditModal(shop)}
                className="absolute top-8 right-8 p-2 rounded-xl text-slate-300 hover:bg-slate-100 hover:text-blue-600 transition-colors"
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
                     <div className="flex items-center gap-2">
                       <User className="w-4 h-4 text-slate-400" />
                       <span className="text-sm font-bold text-slate-700">{shop.managerName || "Unassigned"}</span>
                     </div>
                     {shop.managerPhone && (
                       <a href={`tel:${shop.managerPhone}`} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                         <Phone className="w-3 h-3" /> Call
                       </a>
                     )}
                   </div>
                 </div>
                 
                 {/* Stats */}
                 <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="bg-slate-50 p-3 rounded-xl">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Inventory</p>
                     <div className="flex items-center gap-2">
                       <Package className="w-3.5 h-3.5 text-blue-500" />
                       <span className="text-sm font-black text-slate-700">{shop._count?.inventory || 0}</span>
                     </div>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-xl">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Staff</p>
                     <div className="flex items-center gap-2">
                       <User className="w-3.5 h-3.5 text-blue-500" />
                       <span className="text-sm font-black text-slate-700">{shop._count?.users || 0}</span>
                     </div>
                   </div>
                 </div>

                 {/* Hours */}
                 <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-slate-400">
                    <Clock className="w-3 h-3" />
                    {shop.openingTime || "08:00 AM - 05:00 PM"}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}