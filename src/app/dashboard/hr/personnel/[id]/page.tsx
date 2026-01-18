"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, Phone, Mail, 
  Activity, Send, Lock, FileText, 
  AlertTriangle, Download, 
  Edit2, TrendingUp, Building2, 
  ChevronRight, Save, Wifi, WifiOff,
  Trash2, Loader2, PhoneIncoming, PhoneOff, Key, Reply,
  DollarSign, Users, ShoppingCart, Clock
} from "lucide-react";

// 🗺️ MAP ENGINE (Universal Loader)
const LiveMap = dynamic(() => import("@/components/LiveMap"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest">
      <div className="flex items-center gap-2">
         <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
         Connecting Satellite Grid...
      </div>
    </div>
  )
});

type Params = Promise<{ id: string }>;

export default function PersonnelPortal({ params }: { params: Params }) {
  const resolvedParams = use(params);
  const staffId = resolvedParams.id; 
  const router = useRouter();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- 1. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEAVE' | 'HISTORY' | 'REPORTS' | 'CHAT' | 'MAP'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(true);
  
  // Identity State
  const [myId, setMyId] = useState<string | null>(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  
  // Communication States
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  
  // Chat Editing State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgContent, setEditMsgContent] = useState("");

  // Reporting & Data
  const [reportFilter, setReportFilter] = useState("Daily");
  const [profile, setProfile] = useState<any>(null); 
  const [shops, setShops] = useState<any[]>([]); 
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]); // NEW: Sales History
  const [dailyReports, setDailyReports] = useState<any[]>([]); // NEW: Daily Reports
  
  // Password Reset
  const [newPassword, setNewPassword] = useState("");

  // Targets
  const [targets, setTargets] = useState({
    revenueTarget: 20000, 
    volumeTarget: 50,     
    revenueCurrent: 0,
    volumeCurrent: 0
  });

  const [editTargetsInput, setEditTargetsInput] = useState({ rev: "20000", vol: "50" });

  // Live GPS State
  const [gpsData, setGpsData] = useState({ 
    lat: 5.6037, 
    lng: -0.1870, 
    lastSync: "Waiting...",
    status: "Offline",
    isLive: false,
    battery: 0,
    speed: 0
  });

  // --- HELPER: LOGIC TO DETERMINE IF USER IS TRULY LIVE ---
  const calculateGpsStatus = (userData: any) => {
    if (!userData.lastSync || !userData.lastLat) {
      return { status: "Offline", isLive: false, time: "Never" };
    }

    const lastSyncDate = new Date(userData.lastSync);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSyncDate.getTime()) / 60000;

    const dbStatus = (userData.status || '').toUpperCase();
    if (dbStatus === 'OFFLINE' || dbStatus === 'CLOCKED_OUT' || dbStatus === 'SHIFT_ENDED') {
      return { 
        status: "Shift Ended", 
        isLive: false, 
        time: lastSyncDate.toLocaleTimeString() 
      };
    }

    if (diffMinutes > 5) {
       return { 
         status: "Signal Lost (Offline)", 
         isLive: false, 
         time: lastSyncDate.toLocaleTimeString() 
       };
    }

    return { 
      status: "Live Tracking", 
      isLive: true, 
      time: lastSyncDate.toLocaleTimeString() 
    };
  };

  // --- 2. INITIAL DATA LOAD ---
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!staffId) return;
      setIsLoading(true);
      try {
        // A. Fetch Staff Profile
        const userRes = await fetch(`/api/hr/staff/${staffId}?t=${Date.now()}`);
        if (!userRes.ok) {
          alert("User not found.");
          router.push("/dashboard/hr/enrollment");
          return;
        }
        const userData = await userRes.json();

        setProfile({
          ...userData,
          role: userData.role || "SALES_REP",
          assignedShopId: userData.shopId || "", 
          status: userData.status || 'Active',
          phone: userData.phone || "",
          email: userData.email || ""
        });

        // B. Update Targets
        setTargets({
          revenueTarget: userData.monthlyTargetRev || 20000,
          volumeTarget: userData.monthlyTargetVol || 50,
          revenueCurrent: userData.totalRevenue || 0,
          volumeCurrent: userData._count?.sales || 0
        });

        // C. Set Initial GPS
        const gpsStatus = calculateGpsStatus(userData);
        setGpsData({
            lat: userData.lastLat || 5.6037,
            lng: userData.lastLng || -0.1870,
            lastSync: gpsStatus.time,
            status: gpsStatus.status,
            isLive: gpsStatus.isLive,
            battery: 0,
            speed: 0
        });

        // D. Fetch Shops
        const shopRes = await fetch("/api/shops");
        if (shopRes.ok) setShops(await shopRes.json());

        // E. Fetch History (Sales, Reports, Attendance)
        try {
          const leaveRes = await fetch(`/api/leaves?userId=${staffId}`);
          if (leaveRes.ok) setLeaveRequests(await leaveRes.json());
          
          const attendRes = await fetch(`/api/attendance?userId=${staffId}`);
          if (attendRes.ok) setAttendanceHistory(await attendRes.json());

          // NEW: Fetch Sales & Reports
          const salesRes = await fetch(`/api/sales?userId=${staffId}`);
          if (salesRes.ok) setSalesHistory(await salesRes.json());

          const reportsRes = await fetch(`/api/daily-reports?userId=${staffId}`);
          if (reportsRes.ok) setDailyReports(await reportsRes.json());

        } catch (e) {
          console.warn("History data endpoints not ready yet");
        }

      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [staffId, router]);

  // --- 3. LIVE POLLING ---
  useEffect(() => {
    if (!staffId) return;

    const pollLive = async () => {
      try {
        // 1. Poll Chat
        if (activeTab === 'CHAT') {
          const res = await fetch(`/api/messages?staffId=${staffId}&t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
            if (!myId && data.length > 0) {
               const sentByMe = data.find((m: any) => m.senderId !== staffId);
               if (sentByMe) setMyId(sentByMe.senderId);
            }
          }
        }

        // 2. Poll User Data (GPS & Sales)
        const res = await fetch(`/api/hr/staff/${staffId}`);
        if (res.ok) {
          const data = await res.json();
          const gpsStatus = calculateGpsStatus(data);
          
          setGpsData({
             lat: data.lastLat || 5.6037,
             lng: data.lastLng || -0.1870,
             lastSync: gpsStatus.time,
             status: gpsStatus.status,
             isLive: gpsStatus.isLive,
             battery: 0, 
             speed: 0
           });

          setTargets(prev => ({
            ...prev,
            revenueCurrent: data.totalRevenue || 0,
            volumeCurrent: data._count?.sales || 0
          }));
        }
      } catch (e) {
        console.error("Live Sync Failed", e);
      }
    };

    const interval = setInterval(pollLive, 5000); 
    pollLive(); 
    return () => clearInterval(interval);
  }, [activeTab, staffId, myId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);


  // --- 4. ACTION HANDLERS ---

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently remove this staff member?")) return;
    setIsDeleting(true);
    await fetch(`/api/hr/staff/${staffId}`, { method: "DELETE" });
    router.push("/dashboard/hr/enrollment"); 
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: profile.status,
        assignedShopId: profile.assignedShopId || null 
      };
      // Password Reset Logic
      if (newPassword.trim()) {
        payload.password = newPassword;
      }

      await fetch(`/api/hr/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setIsEditing(false);
      setNewPassword("");
      alert(newPassword.trim() ? "Profile & Password Updated!" : "Profile Saved!");
    } catch (error) {
      alert("Save Failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTargets = async () => {
    setTargets(prev => ({
      ...prev,
      revenueTarget: parseInt(editTargetsInput.rev),
      volumeTarget: parseInt(editTargetsInput.vol)
    }));
    setIsEditingTargets(false);
    // Add API call here to save targets permanently if needed
  };

  // --- CHAT LOGIC ---

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setIsSending(true);
    
    const tempText = chatMessage;
    setChatMessage(""); 

    const tempMsg = { 
        id: "temp-" + Date.now(), 
        content: tempText, 
        senderId: "ME", 
        isOptimistic: true,
        createdAt: new Date().toISOString() 
    };
    
    setMessages(prev => [...prev, tempMsg]);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempText, receiverId: staffId })
      });
    } catch (error) {
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (msgId: string) => {
    if (!editMsgContent.trim()) return;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editMsgContent } : m));
    setEditingMsgId(null);
    try {
      await fetch(`/api/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msgId, content: editMsgContent })
      });
    } catch (e) { alert("Edit failed"); }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try { await fetch(`/api/messages?id=${msgId}`, { method: "DELETE" }); } catch (e) { alert("Delete failed"); }
  };

  const updateLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setLeaveRequests(prev => prev.map(req => req.id === leaveId ? { ...req, status } : req));
      }
    } catch (e) { alert("Failed to update leave request"); }
  };


  // --- RENDER ---
  if (isLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest">Accessing Personnel Link...</p>
      </div>
    );
  }

  const currentShop = shops.find(s => s.id === profile.assignedShopId) || { name: "Unassigned", location: "N/A" };
  const revProgress = Math.min(100, Math.round((targets.revenueCurrent / targets.revenueTarget) * 100)) || 0;
  const volProgress = Math.min(100, Math.round((targets.volumeCurrent / targets.volumeTarget) * 100)) || 0;

  // Calculate Metrics for Reports
  const totalWalkIns = dailyReports.reduce((acc, curr) => acc + (curr.walkIns || 0), 0);
  const totalInquiries = dailyReports.reduce((acc, curr) => acc + (curr.inquiries || 0), 0);
  const totalSalesCount = salesHistory.length;
  const totalRevenueCalc = salesHistory.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900 animate-in fade-in duration-500">
      
      {/* 🔙 TOP NAVIGATION */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard/hr/enrollment" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Team Directory
        </Link>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsCallActive(!isCallActive)}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
               isCallActive 
               ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-2" 
               : "bg-slate-200 text-slate-500"
             }`}
           >
             {isCallActive ? <PhoneIncoming className="w-3 h-3 animate-pulse" /> : <PhoneOff className="w-3 h-3" />}
             {isCallActive ? "Lines Open" : "Lines Blocked"}
           </button>

           <div className="flex gap-3">
             {isEditing ? (
               <>
                 <button onClick={() => { setIsEditing(false); setNewPassword(""); }} className="px-4 py-2 bg-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-300">
                   Cancel
                 </button>
                 <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50">
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                   Save Profile
                 </button>
               </>
             ) : (
               <>
                 <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 disabled:opacity-50 transition-all">
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                 </button>
                 <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Settings
                 </button>
               </>
             )}
           </div>
        </div>
      </div>

      {/* 👤 PROFILE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden transition-all">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl shrink-0">
          {profile.name.charAt(0)}
        </div>
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              {isEditing ? (
                <input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent w-full md:w-auto" />
              ) : (
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  {profile.name}
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    profile.status === 'Active' || profile.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                    profile.status === 'On Leave' || profile.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>{profile.status}</span>
                </h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                 {isEditing ? (
                   <select value={profile.assignedShopId} onChange={(e) => setProfile({...profile, assignedShopId: e.target.value})} className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none">
                     <option value="">-- No Shop Assigned --</option>
                     {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name} ({shop.location})</option>)}
                   </select>
                 ) : (
                   <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                     <Building2 className="w-3.5 h-3.5" />
                     {profile.role} at <span className="text-slate-900 font-bold">{currentShop.name}</span>
                   </p>
                 )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              {isEditing ? <input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="text-xs font-semibold bg-slate-50 border-b border-slate-300 w-full" /> : <span className="text-xs font-semibold text-slate-600">{profile.phone || "No Phone"}</span>}
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              {isEditing ? <input value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="text-xs font-semibold bg-slate-50 border-b border-slate-300 w-full" /> : <span className="text-xs font-semibold text-slate-600">{profile.email}</span>}
            </div>
            
            {/* 🔑 PASSWORD RESET (Admin View) */}
            {isEditing && (
              <div className="flex items-center gap-3 col-span-2 bg-red-50 p-2 rounded-lg border border-red-100">
                <Key className="w-4 h-4 text-red-400" />
                <input 
                  type="password" 
                  placeholder="Reset Password (Optional)" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="text-xs font-bold bg-transparent border-b border-red-200 w-full text-red-600 placeholder-red-300 outline-none" 
                  autoComplete="new-password"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION */}
      <div className="flex items-center gap-1 mb-8 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {[{ id: 'OVERVIEW', label: 'Dashboard' }, { id: 'LEAVE', label: 'Leave Requests' }, { id: 'HISTORY', label: 'Work History' }, { id: 'REPORTS', label: 'Sales Reports' }, { id: 'CHAT', label: 'Messages' }, { id: 'MAP', label: 'Live GPS' }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>{tab.label}</button>
        ))}
      </div>

      {/* 📊 OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2 relative">
               <div className="flex items-center justify-between mb-6">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Live Monthly Goals</p>
                 {!isEditingTargets ? (
                   <button onClick={() => setIsEditingTargets(true)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">Adjust Goals</button>
                 ) : (
                   <button onClick={handleSaveTargets} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors">Save Targets</button>
                 )}
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-slate-400">Revenue Goal</span>
                      {isEditingTargets ? <div className="flex items-center border-b border-blue-500"><span className="text-sm font-bold text-slate-400 mr-1">₵</span><input type="number" value={editTargetsInput.rev} onChange={(e) => setEditTargetsInput({...editTargetsInput, rev: e.target.value})} className="w-20 font-bold text-slate-900 outline-none"/></div> : <span className="text-sm font-black text-slate-900">₵ {targets.revenueTarget.toLocaleString()}</span>}
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden"><div className={`h-full rounded-full ${revProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${revProgress}%` }} /></div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold uppercase"><span className="text-slate-500">Current: ₵ {targets.revenueCurrent.toLocaleString()}</span><span className={revProgress >= 100 ? "text-emerald-600" : "text-blue-600"}>{revProgress}%</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-slate-400">Volume Goal (Units)</span>
                      {isEditingTargets ? <div className="flex items-center border-b border-blue-500"><input type="number" value={editTargetsInput.vol} onChange={(e) => setEditTargetsInput({...editTargetsInput, vol: e.target.value})} className="w-16 font-bold text-slate-900 outline-none"/><span className="text-[10px] font-bold text-slate-400 ml-1">Units</span></div> : <span className="text-sm font-black text-slate-900">{targets.volumeTarget} Units</span>}
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden"><div className={`h-full rounded-full ${volProgress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${volProgress}%` }} /></div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold uppercase"><span className="text-slate-500">Sold: {targets.volumeCurrent}</span><span className={volProgress >= 100 ? "text-emerald-600" : "text-indigo-600"}>{volProgress}%</span></div>
                  </div>
               </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm text-white flex flex-col justify-between">
               <div>
                 <div className="flex items-center gap-3 mb-6 opacity-70"><Building2 className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Assigned Location</span></div>
                 <p className="text-lg font-bold mb-1">{currentShop.name}</p>
                 <p className="text-xs opacity-50 mb-1">{currentShop.location}</p>
               </div>
               <div className="pt-4 border-t border-white/10">
                 <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Branch Manager</p>
                 <div className="flex justify-between items-center"><span className="text-sm font-bold">{currentShop.managerName || "Unassigned"}</span></div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌴 LEAVE TAB */}
      {activeTab === 'LEAVE' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-amber-50/50 flex justify-between items-center"><h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Pending Requests</h3></div>
              {leaveRequests.filter(req => req.status === 'PENDING').length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {leaveRequests.filter(req => req.status === 'PENDING').map(req => (
                    <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div><p className="text-sm font-bold text-slate-900">{req.type} • {new Date(req.startDate).toLocaleDateString()}</p><p className="text-xs text-slate-400 mt-2 italic">"{req.reason}"</p></div>
                      <div className="flex gap-3">
                        <button onClick={() => updateLeaveStatus(req.id, 'REJECTED')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-red-100 hover:text-red-700 transition-colors">Reject</button>
                        <button onClick={() => updateLeaveStatus(req.id, 'APPROVED')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors">Approve Request</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="p-8 text-center text-slate-400 text-sm italic">No pending leave requests.</div>}
           </div>
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Leave History</h3></div>
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Leave Type</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Dates</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests.filter(req => req.status !== 'PENDING').map(leave => (
                    <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{leave.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{leave.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* 🕒 HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <table className="w-full text-left">
            <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Clock In</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Clock Out</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceHistory.length > 0 ? attendanceHistory.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{new Date(att.date).toDateString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{att.clockInTime ? new Date(att.clockInTime).toLocaleTimeString() : '--'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString() : '--'}</td>
                  <td className="px-6 py-4 text-right"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">{att.status}</span></td>
                </tr>
              )) : <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No attendance records found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* 📄 REPORTS TAB (COMPREHENSIVE UPDATE) */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* 1. Header & Export */}
          <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-xl shadow-lg">
            <div><h3 className="text-lg font-bold">Comprehensive Performance Report</h3><p className="text-xs text-slate-400 mt-1">Detailed breakdown of sales, attendance, and customer interactions.</p></div>
            <div className="flex gap-4">
               <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg"><Download className="w-4 h-4" /> Export PDF</button>
            </div>
          </div>

          {/* 2. KPI METRICS (CALCULATED FROM HISTORY) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Total Revenue</span><DollarSign className="w-4 h-4 text-emerald-500" /></div>
                <p className="text-2xl font-black text-slate-900">₵ {totalRevenueCalc.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Lifetime Value</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Total Sales</span><ShoppingCart className="w-4 h-4 text-blue-500" /></div>
                <p className="text-2xl font-black text-slate-900">{totalSalesCount}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Completed Transactions</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Customer Walk-Ins</span><Users className="w-4 h-4 text-amber-500" /></div>
                <p className="text-2xl font-black text-slate-900">{totalWalkIns}</p>
                <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Reported Visits</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Avg. Conversion</span><Activity className="w-4 h-4 text-purple-500" /></div>
                <p className="text-2xl font-black text-slate-900">{totalWalkIns > 0 ? Math.round((totalSalesCount / totalWalkIns) * 100) : 0}%</p>
                <p className="text-[10px] text-purple-600 font-bold uppercase mt-1">Sales Efficiency</p>
             </div>
          </div>

          {/* 3. SALES HISTORY TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Sales Ledger</h3></div>
             {salesHistory.length > 0 ? (
               <table className="w-full text-left">
                 <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Transaction ID</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Payment</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {salesHistory.map((sale: any) => (
                     <tr key={sale.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 text-sm font-bold text-slate-700">{new Date(sale.createdAt).toLocaleDateString()}</td>
                       <td className="px-6 py-4 text-xs font-mono text-slate-500 uppercase">#{sale.id.slice(-8)}</td>
                       <td className="px-6 py-4 text-sm font-bold text-emerald-600">₵ {sale.totalAmount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">{sale.paymentMethod}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             ) : <div className="p-8 text-center text-slate-400 text-sm italic">No sales recorded yet.</div>}
          </div>

          {/* 4. DAILY ACTIVITY LOG */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Daily Activity Reports</h3></div>
             {dailyReports.length > 0 ? (
               <table className="w-full text-left">
                 <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Walk-Ins</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Inquiries</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Notes</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {dailyReports.map((report: any) => (
                     <tr key={report.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 text-sm font-bold text-slate-700">{new Date(report.createdAt).toLocaleDateString()}</td>
                       <td className="px-6 py-4 text-sm text-slate-600">{report.walkIns}</td>
                       <td className="px-6 py-4 text-sm text-slate-600">{report.inquiries}</td>
                       <td className="px-6 py-4 text-right text-xs text-slate-400 italic max-w-xs truncate">{report.marketIntel || "No notes"}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             ) : <div className="p-8 text-center text-slate-400 text-sm italic">No daily reports filed.</div>}
          </div>

        </div>
      )}

      {/* 💬 CHAT TAB */}
      {activeTab === 'CHAT' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[600px] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${gpsData.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div><span className="text-xs font-bold text-slate-600 uppercase">Status: {gpsData.status}</span></div>
             <Lock className="w-4 h-4 text-slate-300" />
          </div>
          
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
            {messages.length === 0 ? <div className="text-center text-slate-400 text-xs mt-10 italic">No conversation history.</div> : messages.map((msg: any) => {
              const isIncoming = msg.senderId === staffId;
              const isOutgoing = !isIncoming;
              return (
                <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} group items-end gap-2`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm relative ${isOutgoing ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                    {editingMsgId === msg.id ? (
                      <div className="flex gap-2 min-w-[200px]">
                        <input value={editMsgContent} onChange={(e) => setEditMsgContent(e.target.value)} className="bg-white/20 text-white rounded px-2 py-1 outline-none w-full text-xs" autoFocus />
                        <button onClick={() => handleEditMessage(msg.id)} className="bg-white text-blue-600 p-1 rounded font-bold text-[10px]">OK</button>
                        <button onClick={() => setEditingMsgId(null)} className="text-white/70 p-1 text-[10px]">X</button>
                      </div>
                    ) : <p className="mb-1">{msg.content}</p>}
                    <p className={`text-[9px] font-medium text-right mt-1 ${isOutgoing ? 'text-blue-200' : 'text-slate-400'}`}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  {isOutgoing && !editingMsgId && (
                    <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-opacity">
                       <button onClick={() => { setEditingMsgId(msg.id); setEditMsgContent(msg.content); }} className="p-1 bg-slate-200 rounded-full text-slate-600 hover:bg-blue-100 hover:text-blue-600" title="Edit"><Edit2 className="w-3 h-3" /></button>
                       <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 bg-slate-200 rounded-full text-slate-600 hover:bg-red-100 hover:text-red-600" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-4">
            <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type message to staff..." className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
            <button type="submit" disabled={isSending} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50">
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}

      {/* 📍 LIVE MAP */}
      {activeTab === 'MAP' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[600px] flex animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
          <div className="flex-1 relative z-0">
             <LiveMap 
                shops={shops} 
                reps={gpsData.isLive ? [{
                   id: staffId,
                   name: profile.name,
                   latitude: gpsData.lat,
                   longitude: gpsData.lng,
                   assignedShopId: profile.assignedShopId
                }] : []} 
             />
          </div>
          
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-lg w-64">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Device Status</h4>
             <div className="space-y-3">
               <div className="flex justify-between text-sm"><span className="text-slate-600">State</span><span className={`font-bold ${gpsData.isLive ? 'text-emerald-600' : 'text-red-600'}`}>{gpsData.status}</span></div>
               <div className="flex justify-between text-sm"><span className="text-slate-600">Last Sync</span><span className="font-bold text-slate-900">{gpsData.lastSync}</span></div>
               <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-600 text-[10px] uppercase font-bold">Signal</span>
                  {gpsData.isLive ? <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase"><Wifi className="w-3 h-3"/> Online</span> : <span className="flex items-center gap-1 text-red-600 text-[10px] font-bold uppercase"><WifiOff className="w-3 h-3"/> Offline</span>}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}