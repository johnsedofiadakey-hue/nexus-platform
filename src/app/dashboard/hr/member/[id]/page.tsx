"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, MessageSquare, MapPin,
  Settings, Power, Trash2, X, Eye, EyeOff,
  Activity, Download, Shield, Mail, Briefcase,
  Store, Key, UserCircle, Save, AlertTriangle,
  Smartphone, Fingerprint, ShieldCheck, Info,
  ChevronRight, Calendar, BarChart3, Clock,
  Map as MapIcon, Globe, Lock
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from 'next/dynamic';

// UI Components
import ChatConsole from "@/components/dashboard/hr/ChatConsole";
import PerformanceBoard from "@/components/dashboard/hr/PerformanceBoard";
import ComplianceBoard from "@/components/dashboard/hr/ComplianceBoard";

// 🛰️ DYNAMIC MAP IMPORT (Client-side only)
const GeofenceMap = dynamic(() => import('@/components/maps/GeofenceMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center border border-slate-200 rounded-2xl">
      <Loader2 className="w-5 h-5 text-slate-400 animate-spin mb-2" />
      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Acquiring Satellite Link...</span>
    </div>
  )
});

export default function MemberPortal() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  // --- CORE STATE ---
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true); // Default to visible
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COMMS' | 'LOGS'>('OVERVIEW');

  // Hardened Form State for Edit Modal
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    shopId: "",
    status: "",
    password: ""
  });

  useEffect(() => { setMounted(true); }, []);

  // --- DATA SYNCHRONIZATION ---
  const sync = useCallback(async (silent = false) => {
    if (!staffId || !mounted) return;
    if (!silent) setLoading(true);

    try {
      const timestamp = Date.now();
      const [uRes, sRes, mRes] = await Promise.all([
        fetch(`/api/hr/member/${staffId}?t=${timestamp}`),
        fetch(`/api/shops/list?t=${timestamp}`),
        fetch(`/api/mobile/messages?userId=${staffId}&countOnly=true&t=${timestamp}`)
      ]);

      const userData = await uRes.json();
      const shopData = await sRes.json();
      // Messages are typically included in userData 'messages' array from the API logic

      setData(userData);
      setShops(Array.isArray(shopData) ? shopData : (shopData.data || []));

      // 🛡️ SYNC FORM STATE
      setFormState({
        name: userData?.name || "",
        email: userData?.email || "",
        phone: userData?.phone || "",
        shopId: userData?.shopId || "",
        status: userData?.status || "ACTIVE",
        password: ""
      });

    } catch (e) {
      console.error("Nexus Sync Failure");
      toast.error("Critical: Data link failed.");
    } finally {
      setLoading(false);
    }
  }, [staffId, mounted]);

  useEffect(() => {
    sync();
    const timer = setInterval(() => sync(true), 15000); // 15s heartbeat
    return () => clearInterval(timer);
  }, [sync]);

  // --- SYSTEM ACTIONS ---
  const exec = async (action: string, payload: any) => {
    const t = toast.loading(`Processing Protocol...`);
    try {
      const endpoint = action === 'SEND_MESSAGE' ? '/api/mobile/messages' : `/api/hr/member/${staffId}`;
      const method = action === 'SEND_MESSAGE' ? 'POST' : (action === 'DELETE' ? 'DELETE' : 'PATCH');

      // 🔧 FIX: Ensure receiverId is attached for messages
      const bodyPayload = action === 'SEND_MESSAGE'
        ? { content: payload.content, receiverId: staffId } // Explicitly target Agent
        : { action, ...payload };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: action !== 'DELETE' ? JSON.stringify(bodyPayload) : undefined
      });

      if (res.ok) {
        toast.success("Protocol Success", { id: t });
        if (action === 'DELETE') router.push('/dashboard/hr');
        else {
          await sync(true);
          setShowSettings(false);
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || "Request Rejected");
      }
    } catch (e: any) { toast.error(e.message || "Action Failed", { id: t }); }
  };

  const handleSaveChanges = () => {
    exec('UPDATE_PROFILE', {
      name: formState.name,
      email: formState.email,
      phone: formState.phone,
      shopId: formState.shopId,
      status: formState.status
    });
  };

  if (!mounted || loading || !data) return (
    <div className="h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acquiring Personnel Intel...</span>
    </div>
  );

  const assignedShop = data?.shop || shops.find(s => s.id === data?.shopId);
  const isOnline = data?.lastLat && data?.lastLng;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pb-20">

      {/* 🏛️ HEADER & NAV */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {data?.name}
              {isOnline && <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {data?.role} • {assignedShop?.name || "Unassigned"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowMap(!showMap)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-2 ${showMap ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white text-slate-500 border-slate-200'}`}>
            <MapIcon size={14} /> {showMap ? 'Hide Radar' : 'Show Radar'}
          </button>
          <button onClick={() => setShowSettings(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2">
            <Settings size={14} /> Config
          </button>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6 grid grid-cols-12 gap-6">

        {/* ---------------- LEFT COL: PASSPORT ---------------- */}
        <div className="col-span-12 xl:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200">
            <div className="p-6 pb-0 flex flex-col items-center">
              <div className="w-28 h-28 bg-slate-100 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4 relative">
                {data?.image ? <img src={data.image} className="w-full h-full object-cover" /> : <UserCircle size={64} className="text-slate-300 m-auto mt-4" />}
              </div>
              <h2 className="text-xl font-black text-slate-900">{data?.name}</h2>
              <p className="text-xs font-medium text-slate-500 mb-6">{data?.email}</p>

              <div className="w-full grid grid-cols-2 gap-2 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Sales</p>
                  <p className="text-lg font-black text-slate-900">₵{data?.sales?.reduce((a: any, b: any) => a + (b.totalAmount || 0), 0).toLocaleString() || '0'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Attendance</p>
                  <p className="text-lg font-black text-emerald-600">{Math.round((data?.attendance?.length || 0) / 30 * 100)}%</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 rounded-b-3xl border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                <span>Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${data?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{data?.status}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-600 mt-2">
                <span>Last Active</span>
                <span>{data.lastSeen ? new Date(data.lastSeen).toLocaleTimeString() : 'Never'}</span>
              </div>
            </div>
          </div>

          {/* Mobile Uplink (Chat) */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-[500px] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><MessageSquare size={14} /> Secure Line</span>
            </div>
            <div className="flex-1 min-h-0">
              <ChatConsole messages={data?.messages || []} viewerId="ADMIN_SIDE" onSendMessage={(c: string) => exec('SEND_MESSAGE', { content: c })} />
            </div>
          </div>
        </div>

        {/* ---------------- CENTER/RIGHT: MISSION CONTROL ---------------- */}
        <div className="col-span-12 xl:col-span-9 space-y-6">

          {/* 🌍 LIVE SATELLITE MAP */}
          {showMap && assignedShop && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-blue-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Live Telemetry</h3>
                </div>
                {data?.isInsideZone ? (
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} /> Secure (On-Site)
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={12} /> Off-Site / Roaming
                  </span>
                )}
              </div>
              <div className="h-[400px] relative bg-slate-100">
                <GeofenceMap
                  shopLat={assignedShop.latitude || 5.6037}
                  shopLng={assignedShop.longitude || -0.1870}
                  shopRadius={assignedShop.radius || 50}
                  userLat={data?.lastLat}
                  userLng={data?.lastLng}
                />
              </div>
            </div>
          )}

          {/* 📊 ANALYTICS TABS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><BarChart3 size={16} /> Performance Metrics</h3>
              <PerformanceBoard
                sales={data?.sales || []}
                dailyReports={data?.dailyReports || []}
                targets={data?.targets}
                geofenceStats={data?.geofenceStats || []}
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Shield size={16} /> Compliance Engine</h3>
              <ComplianceBoard
                attendance={data?.attendance || []}
                leaveRequests={data?.leaves || []}
                disciplinaryLog={data?.disciplinaryLog || []}
                staffId={staffId}
                onUpdateLeave={(id: string, s: string) => exec('MANAGE_LEAVE', { leaveId: id, status: s })}
              />
            </div>
          </div>

        </div>

      </div>

      {/* ⚙️ SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Profile Configuration</h3>
              <button onClick={() => setShowSettings(false)}><X className="text-slate-400 hover:text-slate-900" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identity</label>
                <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 transition-colors" placeholder="Full Name" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} />
                <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 transition-colors" placeholder="Email" value={formState.email} onChange={e => setFormState({ ...formState, email: e.target.value })} />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignment</label>
                <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 transition-colors" value={formState.shopId} onChange={e => setFormState({ ...formState, shopId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {shops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button onClick={handleSaveChanges} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">Save Changes</button>
                <button onClick={() => { if (confirm('Terminate?')) exec('DELETE', {}) }} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"><Trash2 size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}