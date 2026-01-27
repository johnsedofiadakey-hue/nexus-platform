"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, MessageSquare, LayoutDashboard, 
  MapPin, ShieldAlert, UserCheck, Settings,
  Zap, Power, Trash2, X
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from 'next/dynamic';
import { Eye, EyeOff } from "lucide-react";

// UI Components
import ProfileCard from "@/components/dashboard/hr/ProfileCard";
import ChatConsole from "@/components/dashboard/hr/ChatConsole";
import PerformanceBoard from "@/components/dashboard/hr/PerformanceBoard";
import ComplianceBoard from "@/components/dashboard/hr/ComplianceBoard";

// 🛰️ SATELLITE ENGINE
const LiveMap = dynamic(() => import('@/components/maps/LiveMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center rounded-2xl border border-slate-200">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Acquiring Signal...</span>
    </div>
  )
});

export default function MemberPortal() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;
  const adminId = "SYSTEM_ADMIN_ID"; 

  // --- STATE ---
  const [mounted, setMounted] = useState(false); 
  const [data, setData] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true); // 🗺️ Map Toggle
  const [showSettings, setShowSettings] = useState(false); // ⚙️ Settings Modal

  useEffect(() => { setMounted(true); }, []);

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
      const msgData = await mRes.json();
      
      setData({ ...userData, unreadCount: msgData?.unread || 0 });
      setShops(Array.isArray(shopData) ? shopData : (shopData.data || []));
    } catch (e) {
      console.error("Sync Failure");
    } finally {
      setLoading(false);
    }
  }, [staffId, mounted]);

  useEffect(() => { 
    sync();
    const timer = setInterval(() => sync(true), 15000); 
    return () => clearInterval(timer);
  }, [sync]);

  const exec = async (action: string, payload: any) => {
    const t = toast.loading(`Processing...`);
    try {
      const endpoint = action === 'SEND_MESSAGE' ? '/api/mobile/messages' : `/api/hr/member/${staffId}`;
      const method = action === 'SEND_MESSAGE' ? 'POST' : (action === 'DELETE' ? 'DELETE' : 'PATCH');
      
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: action !== 'DELETE' ? JSON.stringify(action === 'SEND_MESSAGE' 
          ? { content: payload.content, senderId: adminId, receiverId: staffId }
          : { action, ...payload }) : undefined
      });
      
      if (res.ok) { 
        toast.success("Success", { id: t }); 
        if (action === 'DELETE') router.push('/dashboard/hr');
        else {
           sync(true); 
           setShowSettings(false);
        }
      } else {
        throw new Error();
      }
    } catch (e) { 
        toast.error("Action Failed", { id: t }); 
    }
  };

  if (!mounted || loading || !data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white px-10 text-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-5" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Establishing Connection</p>
    </div>
  );

  // 🛡️ STICKY MAP LOGIC: Prefer the shop embedded in user profile
  const targetShops = data.shop ? [data.shop] : shops.filter(s => s.id === data.shopId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8 space-y-6 animate-in fade-in duration-700 font-sans text-slate-900">
      
      {/* --- HEADER: IDENTITY & CONTROLS --- */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={() => router.back()} className="h-12 w-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all active:scale-95">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-slate-100 rounded-xl border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center">
               {data.image ? <img src={data.image} alt={data.name} className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-slate-400">{data.name.charAt(0)}</span>}
             </div>
             <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">{data.name}</h1>
                  {data.status === 'SUSPENDED' && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase rounded-md border border-rose-100">Suspended</span>}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${data.lastLat ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                   <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{data.lastLat ? 'Online' : 'Offline'}</span>
                   <span className="text-slate-300 mx-1">•</span>
                   <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{data.role?.replace('_', ' ')}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          {/* 🗺️ MAP TOGGLE */}
          <button 
            onClick={() => setShowMap(!showMap)}
            className={`h-12 px-5 rounded-xl flex items-center gap-2.5 font-bold text-[11px] uppercase tracking-wide transition-all border ${showMap ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            {showMap ? <Eye size={16} /> : <EyeOff size={16} />}
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>

          {/* ⚙️ SETTINGS TOGGLE */}
          <button 
            onClick={() => setShowSettings(true)}
            className="h-12 px-6 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-wide flex items-center gap-2.5 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Settings size={16} /> Controls
          </button>
        </div>
      </header>

      {/* --- SETTINGS & CONTROL MODAL --- */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-xl rounded-2xl p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">System Controls</h2>
                 <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
              </div>

              {/* 1. EDIT INFORMATION */}
              <div className="space-y-3">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Record</h3>
                 <div className="grid grid-cols-2 gap-3">
                    <input id="edit-name" defaultValue={data.name} className="h-12 bg-slate-50 px-4 rounded-xl text-xs font-semibold border border-slate-200 focus:border-blue-500 focus:outline-none transition-colors" placeholder="Full Name" />
                    <input id="edit-email" defaultValue={data.email} className="h-12 bg-slate-50 px-4 rounded-xl text-xs font-semibold border border-slate-200 focus:border-blue-500 focus:outline-none transition-colors" placeholder="Email Address" />
                 </div>
                 <button 
                   onClick={() => exec('UPDATE_PROFILE', { 
                      name: (document.getElementById('edit-name') as HTMLInputElement).value,
                      email: (document.getElementById('edit-email') as HTMLInputElement).value,
                   })}
                   className="w-full h-11 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md shadow-blue-100"
                 >
                   Save Changes
                 </button>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* 2. PASSWORD RESET */}
              <div className="space-y-3">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Override</h3>
                 <div className="flex gap-3">
                    <input id="new-pass" type="password" className="flex-1 h-12 bg-slate-50 px-4 rounded-xl text-xs font-semibold border border-slate-200 focus:border-blue-500 focus:outline-none transition-colors" placeholder="New Password" />
                    <button 
                       onClick={() => exec('RESET_PASSWORD', { password: (document.getElementById('new-pass') as HTMLInputElement).value })}
                       className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800"
                    >
                       Reset Key
                    </button>
                 </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* 3. DANGER ZONE */}
              <div className="space-y-3">
                 <h3 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={12} /> Critical Zone</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {/* KILL SWITCH */}
                    <button 
                       onClick={() => confirm("Confirm: Suspend/Activate this agent?") && exec('UPDATE_PROFILE', { status: data.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                       className={`h-12 border rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wide transition-all ${data.status === 'SUSPENDED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}
                    >
                       <Power size={14} /> {data.status === 'SUSPENDED' ? 'Re-Activate' : 'Suspend Account'}
                    </button>

                    {/* DELETE */}
                    <button 
                       onClick={() => {
                          if (confirm("WARNING: PERMANENT DATA LOSS.\nAre you sure you want to delete this agent?")) {
                             if (confirm("Double Check: This action cannot be undone.")) exec('DELETE', {});
                          }
                       }}
                       className="h-12 bg-white border border-rose-100 text-rose-500 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wide hover:bg-rose-50 transition-all"
                    >
                       <Trash2 size={14} /> Delete Records
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTEXT (4/12) */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <UserCheck size={14} /> Personnel Profile
             </h3>
             <ProfileCard profile={data} shops={shops} onSave={(f: any) => exec('UPDATE_PROFILE', f)} />
          </section>

          <section className="h-[550px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <MessageSquare size={16} className="text-blue-600" />
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Direct Comms</span>
                </div>
             </div>
             <div className="flex-1 min-h-0">
                <ChatConsole messages={data.messages || []} viewerId="ADMIN_SIDE" onSendMessage={(c: string) => exec('SEND_MESSAGE', { content: c })} />
             </div>
          </section>
        </div>

        {/* RIGHT COLUMN: OPERATIONS (8/12) */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          
          {/* MAP SECTION (TOGGLEABLE) */}
          {showMap && (
             <section className="h-[450px] bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group animate-in slide-in-from-top-2">
                {/* 🛡️ PASSING TARGET SHOPS DIRECTLY FOR STICKY LOGIC */}
                <LiveMap shops={targetShops} reps={[data]} mapType="SATELLITE" />
                
                <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur-md px-5 py-3 rounded-xl shadow-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                        <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Live Feed</p>
                      <p className="text-[10px] font-bold text-slate-900 uppercase mt-0.5">Satellite Active</p>
                    </div>
                  </div>
                </div>
             </section>
          )}

          {/* PERFORMANCE METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
               <PerformanceBoard 
                  sales={data.sales || []} 
                  dailyReports={data.dailyReports || []} 
                  targets={data.targets} 
                  geofenceStats={data.geofenceStats || []} 
               />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
               <ComplianceBoard 
                  attendance={data.attendance || []} 
                  leaveRequests={data.leaves || []} 
                  disciplinaryLog={data.disciplinaryLog || []} 
                  staffId={staffId} 
                  onUpdateLeave={(id: string, s: string) => exec('MANAGE_LEAVE', { leaveId: id, status: s })} 
               />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}