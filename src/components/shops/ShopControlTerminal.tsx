"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Edit3, Save, Power, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ShopControlTerminal({ shop, onUpdate }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: shop.name,
    radius: shop.radius,
    location: shop.location,
    latitude: shop.latitude,
    longitude: shop.longitude
  });

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/shops`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shop.id, ...form })
      });
      if (res.ok) {
        toast.success("Shop Hub Updated");
        onUpdate();
        setIsEditing(false);
      }
    } catch (e) {
      toast.error("Update Failed");
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase">Hub Command</h3>
          <p className="text-xs text-slate-400 font-bold uppercase">Configuration & Geofencing</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`p-3 rounded-xl transition-all ${isEditing ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-900'}`}
        >
          {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hub Designation</label>
            <input 
              disabled={!isEditing}
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 p-3 rounded-xl disabled:bg-transparent disabled:border-transparent disabled:p-0"
            />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Physical Location</label>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <input 
                disabled={!isEditing}
                value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
                className="w-full text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 p-3 rounded-xl disabled:bg-transparent disabled:border-transparent disabled:p-0"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
           <div className="flex items-center gap-2 mb-4 text-blue-600">
             <Navigation className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Geofence Parameters</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[9px] font-black text-slate-400 uppercase">Radius (Meters)</label>
               <input 
                 type="number"
                 disabled={!isEditing}
                 value={form.radius}
                 onChange={e => setForm({...form, radius: parseInt(e.target.value)})}
                 className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 p-2 rounded-lg mt-1"
               />
             </div>
             <div>
               <label className="text-[9px] font-black text-slate-400 uppercase">Coordinates</label>
               <div className="text-[10px] font-mono text-slate-500 mt-2">
                 Lat: {form.latitude}<br/>
                 Lng: {form.longitude}
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}