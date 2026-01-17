"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, MapPin, Phone, Mail, 
  Clock, Activity, Send, Lock, FileText, CheckCircle, 
  AlertTriangle, Calendar, Download, 
  Edit2, TrendingUp, Building2, Smartphone, 
  Percent, ChevronRight, Save, Wifi, WifiOff,
  Trash2, Loader2, UserX, PhoneIncoming, PhoneOff, Key
} from "lucide-react";

// 🗺️ MAP ENGINE
const LiveMap = dynamic(() => import("@/components/LiveMap"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest">
      <div className="flex items-center gap-2">
         <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
         Connecting to Satellite...
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  
  // Chat State
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);

  const [reportFilter, setReportFilter] = useState("Weekly");

  // --- 2. DATA CONTAINERS ---
  const [profile, setProfile] = useState<any>(null); 
  const [shops, setShops] = useState<any[]>([]); 
  
  // ✅ NEW: Password Reset State
  const [newPassword, setNewPassword] = useState("");

  // --- 3. FETCH REAL DATA ---
  useEffect(() => {
    const fetchData = async () => {
      if (!staffId) return;
      setIsLoading(true);
      try {
        // A. Fetch User Details
        const userRes = await fetch(`/api/hr/staff/${staffId}?t=${Date.now()}`);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setProfile({
            ...userData,
            role: userData.role || "SALES_REP",
            assignedShopId: userData.shopId || "", 
            status: userData.status || 'Active',
            phone: userData.phone || "",
            email: userData.email || ""
          });
        } else {
          alert("User not found in directory.");
          router.push("/dashboard/hr/enrollment");
          return;
        }

        // B. Fetch Shop List
        const shopRes = await fetch("/api/shops");
        if (shopRes.ok) setShops(await shopRes.json());

      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [staffId, router]);

  // --- 4. CHAT POLLING ---
  useEffect(() => {
    if (activeTab === 'CHAT' && staffId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, staffId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?staffId=${staffId}`);
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error("Failed to load messages");
    }
  };

  // --- 5. ACTION HANDLERS ---

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently remove this staff member? This cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/hr/staff/${staffId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Staff member deleted successfully.");
        router.push("/dashboard/hr/enrollment"); 
      } else {
        alert("Failed to delete record.");
      }
    } catch (e) {
      alert("Network connection error.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const shopIdPayload = profile.assignedShopId === "" ? null : profile.assignedShopId;

      // Prepare Payload (Including password ONLY if typed)
      const payload: any = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: profile.status,
        assignedShopId: shopIdPayload 
      };

      if (newPassword.trim() !== "") {
        payload.password = newPassword;
      }

      const res = await fetch(`/api/hr/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsEditing(false);
        setNewPassword(""); // Clear password field for security
        alert("Profile updated successfully!");
      } else {
        const err = await res.json();
        alert(`Update Failed: ${err.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Network Error: Could not reach server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    setIsSending(true);
    try {
      const tempMsg = { id: Date.now(), content: chatMessage, senderId: "admin-hq-id", createdAt: new Date() };
      setMessages(prev => [...prev, tempMsg]);
      setChatMessage("");

      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: tempMsg.content,
          receiverId: staffId,
          senderId: "admin-hq-id" 
        })
      });
      
      fetchMessages();
    } catch (err) {
      alert("Message failed to send");
    } finally {
      setIsSending(false);
    }
  };

  const toggleCallAbility = () => {
    setIsCallActive(!isCallActive);
  };

  // --- 6. MOCK DATA & SETTINGS ---
  const [adminSettings, setAdminSettings] = useState({
    commissionRate: 5.0, 
    shiftType: "Full Day (08:00 - 17:00)",
    deviceId: "IOS-GH-2291", 
    contractType: "Full-Time"
  });

  const [targets, setTargets] = useState({
    revenueTarget: 20000,
    revenueCurrent: profile?.totalRevenue || 0,
    volumeTarget: 50,
    volumeCurrent: profile?._count?.sales || 0
  });

  const [editTargetsInput, setEditTargetsInput] = useState({
    rev: "20000",
    vol: "50"
  });

  const saveTargets = () => {
    setTargets(prev => ({
      ...prev,
      revenueTarget: parseInt(editTargetsInput.rev),
      volumeTarget: parseInt(editTargetsInput.vol)
    }));
    setIsEditingTargets(false);
  };

  // Leave Logic
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, type: "Sick Leave", dates: "Feb 2 - Feb 4", days: 3, status: "Pending", reason: "Malaria treatment" },
    { id: 2, type: "Casual Leave", dates: "Feb 10", days: 1, status: "Pending", reason: "Personal family matter" },
  ]);
  const [leaveHistory, setLeaveHistory] = useState([
    { id: 101, type: "Annual Leave", dates: "Dec 20 - Dec 28", days: 8, status: "Approved", reason: "Yearly Break" },
  ]);

  const handleApproveLeave = (id: number) => {
    const request = leaveRequests.find(r => r.id === id);
    if (!request) return;
    setLeaveHistory(prev => [{ ...request, status: "Approved" }, ...prev]);
    setLeaveRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleRejectLeave = (id: number) => {
    const request = leaveRequests.find(r => r.id === id);
    if (!request) return;
    setLeaveHistory(prev => [{ ...request, status: "Rejected" }, ...prev]);
    setLeaveRequests(prev => prev.filter(r => r.id !== id));
  };

  const dailyMetrics = { walkIns: 142, inquiries: 45, purchases: 18, turnover: 12450.00 };
  const [gpsData, setGpsData] = useState({ lat: 5.6226, lng: -0.1736, speed: 0, battery: 87, status: "Stationary", connection: "Online" });

  useEffect(() => {
    if (activeTab === 'MAP') {
      const interval = setInterval(() => {
        const isOnline = Math.random() > 0.1; 
        if (isOnline) {
          setGpsData(prev => ({
            ...prev,
            lat: prev.lat + (Math.random() * 0.0002 - 0.0001),
            lng: prev.lng + (Math.random() * 0.0002 - 0.0001),
            speed: Math.floor(Math.random() * 5),
            battery: Math.max(10, prev.battery - 0.05),
            status: Math.random() > 0.5 ? "In Transit" : "Stationary",
            connection: "Online"
          }));
        } else {
           setGpsData(prev => ({ ...prev, connection: "Offline", status: "Signal Lost" }));
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // --- RENDER LOADING STATE ---
  if (isLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest">Retrieving Personnel File...</p>
      </div>
    );
  }

  // Helper for Current Shop Info
  const currentShop = shops.find(s => s.id === profile.assignedShopId) || { name: "Unassigned", location: "N/A", managerName: "N/A", managerPhone: "", openingTime: "N/A" };
  const revProgress = Math.min(100, Math.round((targets.revenueCurrent / targets.revenueTarget) * 100));
  const volProgress = Math.min(100, Math.round((targets.volumeCurrent / targets.volumeTarget) * 100));

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900 animate-in fade-in duration-500">
      
      {/* 🔙 TOP NAVIGATION */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard/hr/enrollment" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Team Directory
        </Link>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={toggleCallAbility}
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
                 <button 
                   onClick={handleSaveProfile} 
                   disabled={isSaving}
                   className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50"
                 >
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                   Save Profile
                 </button>
               </>
             ) : (
               <>
                 <button 
                   onClick={handleDelete} 
                   disabled={isDeleting}
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 disabled:opacity-50 transition-all"
                 >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                 </button>

                 <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Settings
                 </button>
               </>
             )}
           </div>
        </div>
      </div>

      {/* 👤 PROFILE HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden transition-all">
        {/* Avatar */}
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl shrink-0">
          {profile.name.charAt(0)}
        </div>
        
        <div className="flex-1 w-full">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              {isEditing ? (
                <input 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent w-full md:w-auto"
                />
              ) : (
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  {profile.name}
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    profile.status === 'Active' || profile.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                    profile.status === 'On Leave' || profile.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {profile.status}
                  </span>
                </h1>
              )}
              
              <div className="flex items-center gap-2 mt-1">
                 {isEditing ? (
                   <select 
                      value={profile.assignedShopId}
                      onChange={(e) => setProfile({...profile, assignedShopId: e.target.value})}
                      className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none"
                   >
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

            {/* Status Toggle (Edit Mode Only) */}
            {isEditing && (
              <div className="flex gap-2">
                 {['ACTIVE', 'ON_LEAVE', 'SUSPENDED'].map(s => (
                   <button 
                     key={s}
                     onClick={() => setProfile({...profile, status: s})}
                     className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                       profile.status === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'
                     }`}
                   >
                     {s.replace('_', ' ')}
                   </button>
                 ))}
              </div>
            )}
          </div>
          
          {/* Contact Details & Password Reset */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              {isEditing ? (
                <input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="text-xs font-semibold bg-slate-50 border-b border-slate-300 w-full" />
              ) : (
                <span className="text-xs font-semibold text-slate-600">{profile.phone || "No Phone"}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              {isEditing ? (
                <input value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="text-xs font-semibold bg-slate-50 border-b border-slate-300 w-full" />
              ) : (
                <span className="text-xs font-semibold text-slate-600">{profile.email}</span>
              )}
            </div>
            
            {/* ✅ NEW: Password Reset Field (Only visible in Edit Mode) */}
            {isEditing && (
              <div className="flex items-center gap-3 col-span-2 bg-red-50 p-2 rounded-lg border border-red-100">
                <Key className="w-4 h-4 text-red-400" />
                <input 
                  type="password"
                  placeholder="Reset Password (Optional)" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs font-bold bg-transparent border-b border-red-200 w-full text-red-600 placeholder-red-300 outline-none" 
                />
              </div>
            )}

            {!isEditing && (
              <>
                <div className="flex items-center gap-3">
                  <Percent className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-600">{adminSettings.commissionRate}% Commission</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600 truncate">Device: {adminSettings.deviceId}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS */}
      <div className="flex items-center gap-1 mb-8 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {[
          { id: 'OVERVIEW', label: 'Dashboard' },
          { id: 'LEAVE', label: 'Leave Requests' },
          { id: 'HISTORY', label: 'Work History' },
          { id: 'REPORTS', label: 'Sales Reports' },
          { id: 'CHAT', label: 'Messages' },
          { id: 'MAP', label: 'Live GPS' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT AREA --- */}

      {/* 📊 OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 1. TARGET SYSTEM */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2 relative">
               <div className="flex items-center justify-between mb-6">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                   <TrendingUp className="w-4 h-4" /> Monthly Goals
                 </p>
                 {!isEditingTargets ? (
                   <button onClick={() => setIsEditingTargets(true)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">
                     Adjust Goals
                   </button>
                 ) : (
                   <button onClick={saveTargets} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                     Save Targets
                   </button>
                 )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Revenue Target */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-slate-400">Revenue Goal</span>
                      {isEditingTargets ? (
                        <div className="flex items-center border-b border-blue-500">
                           <span className="text-sm font-bold text-slate-400 mr-1">₵</span>
                           <input 
                             type="number" 
                             value={editTargetsInput.rev} 
                             onChange={(e) => setEditTargetsInput({...editTargetsInput, rev: e.target.value})}
                             className="w-20 font-bold text-slate-900 outline-none"
                           />
                        </div>
                      ) : (
                        <span className="text-sm font-black text-slate-900">₵ {targets.revenueTarget.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                       <div className={`h-full rounded-full ${revProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${revProgress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold uppercase">
                       <span className="text-slate-500">Current: ₵ {targets.revenueCurrent.toLocaleString()}</span>
                       <span className={revProgress >= 100 ? "text-emerald-600" : "text-blue-600"}>{revProgress}%</span>
                    </div>
                  </div>

                  {/* Volume Target */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-slate-400">Volume Goal (Units)</span>
                      {isEditingTargets ? (
                        <div className="flex items-center border-b border-blue-500">
                           <input 
                             type="number" 
                             value={editTargetsInput.vol} 
                             onChange={(e) => setEditTargetsInput({...editTargetsInput, vol: e.target.value})}
                             className="w-16 font-bold text-slate-900 outline-none"
                           />
                           <span className="text-[10px] font-bold text-slate-400 ml-1">Units</span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-slate-900">{targets.volumeTarget} Units</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                       <div className={`h-full rounded-full ${volProgress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${volProgress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold uppercase">
                       <span className="text-slate-500">Sold: {targets.volumeCurrent}</span>
                       <span className={volProgress >= 100 ? "text-emerald-600" : "text-indigo-600"}>{volProgress}%</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* 2. ASSIGNED SHOP INFO */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm text-white flex flex-col justify-between">
               <div>
                 <div className="flex items-center gap-3 mb-6 opacity-70">
                   <Building2 className="w-4 h-4" />
                   <span className="text-xs font-bold uppercase tracking-wider">Assigned Location</span>
                 </div>
                 <p className="text-lg font-bold mb-1">{currentShop.name}</p>
                 <p className="text-xs opacity-50 mb-1">{currentShop.location}</p>
                 <p className="text-xs text-emerald-400 font-mono mb-4">Open: {currentShop.openingTime || "08:00 AM - 05:00 PM"}</p>
               </div>
               
               <div className="pt-4 border-t border-white/10">
                 <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Branch Manager</p>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">{currentShop.managerName || "Unassigned"}</span>
                    {currentShop.managerPhone && (
                      <a href={`tel:${currentShop.managerPhone}`} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                         <Phone className="w-3 h-3" />
                      </a>
                    )}
                 </div>
               </div>
            </div>
          </div>

          {/* 3. DAILY METRICS */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-6">
             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-6 flex items-center gap-2">
               <Activity className="w-4 h-4 text-blue-600" /> Daily Interaction Funnel
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <p className="text-3xl font-black text-slate-900">{dailyMetrics.walkIns}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Walk-In Customers</p>
               </div>
               <div className="hidden md:block self-center"><ChevronRight className="w-6 h-6 text-slate-300 mx-auto" /></div>
               <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                 <p className="text-3xl font-black text-blue-600">{dailyMetrics.inquiries}</p>
                 <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-2">Product Inquiries</p>
               </div>
               <div className="hidden md:block self-center"><ChevronRight className="w-6 h-6 text-slate-300 mx-auto" /></div>
               <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                 <p className="text-3xl font-black text-emerald-600">{dailyMetrics.purchases}</p>
                 <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">Closed Sales</p>
               </div>
             </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Shift Schedule</p>
                <p className="text-sm font-black text-slate-900">{adminSettings.shiftType}</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">On-Site Hours</p>
                <p className="text-2xl font-bold text-emerald-600">8h 15m</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Daily Turnover</p>
                <p className="text-2xl font-bold text-slate-900">₵ {dailyMetrics.turnover.toLocaleString()}</p>
             </div>
          </div>
        </div>
      )}

      {/* 🌴 LEAVE MANAGEMENT */}
      {activeTab === 'LEAVE' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
           {/* Pending Requests */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-amber-50/50 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4" /> Pending Requests
                 </h3>
              </div>
              {leaveRequests.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {leaveRequests.map(req => (
                    <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{req.type} • {req.days} Days</p>
                        <p className="text-xs text-slate-500 mt-1">{req.dates}</p>
                        <p className="text-xs text-slate-400 mt-2 italic">"{req.reason}"</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleRejectLeave(req.id)}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-red-100 hover:text-red-700 transition-colors"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApproveLeave(req.id)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                        >
                          Approve Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm italic">No pending leave requests.</div>
              )}
           </div>

           {/* Leave History */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Leave History</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Leave Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Duration</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Dates</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveHistory.map(leave => (
                    <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{leave.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{leave.days} Days</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{leave.dates}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                           leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* 🕒 WORK HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Shift Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">On-Site</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total Sales</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1,2,3].map((_, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">Jan {14-i}, 2026</td>
                  <td className="px-6 py-4 text-sm text-slate-600">08:00 AM - 05:00 PM</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">8h 15m</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">₵ 2,400</td>
                  <td className="px-6 py-4 text-right"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">Present</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 📄 REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-xl shadow-lg">
            <div>
              <h3 className="text-lg font-bold">Generate Report</h3>
              <p className="text-xs text-slate-400 mt-1">Download detailed breakdown of sales and metrics.</p>
            </div>
            <div className="flex gap-4">
               <select 
                 value={reportFilter} 
                 onChange={(e) => setReportFilter(e.target.value)}
                 className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-4 py-2 outline-none"
               >
                 <option>Daily</option>
                 <option>Weekly</option>
                 <option>Monthly</option>
               </select>
               <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg">
                 <Download className="w-4 h-4" /> Export
               </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1, 2, 3].map((item) => (
               <div key={item} className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer shadow-sm">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-blue-600"><FileText className="w-5 h-5" /></div>
                   <div><p className="text-sm font-bold text-slate-900">Weekly Summary</p><p className="text-xs text-slate-500">Jan {10 + item}, 2026</p></div>
                 </div>
                 <Download className="w-4 h-4 text-slate-300" />
               </div>
             ))}
          </div>
        </div>
      )}

      {/* 💬 CHAT */}
      {activeTab === 'CHAT' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[600px] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${gpsData.connection === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-xs font-bold text-slate-600 uppercase">Status: {gpsData.connection}</span>
             </div>
             <Lock className="w-4 h-4 text-slate-300" />
          </div>
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 text-xs mt-10 italic">No messages yet. Start the conversation.</div>
            ) : (
              messages.map((msg: any) => {
                const isAdmin = msg.senderId === "admin-hq-id";
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${
                      isAdmin ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    }`}>
                      <p className="mb-1">{msg.content}</p>
                      <p className={`text-[9px] font-medium text-right ${isAdmin ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-4">
            <input 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type message..." 
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
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
             <LiveMap lat={gpsData.lat} lng={gpsData.lng} speed={gpsData.speed} />
          </div>
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-lg w-64">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Device Status</h4>
             <div className="space-y-3">
               <div className="flex justify-between text-sm"><span className="text-slate-600">State</span><span className="font-bold text-slate-900">{gpsData.status}</span></div>
               <div className="flex justify-between text-sm"><span className="text-slate-600">Speed</span><span className="font-bold text-slate-900">{gpsData.speed} km/h</span></div>
               <div className="flex justify-between text-sm"><span className="text-slate-600">Battery</span><span className="font-bold text-slate-900">{Math.floor(gpsData.battery)}%</span></div>
               <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-600 text-[10px] uppercase font-bold">Signal</span>
                  {gpsData.connection === 'Online' 
                    ? <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase"><Wifi className="w-3 h-3"/> Online</span>
                    : <span className="flex items-center gap-1 text-red-600 text-[10px] font-bold uppercase"><WifiOff className="w-3 h-3"/> Offline</span>
                  }
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}