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
  Map as MapIcon, Globe, Lock, FileText, Layout,
  Brain, Sparkles, TrendingUp, Search
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
  const [aiInsight, setAiInsight] = useState<any>(null);
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
    bypassGeofence: false,
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    ssnitNumber: "",
    commencementDate: ""
  });

  useEffect(() => { setMounted(true); }, []);

  // --- DATA SYNCHRONIZATION ---
  const sync = useCallback(async (full = false) => {
    if (!staffId || !mounted) return;
    if (full) setLoading(true);

    try {
      const timestamp = Date.now();

      if (full) {
        const [uRes, sRes, mRes, aRes] = await Promise.all([
          fetch(`/api/hr/member/${staffId}?t=${timestamp}`),
          fetch(`/api/shops/list?t=${timestamp}`),
          fetch(`/api/mobile/messages?userId=${staffId}&countOnly=true&t=${timestamp}`),
          fetch(`/api/ai/performance-insight?userId=${staffId}&t=${timestamp}`)
        ]);

        const userData = await uRes.json();
        const shopData = await sRes.json();
        const aiData = await aRes.json();

        setData(userData);
        setAiInsight(aiData);
        setShops(Array.isArray(shopData) ? shopData : (shopData.data || []));

        setFormState({
          name: userData?.name || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          shopId: userData?.shopId || "",
          status: userData?.status || "ACTIVE",
          password: "",
          bypassGeofence: userData?.bypassGeofence || false,
          bankName: userData?.bankName || "",
          bankAccountNumber: userData?.bankAccountNumber || "",
          bankAccountName: userData?.bankAccountName || "",
          ssnitNumber: userData?.ssnitNumber || "",
          commencementDate: userData?.commencementDate ? new Date(userData.commencementDate).toISOString().split('T')[0] : ""
        });
      } else {
        // LIGHT UPDATE: Quietly refresh position and targets without blocking UI
        fetch(`/api/hr/member/${staffId}?light=true&t=${timestamp}`).then(r => r.json()).then(userData => {
          setData((prev: any) => ({
            ...prev,
            ...userData,
            // Keep existing heavy data if not provided in light mode
            sales: prev.sales,
            dailyReports: prev.dailyReports,
            attendance: prev.attendance,
            leaves: prev.leaves,
            disciplinary: prev.disciplinary,
            disciplinaryLog: prev.disciplinaryLog,
            messages: prev.messages
          }));
        });
        fetch(`/api/ai/performance-insight?userId=${staffId}&t=${timestamp}`).then(r => r.json()).then(aiData => {
          setAiInsight(aiData);
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
      bypassGeofence: formState.bypassGeofence,
      bankName: formState.bankName,
      bankAccountNumber: formState.bankAccountNumber,
      bankAccountName: formState.bankAccountName,
      ssnitNumber: formState.ssnitNumber,
      commencementDate: formState.commencementDate
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
      {/* 🏛️ PREMIUM HEADER (Non-Sticky for better visibility) */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 relative z-40 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-2.5 -ml-2 rounded-xl hover:bg-slate-100/80 text-slate-400 hover:text-slate-900 transition-all active:scale-95 border border-transparent hover:border-slate-200">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {data?.name}
              </h1>
              {isOnline && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                </div>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
              {data?.role === 'PROMOTER' ? 'Field Agent' : data?.role} • {assignedShop?.name || "Pending Assignment"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'OVERVIEW' && (
            <button
              onClick={() => setShowMap(!showMap)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 shadow-sm ${showMap ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              <MapIcon size={14} /> {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          )}
          <button onClick={handleDownloadReport} className="px-4 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <Download size={14} /> Download
          </button>
          <button onClick={() => setShowSettings(true)} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5 flex items-center gap-2">
            <Settings size={14} /> Settings
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">

        {/* ---------------- LEFT COL: IDENTITY & STATUS ---------------- */}
        <div className="col-span-12 xl:col-span-3 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-white/40 ring-1 ring-slate-200/50">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] border-[6px] border-white shadow-2xl overflow-hidden mb-6 transition-transform group-hover:scale-105 duration-500">
                  {data?.image ? <img src={data.image} className="w-full h-full object-cover" /> : <UserCircle size={80} className="text-slate-300 m-auto mt-6" />}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-blue-600">
                  <Fingerprint size={18} />
                </div>
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{data?.name}</h2>
              <p className="text-xs font-bold text-slate-400 mb-8 lowercase tracking-wide">{data?.email}</p>

              {/* 🧭 NAVIGATION MOVED ABOVE */}
              <div className="w-full space-y-2 mb-8">
                {/* (I already updated this block in the previous turn, keeping structure consistent) */}
                <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all border ${activeTab === 'OVERVIEW' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <Layout size={18} /> <span className="text-[11px] font-black uppercase tracking-widest">Performance</span>
                  </div>
                </button>

                <button onClick={() => setActiveTab('INTEL')} className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all border ${activeTab === 'INTEL' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-transparent border-transparent hover:bg-blue-50 hover:text-blue-600 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <FileText size={18} /> <span className="text-[11px] font-black uppercase tracking-widest">Field Reports</span>
                  </div>
                  {data?.dailyReports?.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">{data.dailyReports.length}</span>}
                </button>

                <button onClick={() => setActiveTab('COMPLIANCE')} className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all border ${activeTab === 'COMPLIANCE' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-transparent border-transparent hover:bg-rose-50 hover:text-rose-600 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} /> <span className="text-[11px] font-black uppercase tracking-widest">Leave & Records</span>
                  </div>
                  {data?.leaves?.filter((l: any) => l.status === 'PENDING').length > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">!</span>
                  )}
                </button>

                <button onClick={() => setActiveTab('CHAT')} className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all border ${activeTab === 'CHAT' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-transparent border-transparent hover:bg-emerald-50 hover:text-emerald-600 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} /> <span className="text-[11px] font-black uppercase tracking-widest">Messaging</span>
                  </div>
                </button>

                <button onClick={() => setActiveTab('PROMOTER')} className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all border ${activeTab === 'PROMOTER' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-transparent border-transparent hover:bg-amber-50 hover:text-amber-500 text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} /> <span className="text-[11px] font-black uppercase tracking-widest">Employment</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center px-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Job Status</span>
                <span className={`text-xs font-black uppercase ${data?.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-500'}`}>{data?.status}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Link</span>
                <span className="text-xs font-bold text-slate-900">{data.lastSeen ? new Date(data.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- CENTER/RIGHT: WORKSPACE ---------------- */}
        <div className="col-span-12 xl:col-span-9 space-y-8">

          {/* VIEW: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* 🌍 LIVE POSITION MAP */}
              {showMap && assignedShop && (
                <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><Globe size={18} /></div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Live Position</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Known Signal Location</p>
                      </div>
                    </div>
                    {data?.isInsideZone ? (
                      <span className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100">
                        <ShieldCheck size={14} /> At Work (On-Site)
                      </span>
                    ) : (
                      <span className="bg-amber-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-100">
                        <AlertTriangle size={14} /> Out of Bounds
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

              {/* 🧠 NEXUS INTELLIGENCE (AI ASSISTANT) */}
              {aiInsight && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-1 shadow-xl shadow-blue-200/50 group">
                  <div className="bg-white/95 backdrop-blur-xl rounded-[2.3rem] p-8 overflow-hidden relative">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-8 text-blue-100 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                      <Brain size={120} />
                    </div>
                    <div className="absolute top-5 right-5">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                        <Sparkles size={12} className="text-blue-600 animate-pulse" />
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">AI Briefing</span>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                          <Brain size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none">Nexus Intelligence</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Automated Management Insight</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                          <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                            "{aiInsight.briefing}"
                          </p>

                          <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <TrendingUp size={12} className="text-blue-600" /> Key Recommendations
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {aiInsight.recommendations.map((rec: string, i: number) => (
                                <div key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-white hover:border-blue-200 transition-all cursor-default flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                                  {rec}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consistency</p>
                              <p className="text-2xl font-black text-slate-900">{aiInsight.metrics.consistencyScore}%</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Target Progress</p>
                              <p className="text-2xl font-black text-blue-600">{aiInsight.metrics.revenueProgress.toFixed(1)}%</p>
                            </div>
                          </div>

                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-1000"
                              style={{ width: `${aiInsight.metrics.revenueProgress}%` }}
                            />
                          </div>

                          <div className="flex justify-between mt-2">
                            <p className="text-[9px] font-bold text-slate-400">AVG Ticket Value</p>
                            <p className="text-[10px] font-black text-slate-900">₵{aiInsight.metrics.avgOrderValue.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Field Reports</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Activity Logs & Market News</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Payroll Details</h4>
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
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Office Records</h4>
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
                  <button onClick={() => exec('CREATE_TARGET', { targetQuantity: 100, targetValue: 5000, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:-translate-y-0.5">
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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Target</p>
                            <p className="text-xl font-black text-slate-900">₵ {target.targetValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity Target</p>
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
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white ring-1 ring-slate-200/50">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Settings</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Profile & Access Control</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all shadow-sm active:scale-95 text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle size={16} className="text-slate-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Identity</label>
                </div>
                <input className="w-full h-14 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" placeholder="Full Name" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} />
                <input className="w-full h-14 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" placeholder="Email Address" value={formState.email} onChange={e => setFormState({ ...formState, email: e.target.value })} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Store size={16} className="text-slate-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shop Assignment</label>
                </div>
                <div className="relative">
                  <select className="w-full h-14 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer" value={formState.shopId} onChange={e => setFormState({ ...formState, shopId: e.target.value })}>
                    <option value="">No Assignment</option>
                    {shops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} className="text-slate-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payroll & Records</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input className="w-full h-14 px-5 bg-white rounded-2xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm" placeholder="Bank Name" value={formState.bankName} onChange={e => setFormState({ ...formState, bankName: e.target.value })} />
                  <input className="w-full h-14 px-5 bg-white rounded-2xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm" placeholder="Account #" value={formState.bankAccountNumber} onChange={e => setFormState({ ...formState, bankAccountNumber: e.target.value })} />
                  <div className="col-span-2">
                    <input className="w-full h-14 px-5 bg-white rounded-2xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm" placeholder="Account Name" value={formState.bankAccountName} onChange={e => setFormState({ ...formState, bankAccountName: e.target.value })} />
                  </div>
                  <input className="w-full h-14 px-5 bg-white rounded-2xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm" placeholder="SSNIT #" value={formState.ssnitNumber} onChange={e => setFormState({ ...formState, ssnitNumber: e.target.value })} />
                  <div className="relative">
                    <input type="date" className="w-full h-14 px-5 bg-white rounded-2xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm" value={formState.commencementDate} onChange={e => setFormState({ ...formState, commencementDate: e.target.value })} />
                  </div>
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