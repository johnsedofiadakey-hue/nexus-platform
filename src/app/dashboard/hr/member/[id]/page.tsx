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
  Map as MapIcon, Globe, Lock, FileText, Layout
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';

// UI Components
import ChatConsole from "@/components/dashboard/hr/ChatConsole";
import PerformanceBoard from "@/components/dashboard/hr/PerformanceBoard";
import ComplianceBoard from "@/components/dashboard/hr/ComplianceBoard";
import IntelBoard from "@/components/dashboard/hr/IntelBoard";

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
  const { data: session } = useSession();
  const staffId = params?.id as string;

  // --- CORE STATE ---
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true); // Default to visible
  const [showSettings, setShowSettings] = useState(false);

  // TABS: 'OVERVIEW' | 'INTEL' | 'COMPLIANCE' | 'CHAT'
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  // Hardened Form State for Edit Modal
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    shopId: "",
    status: "",
    password: "",
    bypassGeofence: false
  });

  useEffect(() => { setMounted(true); }, []);

  // --- DATA SYNCHRONIZATION ---
  const sync = useCallback(async (full = false) => {
    if (!staffId || !mounted) return;
    // Only show loader on full sync (initial load)
    if (full) setLoading(true);

    try {
      const timestamp = Date.now();

      // LIGHT HEARTBEAT: Only fetch essential live data (Messages & Last Known Location)
      // To strictly minimize load, we'd want a dedicated lightweight endpoint.
      // But re-fetching the member route is "okay" if the backend is fast. 
      // The USER complained about lag. The current member route returns EVERYTHING (Sales, Attendance, Reports). That's heavy!
      // Let's optimize: fetch messages separately (already doing that).
      // But for location, we need the user object.
      // FIX: Only do full fetch on mount.

      if (full) {
        const [uRes, sRes, mRes] = await Promise.all([
          fetch(`/api/hr/member/${staffId}?t=${timestamp}`),
          fetch(`/api/shops/list?t=${timestamp}`),
          fetch(`/api/mobile/messages?userId=${staffId}&countOnly=true&t=${timestamp}`)
        ]);

        const userData = await uRes.json();
        const shopData = await sRes.json();
        setData(userData);
        setShops(Array.isArray(shopData) ? shopData : (shopData.data || []));

        setFormState({
          name: userData?.name || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          shopId: userData?.shopId || "",
          status: userData?.status || "ACTIVE",
          password: "",
          bypassGeofence: userData?.bypassGeofence || false
        });
      } else {
        // LIGHT UPDATE: Just refresh critical status without blocking UI
        // Ideally we have a specific endpoint, but calling the main one quietly is better than blocking.
        // Is `setLoading(true)` the cause of lag? YES. It unmounts/remounts components if dependent on `loading`.
        // I removed `setLoading(true)` for non-full syncs.

        fetch(`/api/hr/member/${staffId}?t=${timestamp}`).then(r => r.json()).then(userData => {
          // Only update if data changed significantly? React reconciliation handles this usually.
          // But setting state causes re-render.
          // We just update `data` quietly.
          setData(userData);
        });
      }

    } catch (e) {
      console.error("Nexus Sync Failure");
      if (full) toast.error("Critical: Data link failed.");
    } finally {
      if (full) setLoading(false);
    }
  }, [staffId, mounted]);

  useEffect(() => {
    sync(true); // Full Sync on Mount
    const timer = setInterval(() => sync(false), 15000); // Quiet Heartbeat
    return () => clearInterval(timer);
  }, [sync]);

  const handleDownloadReport = () => {
    window.open(`/api/hr/member/${staffId}/export`, '_blank');
  };

  // --- SYSTEM ACTIONS ---
  const exec = async (action: string, payload: any) => {
    const t = toast.loading(`Processing Protocol...`);
    try {
      const endpoint = action === 'SEND_MESSAGE' ? '/api/mobile/messages' : (action === 'CREATE_TARGET' ? '/api/targets' : `/api/hr/member/${staffId}`);
      const method = (action === 'SEND_MESSAGE' || action === 'CREATE_TARGET') ? 'POST' : (action === 'DELETE' ? 'DELETE' : 'PATCH');

      // 🔧 FIX: Ensure receiverId is attached for messages
      const bodyPayload = action === 'SEND_MESSAGE'
        ? { content: payload.content, receiverId: staffId }
        : (action === 'CREATE_TARGET' ? { ...payload, userId: staffId } : { action, ...payload });

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
          // Clear password field after save
          setFormState(prev => ({ ...prev, password: "" }));
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
      status: formState.status,
      password: formState.password,
      bypassGeofence: formState.bypassGeofence
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-blue-100">

      {/* 🏛️ HEADER & NAV (Fixed: Removed Sticky to prevent obstruction) */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 -ml-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              {data?.name}
              {isOnline && <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              {data?.role} • {assignedShop?.name || "Unassigned"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'OVERVIEW' && (
            <button onClick={() => setShowMap(!showMap)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all flex items-center gap-2 shadow-sm hover:shadow-md ${showMap ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white text-slate-500 border-slate-200'}`}>
              <MapIcon size={14} /> {showMap ? 'Hide Radar' : 'Show Radar'}
            </button>
          )}
          <button onClick={handleDownloadReport} className="px-5 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm hover:shadow-md flex items-center gap-2">
            <Download size={14} /> Report
          </button>
          <button onClick={() => setShowSettings(true)} className="px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2">
            <Settings size={14} /> Config
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">

        {/* ---------------- LEFT COL: IDENTITY ---------------- */}
        <div className="col-span-12 xl:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-slate-100 rounded-full border-[6px] border-slate-50 shadow-2xl overflow-hidden mb-6 relative">
                {data?.image ? <img src={data.image} className="w-full h-full object-cover" /> : <UserCircle size={80} className="text-slate-300 m-auto mt-6" />}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{data?.name}</h2>
              <p className="text-sm font-medium text-slate-500 mb-8">{data?.email}</p>

              <div className="w-full space-y-3 mb-8">
                {/* TAB NAVIGATION */}
                <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${activeTab === 'OVERVIEW' ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <Layout size={18} /> <span className="text-xs font-black uppercase tracking-widest">Overview</span>
                  </div>
                </button>

                <button onClick={() => setActiveTab('INTEL')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${activeTab === 'INTEL' ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-transparent border-transparent hover:bg-blue-50 hover:text-blue-600 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <FileText size={18} /> <span className="text-xs font-black uppercase tracking-widest">Daily Intel</span>
                  </div>
                  {data?.dailyReports?.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">{data.dailyReports.length}</span>}
                </button>

                <button onClick={() => setActiveTab('COMPLIANCE')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${activeTab === 'COMPLIANCE' ? 'bg-rose-600 border-rose-600 text-white shadow-xl scale-105' : 'bg-transparent border-transparent hover:bg-rose-50 hover:text-rose-600 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} /> <span className="text-xs font-black uppercase tracking-widest">Compliance</span>
                  </div>
                  {data?.leaves?.filter((l: any) => l.status === 'PENDING').length > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">!</span>
                  )}
                </button>

                <button onClick={() => setActiveTab('CHAT')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${activeTab === 'CHAT' ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-105' : 'bg-transparent border-transparent hover:bg-emerald-50 hover:text-emerald-600 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} /> <span className="text-xs font-black uppercase tracking-widest">Secure Chat</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center px-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <span className={`text-xs font-black uppercase ${data?.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-500'}`}>{data?.status}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Signal</span>
                <span className="text-xs font-bold text-slate-900">{data.lastSeen ? new Date(data.lastSeen).toLocaleTimeString() : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- CENTER/RIGHT: WORKSPACE ---------------- */}
        <div className="col-span-12 xl:col-span-9 space-y-8">

          {/* VIEW: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* 🌍 LIVE SATELLITE MAP */}
              {showMap && assignedShop && (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Globe size={20} /></div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Live Telemetry</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time GPS Tracking</p>
                      </div>
                    </div>
                    {data?.isInsideZone ? (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} /> Secure (On-Site)
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 border border-amber-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} /> Off-Site / Roaming
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

              {/* PERFORMANCE BOARD */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <PerformanceBoard
                  sales={data?.sales || []}
                  dailyReports={data?.dailyReports || []}
                  geofenceStats={data?.geofenceStats || []}
                />
              </div>
            </div>
          )}

          {/* VIEW: DAILY INTEL */}
          {activeTab === 'INTEL' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 animate-in fade-in slide-in-from-right-4 duration-500 min-h-[600px]">
              <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daily Intelligence</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Field Reports & Market Data</p>
                </div>
              </div>
              <IntelBoard reports={data?.dailyReports || []} />
            </div>
          )}

          {/* VIEW: COMPLIANCE */}
          {activeTab === 'COMPLIANCE' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-2 animate-in fade-in slide-in-from-right-4 duration-500 min-h-[600px]">
              <ComplianceBoard
                attendance={data?.attendance || []}
                leaveRequests={data?.leaves || []}
                disciplinaryLog={data?.disciplinaryLog || []}
                staffId={staffId}
                onUpdateLeave={(id: string, s: string) => exec('MANAGE_LEAVE', { leaveId: id, status: s })}
                onRecallLeave={(id: string) => exec('MANAGE_LEAVE', { leaveId: id, status: 'REJECTED' })}
              />
            </div>
          )}

          {/* VIEW: CHAT */}
          {activeTab === 'CHAT' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm h-[800px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MessageSquare size={20} /></div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Encrypted Communication Line</span>
                </div>
                <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Uplink</span>
              </div>
              <div className="flex-1 min-h-0 bg-slate-50">
                <ChatConsole
                  messages={data?.messages || []}
                  viewerId={(session?.user as any)?.id}
                  onSendMessage={(c: string) => exec('SEND_MESSAGE', { content: c })}
                />
              </div>
            </div>
          )}

          {/* VIEW: PROMOTER DETAILS */}
          {activeTab === 'PROMOTER' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 animate-in fade-in slide-in-from-right-4 duration-500 min-h-[600px]">
              <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-8">
                <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                  <Briefcase size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Promoter Details</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Banking & Statutory Information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Banking Information</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</p>
                      <p className="text-lg font-bold text-slate-900">{data?.bankName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number</p>
                      <p className="text-lg font-bold text-slate-900 font-mono">{data?.bankAccountNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Name</p>
                      <p className="text-lg font-bold text-slate-900">{data?.bankAccountName || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Statutory & Employment</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SSNIT Number</p>
                      <p className="text-lg font-bold text-slate-900 font-mono">{data?.ssnitNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commencement Date</p>
                      <p className="text-lg font-bold text-slate-900">
                        {data?.commencementDate ? new Date(data.commencementDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>


              {/* TARGETS SECTION */}
              <div className="mt-10 pt-10 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900">Performance Targets</h3>
                  <button onClick={() => exec('CREATE_TARGET', { targetQuantity: 100, targetValue: 5000, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl">
                    + Set New Target
                  </button>
                </div>

                {data?.targets && data.targets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.targets.map((target: any) => (
                      <div key={target.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-200 transition-all">
                        <div className={`absolute top-0 left-0 w-1 h-full ${target.status === 'ACTIVE' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</p>
                            <p className="text-xs font-bold text-slate-700 mt-1">
                              {new Date(target.startDate).toLocaleDateString()} - {new Date(target.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${target.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                            {target.status}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Goal</p>
                            <p className="text-xl font-black text-slate-900">₵ {target.targetValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume Goal</p>
                            <p className="text-xl font-black text-slate-900">{target.targetQuantity} Units</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active targets set</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div >

      {/* ⚙️ SETTINGS MODAL */}
      {
        showSettings && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-xl text-slate-900">Profile Configuration</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="text-slate-400 hover:text-slate-900" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity</label>
                  <input className="w-full h-14 px-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="Full Name" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} />
                  <input className="w-full h-14 px-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="Email" value={formState.email} onChange={e => setFormState({ ...formState, email: e.target.value })} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</label>
                  <div className="relative">
                    <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select className="w-full h-14 pl-12 pr-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none" value={formState.shopId} onChange={e => setFormState({ ...formState, shopId: e.target.value })}>
                      <option value="">Unassigned</option>
                      {shops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* 🛡️ SECURITY SECTION */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Security & Access</span>
                  </div>

                  {/* Password Reset */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reset Password</label>
                    <div className="relative">
                      <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        className="w-full h-12 pl-12 pr-5 bg-white rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                        placeholder="Set new password (leave empty to keep current)"
                        value={formState.password}
                        onChange={e => setFormState({ ...formState, password: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Bypass Toggle */}
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">Remote GPS Access</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">Allow agent to work from anywhere (Bypass Geofence)</p>
                    </div>
                    <button
                      onClick={() => setFormState({ ...formState, bypassGeofence: !formState.bypassGeofence })}
                      className={`w-12 h-7 rounded-full relative transition-colors ${formState.bypassGeofence ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${formState.bypassGeofence ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-4">
                  <button onClick={handleSaveChanges} className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">Save Changes</button>
                  <button onClick={() => { if (confirm('Terminate?')) exec('DELETE', {}) }} className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center border border-red-100"><Trash2 size={24} /></button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}