"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, MessageSquare, MapPin, 
  Settings, Power, Trash2, X, Eye, EyeOff, 
  Activity, Download, Shield, Mail, Briefcase,
  Store, Key, UserCircle, Save, AlertTriangle,
  Smartphone, Fingerprint, ShieldCheck, Info,
  ChevronRight, Calendar, BarChart3
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
  const adminId = "SYSTEM_ADMIN_ID"; 

  // --- CORE STATE ---
  const [mounted, setMounted] = useState(false); 
  const [data, setData] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false); 
  const [showSettings, setShowSettings] = useState(false);

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
      const msgData = await mRes.json();
      
      setData({ ...userData, unreadCount: msgData?.unread || 0 });
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
    const timer = setInterval(() => sync(true), 20000); // 20s heartbeat
    return () => clearInterval(timer);
  }, [sync]);

  // --- SYSTEM ACTIONS ---
  const exec = async (action: string, payload: any) => {
    const t = toast.loading(`Uplinking...`);
    try {
      const endpoint = action === 'SEND_MESSAGE' ? '/api/mobile/messages' : `/api/hr/member/${staffId}`;
      const method = action === 'SEND_MESSAGE' ? 'POST' : (action === 'DELETE' ? 'DELETE' : 'PATCH');
      
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: action !== 'DELETE' ? JSON.stringify({ action, ...payload }) : undefined
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
        throw new Error(err.error || "Uplink Rejected");
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

  const handleDownloadReport = () => {
    if(!data) return;
    const reportData = {
        Name: data?.name || "Unknown",
        Role: data?.role || "N/A",
        Status: data?.status || "N/A",
        Email: data?.email || "N/A",
        Shop: data?.shop?.name || "Unassigned",
        Total_Sales: data?.sales?.reduce((acc:number, s:any) => acc + (s.totalAmount || 0), 0) || 0,
        Total_Logs: data?.attendance?.length || 0,
        System_Timestamp: new Date().toISOString()
    };
    const csvContent = "data:text/csv;charset=utf-8," + Object.keys(reportData).join(",") + "\n" + Object.values(reportData).join(",");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${(data?.name || "Operative").replace(/\s+/g, '_')}_Intel.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success("Intel Exported");
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
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 pb-20">
      
      {/* 🏛️ FIXED NAVIGATION BAR */}
      <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex flex-col">
             <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{data?.name}</h1>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${data?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    <div className={`w-1 h-1 rounded-full ${data?.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {data?.status}
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
               Registry ID: {data?.id?.slice(-8)} • {data?.role}
             </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleDownloadReport} className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Download size={14} /> Export Intel
          </button>
          
          <button 
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all border ${showMap ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {showMap ? <EyeOff size={14} /> : <MapPin size={14} />}
            {showMap ? 'Hide Radar' : 'Locate'}
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-100"
          >
            <Settings size={14} /> Configuration
          </button>
        </div>
      </div>

      {/* ⚙️ CONFIGURATION MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
              <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100">
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Operative Settings</h2>
                 <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-rose-600"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                  
                  {/* DATA FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ModalInput label="Legal Name" value={formState.name} onChange={(v) => setFormState({...formState, name: v})} />
                    <ModalInput label="Signal Phone" value={formState.phone} onChange={(v) => setFormState({...formState, phone: v})} />
                    <ModalInput label="Network Email" value={formState.email} onChange={(v) => setFormState({...formState, email: v})} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Hub</label>
                      <select 
                          value={formState.shopId} 
                          onChange={(e) => setFormState({...formState, shopId: e.target.value})}
                          className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                      >
                          <option value="">No Hub Selected</option>
                          {shops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* SECURITY */}
                  <div className="pt-8 border-t border-slate-100 space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={12}/> Primary Access Key</label>
                     <div className="flex gap-3">
                        <input 
                            type="password"
                            value={formState.password}
                            onChange={(e) => setFormState({...formState, password: e.target.value})}
                            className="flex-1 h-11 bg-slate-50 border border-slate-200 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500" 
                            placeholder="New Password..." 
                        />
                        <button onClick={() => { if(!formState.password) return; exec('RESET_PASSWORD', { password: formState.password }); }} className="px-6 h-11 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all">
                            Reset
                        </button>
                     </div>
                  </div>

                  {/* CRITICAL ACTIONS */}
                  <div className="pt-8 border-t border-slate-100 flex gap-4">
                    <button onClick={handleSaveChanges} className="flex-1 h-12 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-lg shadow-blue-100">
                      <Save size={16} /> Sync Profile
                    </button>
                    <button onClick={() => { if(confirm("Terminate operative profile?")) exec('DELETE', {}); }} className="px-6 h-12 border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-50 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* 📊 MAIN OPERATIONAL GRID */}
      <div className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-12 gap-8">
        
        {/* LEFT PANEL: IDENTITY CARD & UPLINK */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-8">
          
          {/* Operative Passport */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
             <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-3xl bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center overflow-hidden">
                   {data?.image ? <img src={data.image} className="w-full h-full object-cover"/> : <UserCircle size={48} className="text-slate-200" />}
                </div>
                {isOnline && <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white shadow-lg" />}
             </div>
             
             <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">{data?.name}</h2>
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{assignedShop?.name || "Global Fleet"}</p>

             <div className="grid grid-cols-1 gap-4 mt-10 pt-8 border-t border-slate-50 text-left">
                <MiniInfo icon={Mail} label="Network Mail" value={data.email} />
                <MiniInfo icon={Smartphone} label="Signal Line" value={data.phone || "Offline"} />
                <MiniInfo icon={ShieldCheck} label="Identity ID" value={data.ghanaCard || "Unverified"} />
             </div>
          </div>

          {/* Secure Uplink (Chat) */}
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[550px] overflow-hidden shadow-sm">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} /> Secure Uplink
                </span>
                {data?.unreadCount > 0 && <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{data.unreadCount}</span>}
             </div>
             <div className="flex-1 min-h-0">
                <ChatConsole messages={data?.messages || []} viewerId="ADMIN_SIDE" onSendMessage={(c: string) => exec('SEND_MESSAGE', { content: c })} />
             </div>
          </div>
        </div>

        {/* RIGHT PANEL: RADAR & ANALYTICS */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-8">
          
          {/* Live Radar Map */}
          {showMap && assignedShop && (
             <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm animate-in zoom-in-95 duration-300">
                <div className="h-[500px] w-full relative z-0 rounded-[2rem] overflow-hidden bg-slate-100">
                   <GeofenceMap 
                     shopLat={assignedShop.latitude || 5.6037}
                     shopLng={assignedShop.longitude || -0.1870}
                     shopRadius={assignedShop.radius || 50}
                     userLat={data?.lastLat}
                     userLng={data?.lastLng}
                   />
                   <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest leading-none">Radar Active</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Monitoring Hub: {assignedShop.name}</p>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* Core Analytics Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-6 px-2">
                  <BarChart3 className="text-blue-500" size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Revenue Performance</h3>
               </div>
               <PerformanceBoard 
                  sales={data?.sales || []} 
                  dailyReports={data?.dailyReports || []} 
                  targets={data?.targets} 
                  geofenceStats={data?.geofenceStats || []} 
               />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-6 px-2">
                  <ShieldCheck className="text-emerald-500" size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Compliance & Logs</h3>
               </div>
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
    </div>
  );
}

// --- 🧩 SAAS COMPONENTS ---

function ModalInput({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 bg-slate-50 border border-slate-200 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
      />
    </div>
  );
}

function MiniInfo({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}