"use client";

import React, { useState, useMemo } from "react";
import { 
  User, Mail, Phone, Building2, 
  ShieldCheck, CreditCard, Calendar, Edit3, Save,
  Navigation, ShieldAlert, Radio
} from "lucide-react";

interface ProfileCardProps {
  profile: any;
  shops: any[];
  onSave: (data: any) => void;
}

export default function ProfileCard({ profile, shops = [], onSave }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // 🛡️ CRITICAL FIX: Initialize state with optional chaining to prevent 500 crashes
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    shopId: profile?.shopId || ""
  });

  // --- 🛰️ LIVE GEOFENCE VERIFICATION ---
  // Memoize distance calculation to prevent lag on every re-render
  const geofence = useMemo(() => {
    const lat1 = profile?.lastLat;
    const lng1 = profile?.lastLng;
    const lat2 = profile?.shop?.latitude;
    const lng2 = profile?.shop?.longitude;
    const radius = parseFloat(profile?.shop?.radius) || 200;

    if (!lat1 || !lat2) return { isInside: false, hasSignal: false };

    const R = 6371e3; // Earth radius in meters
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      isInside: distance <= radius,
      hasSignal: true,
      distance: Math.round(distance)
    };
  }, [profile]);

  const currentShop = shops.find((s: any) => s.id === (formData.shopId || profile?.shopId));

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
      {/* 🧬 GEOFENCE STATUS STRIP */}
      <div className={`h-1.5 w-full ${geofence.isInside ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />

      <div className="p-8">
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {geofence.isInside ? (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {geofence.isInside ? "Authorized Access" : "Geofence Breach"}
            </span>
          </div>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-blue-600 border border-transparent hover:border-slate-100"
          >
            {isEditing ? <Save size={18} /> : <Edit3 size={18} />}
          </button>
        </div>

        {/* --- IDENTITY SECTION --- */}
        <div className="flex items-center gap-6 mb-10">
          <div className="relative">
            <div className={`w-20 h-20 rounded-[2rem] border-2 flex items-center justify-center bg-slate-50 transition-all ${
              geofence.isInside ? 'border-emerald-100' : 'border-rose-100'
            }`}>
              {profile?.image ? (
                <img src={profile.image} alt="" className="w-full h-full object-cover rounded-[2rem]" />
              ) : (
                <User size={32} className={geofence.isInside ? "text-emerald-500" : "text-rose-400"} />
              )}
            </div>
            {geofence.hasSignal && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-lg border-4 border-white flex items-center justify-center shadow-lg">
                <Radio size={12} className="text-white animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full text-xl font-black text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent uppercase tracking-tight"
              />
            ) : (
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{profile?.name || "Unverified Agent"}</h2>
            )}
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nexus-ID:</span>
               <span className="text-[10px] font-bold text-blue-600 font-mono">{(profile?.id || "---").slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* --- DATA ATTRIBUTES --- */}
        <div className="space-y-4 flex-1">
          {/* Email Card */}
          <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <Mail size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Protocol Email</span>
              <span className="text-xs font-bold text-slate-600">{profile?.email || "No Email Bound"}</span>
            </div>
          </div>

          {/* Hub Card with Dynamic Location */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
            isEditing ? 'bg-white border-blue-200 ring-2 ring-blue-50' : 'bg-slate-50/50 border-slate-100'
          }`}>
            <Navigation size={16} className={geofence.isInside ? "text-emerald-500" : "text-rose-400"} />
            <div className="flex flex-col w-full">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Assigned Retail Hub</span>
              {isEditing ? (
                <select 
                  value={formData.shopId}
                  onChange={(e) => setFormData({...formData, shopId: e.target.value})}
                  className="text-xs font-bold text-slate-900 bg-transparent outline-none w-full"
                >
                  <option value="">Pending Hub Assignment</option>
                  {shops.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                  ))}
                </select>
              ) : (
                <span className={`text-xs font-black uppercase tracking-tight ${geofence.isInside ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {profile?.shop?.name || "Roaming Access"}
                </span>
              )}
            </div>
          </div>

          {/* Phone Card */}
          <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <Phone size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Secure Line</span>
              {isEditing ? (
                <input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="text-xs font-bold text-slate-900 bg-transparent outline-none"
                />
              ) : (
                <span className="text-xs font-bold text-slate-600">{profile?.phone || "Disconnected"}</span>
              )}
            </div>
          </div>
        </div>

        {/* --- SYSTEM LOG --- */}
        <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Commissioned</span>
          </div>
          <span className="text-[10px] font-black text-slate-900">
            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Pending"}
          </span>
        </div>
      </div>
    </div>
  );
}