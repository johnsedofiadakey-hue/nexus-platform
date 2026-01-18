"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, ArrowLeft, Store, Mail, Phone, Shield, Loader2, AlertCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function MobileSettings() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/user/profile"); // <--- NEW ENDPOINT
        
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setError("Failed to load profile.");
        }
      } catch (e) {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase text-slate-400">Verifying Identity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <p className="text-sm font-bold text-slate-900 mb-2">Profile Error</p>
        <p className="text-xs text-slate-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/mobile" className="p-2 -ml-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-black text-slate-900">Agent Profile</h1>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center mb-6">
         <div className="w-20 h-20 bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold uppercase">
           {profile.name.charAt(0)}
         </div>
         <h2 className="text-lg font-black text-slate-900">{profile.name}</h2>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{profile.role.replace('_', ' ')}</p>
      </div>

      {/* DETAILS LIST */}
      <div className="space-y-4">
         <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Store className="w-5 h-5"/></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Shop</p>
              <p className="text-sm font-bold text-slate-900">{profile.shopName}</p>
              <p className="text-[10px] text-slate-400">{profile.shopLocation}</p>
            </div>
         </div>

         <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Shield className="w-5 h-5"/></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
              <span className={`text-xs font-black uppercase ${profile.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-500'}`}>
                {profile.status}
              </span>
            </div>
         </div>

         <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600"><Mail className="w-5 h-5"/></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
              <p className="text-sm font-bold text-slate-900">{profile.email}</p>
            </div>
         </div>
         
         <div className="px-4 py-2 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">System ID</p>
            <p className="text-[10px] text-slate-300 font-mono">v2.1 • {new Date().getFullYear()}</p>
         </div>
      </div>

      {/* LOGOUT */}
      <button 
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="mt-8 w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

    </div>
  );
}