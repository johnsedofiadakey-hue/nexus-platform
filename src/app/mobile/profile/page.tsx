"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Camera, Mail, Phone, MapPin, 
  Briefcase, Calendar, ShieldCheck, Save, Edit2, Clock 
} from "lucide-react"; // ✅ Added 'Clock' to imports
import { useMobileTheme } from "@/context/MobileThemeContext";

export default function MobileProfile() {
  const { themeClasses, accent } = useMobileTheme();
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "Kojo Bonsu",
    role: "Sales Representative",
    id: "NX-2024-88",
    email: "kojo.bonsu@nexus.com",
    phone: "+233 54 123 4567",
    location: "Melcom Accra Mall",
    shift: "08:00 AM - 05:00 PM"
  });

  return (
    <div className={`min-h-[80vh] pb-24 ${themeClasses.bg} ${themeClasses.text}`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/mobile/menu" className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-80 ${themeClasses.text}`}>
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isEditing ? `bg-${accent}-600 text-white shadow-lg` : `${themeClasses.card} border shadow-sm`
          }`}
        >
          {isEditing ? <><Save className="w-3 h-3" /> Save</> : <><Edit2 className="w-3 h-3" /> Edit</>}
        </button>
      </div>

      {/* AVATAR SECTION */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-2xl bg-${accent}-600`}>
            KB
          </div>
          <button className="absolute bottom-0 right-0 p-3 bg-white rounded-full shadow-lg border border-slate-100 text-slate-400 hover:text-blue-600 active:scale-90 transition-all">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h1 className={`mt-4 text-2xl font-black ${themeClasses.text}`}>{profile.name}</h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{profile.role}</p>
      </div>

      {/* DETAILS GRID */}
      <div className={`p-6 rounded-[2rem] border shadow-sm space-y-6 ${themeClasses.card} ${themeClasses.border}`}>
        
        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Contact Details</h3>
          
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${accent}-500/10 text-${accent}-600`}>
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
              <p className={`font-bold ${themeClasses.text}`}>{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${accent}-500/10 text-${accent}-600`}>
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
              {isEditing ? (
                <input 
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className={`w-full bg-transparent border-b border-${accent}-500 outline-none font-bold ${themeClasses.text}`}
                />
              ) : (
                <p className={`font-bold ${themeClasses.text}`}>{profile.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Work Info */}
        <div className="space-y-4 pt-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Operational Data</h3>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Hub</p>
              <p className={`font-bold ${themeClasses.text}`}>{profile.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Shift Schedule</p>
              <p className={`font-bold ${themeClasses.text}`}>{profile.shift}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">System ID</p>
              <p className={`font-bold font-mono ${themeClasses.text}`}>{profile.id}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}