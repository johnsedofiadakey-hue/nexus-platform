"use client";

import React, { useState } from "react";
import { Phone, Mail, MapPin, Building2, Key, ShieldAlert, Save, Store } from "lucide-react";

export default function ProfileCard({ 
  profile, 
  shops, 
  onSave, 
  onPasswordReset, 
  loading 
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [formData, setFormData] = useState(profile);

  // Shop Matcher
  const currentShop = shops.find((s: any) => s.id === profile.shopId);

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden">
       {/* AVATAR & IDENTITY */}
       <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-slate-200 mb-4">
             {profile.name.charAt(0)}
          </div>
          
          {isEditing ? (
             <input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="text-center font-bold border-b-2 border-blue-500 outline-none mb-1 text-lg w-full bg-transparent" 
             />
          ) : (
             <h2 className="text-xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {isEditing ? (
               <select 
                  value={formData.shopId || ""} 
                  onChange={e => setFormData({...formData, shopId: e.target.value})}
                  className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 w-full"
               >
                  <option value="">-- Unassigned --</option>
                  {shops.map((s: any) => (
                     <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
               </select>
            ) : (
               <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${currentShop ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
                  <Building2 className="w-3 h-3" /> {currentShop?.name || "Unassigned"}
               </div>
            )}
          </div>
       </div>

       {/* CONTACT DETAILS */}
       <div className="space-y-4 mb-8">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mobile</label>
             {isEditing ? (
                <input 
                   value={formData.phone || ""}
                   onChange={e => setFormData({...formData, phone: e.target.value})}
                   className="w-full bg-white p-2 text-xs font-bold border border-slate-200 rounded-lg"
                />
             ) : (
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                   <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile.phone || "N/A"}
                </div>
             )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
             {isEditing ? (
                <input 
                   value={formData.email || ""}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   className="w-full bg-white p-2 text-xs font-bold border border-slate-200 rounded-lg"
                />
             ) : (
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                   <Mail className="w-3.5 h-3.5 text-slate-400" /> {profile.email}
                </div>
             )}
          </div>
       </div>

       {/* SECURITY OVERRIDE */}
       {isResetting && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 animate-in slide-in-from-top-2">
             <div className="flex items-center gap-2 text-red-700 mb-3">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Admin Override</span>
             </div>
             <input 
                type="text" 
                placeholder="New Password" 
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-red-200 rounded-xl px-3 py-3 mb-3 outline-none focus:ring-2 focus:ring-red-200"
             />
             <button 
               onClick={() => { onPasswordReset(adminPass); setAdminPass(""); setIsResetting(false); }} 
               className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200"
             >
                Force Reset
             </button>
          </div>
       )}

       {/* ACTION BUTTONS */}
       <div className="flex gap-3">
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${isEditing ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
          >
             {isEditing ? <><Save className="w-3.5 h-3.5" /> Save Changes</> : 'Edit Profile'}
          </button>
          <button 
            onClick={() => setIsResetting(!isResetting)} 
            className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
          >
             <Key className="w-4 h-4" />
          </button>
       </div>
    </div>
  );
}