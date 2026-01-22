"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Activity, Shield, TrendingUp, Download } from "lucide-react";

// --- IMPORT MODULES ---
import ProfileCard from "@/components/hr/personnel/ProfileCard";
import ChatConsole from "@/components/hr/personnel/ChatConsole";
import ComplianceBoard from "@/components/hr/personnel/ComplianceBoard";
import PerformanceBoard from "@/components/hr/personnel/PerformanceBoard"; 

type Params = Promise<{ id: string }>;

export default function PersonnelPortal({ params }: { params: Params }) {
  const resolvedParams = use(params);
  const staffId = resolvedParams.id;
  const isMounted = useRef(true);
  
  const [activeTab, setActiveTab] = useState<'OPS' | 'PERFORMANCE' | 'COMPLIANCE'>('OPS');
  
  // DATA STATE
  const [profile, setProfile] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]); // 👈 NEW
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isMounted.current = true;
    const bootSystem = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user?.id) setViewerId(sessionData.user.id);

        const [u, s, m, a, l, sales, reports] = await Promise.all([
          fetch(`/api/hr/staff/${staffId}`).then(r => r.json()),
          fetch("/api/shops").then(r => r.json()),
          fetch(`/api/messages?staffId=${staffId}`).then(r => r.json()),
          fetch(`/api/attendance?userId=${staffId}`).then(r => r.json()),
          fetch(`/api/leaves?userId=${staffId}`).then(r => r.json()),
          fetch(`/api/sales?userId=${staffId}`).then(r => r.json()),
          fetch(`/api/daily-reports?userId=${staffId}`).then(r => r.json()) // 👈 FETCH REPORTS
        ]);

        if (isMounted.current) {
          setProfile(u);
          setShops(Array.isArray(s) ? s : []);
          setMessages(Array.isArray(m) ? m : []);
          setAttendance(Array.isArray(a) ? a : []);
          setLeaves(Array.isArray(l) ? l : []);
          setSalesHistory(sales.sales && Array.isArray(sales.sales) ? sales.sales : []);
          setDailyReports(Array.isArray(reports) ? reports : []); // 👈 SET REPORTS
          setLoading(false);
        }
      } catch (e) { console.error("Boot Error", e); }
    };

    bootSystem();
    return () => { isMounted.current = false; };
  }, [staffId]);

  // --- ACTIONS ---
  
  const handleExportData = () => {
    // Basic CSV Generation
    const headers = "Date,Type,Details,Amount\n";
    const salesRows = salesHistory.map(s => `${new Date(s.createdAt).toLocaleDateString()},SALE,"Ref: ${s.id}",${s.totalAmount}`).join("\n");
    const leaveRows = leaves.map(l => `${new Date(l.createdAt).toLocaleDateString()},LEAVE,"${l.type} - ${l.status}",-`).join("\n");
    const reportRows = dailyReports.map(r => `${new Date(r.createdAt).toLocaleDateString()},REPORT,"Walkins: ${r.walkIns}",-`).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + salesRows + "\n" + leaveRows + "\n" + reportRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${profile.name}_dossier.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleUpdateTargets = async (targets: any) => {
    // In a real app, this would hit an API endpoint
    // For now, we simulate an optimistic update to the profile
    const updatedProfile = { ...profile, ...targets };
    setProfile(updatedProfile);
    
    // API Call to save targets would go here
    // await fetch(`/api/hr/staff/${staffId}/targets`, ...);
    
    alert("Performance Targets Updated");
  };

  const handleLeaveRecall = async (leaveId: string) => {
    if(!confirm("Are you sure you want to recall this staff member early? System access will be restored.")) return;
    
    // Update to 'CANCELLED' or specific status
    await fetch(`/api/leaves/${leaveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'RECALLED' })
    });
    
    setLeaves(prev => prev.map(r => r.id === leaveId ? {...r, status: 'RECALLED'} : r));
    alert("Leave Recalled. Access Restored.");
  };

  // ... (Other handlers: handleSendMessage, handleProfileUpdate, etc. same as before) ...
  const handleSendMessage = async (content: string) => {
    /* ... same as before ... */
    const tempMsg = { id: Date.now(), content, senderId: viewerId, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, receiverId: staffId }) });
    } catch (e) { console.error("Send Error"); }
  };
  const handleProfileUpdate = async (updatedData: any) => {
    /* ... same as before ... */
    try {
        await fetch(`/api/hr/staff/${staffId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedData) });
        setProfile(updatedData);
        alert("Profile Updated");
    } catch (e) { alert("Update Failed"); }
  };
  const handlePasswordReset = async (newPassword: string) => {
    /* ... same as before ... */
    try {
        await fetch(`/api/hr/staff/${staffId}/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword }) });
        alert("Password Reset Successfully");
    } catch (e) { alert("Reset Failed"); }
  };
  const handleLeaveUpdate = async (reqId: string, status: string) => {
    /* ... same as before ... */
    await fetch(`/api/leaves/${reqId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setLeaves(prev => prev.map(r => r.id === reqId ? {...r, status} : r));
  };
  const refreshMessages = async () => {
    /* ... same as before ... */
    const m = await fetch(`/api/messages?staffId=${staffId}`).then(r => r.json());
    if (Array.isArray(m)) setMessages(m);
  };

  if (loading || !profile) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Personnel Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pb-20">
       
       {/* NAVIGATION HEADER */}
       <div className="max-w-[1800px] mx-auto mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link href="/dashboard/hr/enrollment" className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5" />
             </Link>
             <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{profile.name}</h1>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <span>ID: {staffId.slice(-4).toUpperCase()}</span>
                   <span className="text-slate-300">•</span>
                   <span>{profile.role.replace('_', ' ')}</span>
                </div>
             </div>
          </div>

          <div className="flex gap-4">
            {/* EXPORT BUTTON */}
            <button 
                onClick={handleExportData}
                className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center gap-2"
            >
                <Download className="w-4 h-4" /> Export Dossier
            </button>

            {/* MAIN TABS */}
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={() => setActiveTab('OPS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'OPS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <Activity className="w-4 h-4" /> Live Ops
                </button>
                <button onClick={() => setActiveTab('PERFORMANCE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PERFORMANCE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <TrendingUp className="w-4 h-4" /> Performance
                </button>
                <button onClick={() => setActiveTab('COMPLIANCE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'COMPLIANCE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <Shield className="w-4 h-4" /> Compliance
                </button>
            </div>
          </div>
       </div>

       <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: PROFILE SIDEBAR */}
          <aside className="lg:col-span-3">
             <ProfileCard 
                profile={profile} 
                shops={shops} 
                onSave={handleProfileUpdate} 
                onPasswordReset={handlePasswordReset}
                loading={loading}
             />
          </aside>

          {/* RIGHT: DYNAMIC WORKSPACE */}
          <main className="lg:col-span-9 space-y-8">
             {activeTab === 'OPS' && (
                <ChatConsole 
                   messages={messages} 
                   onSendMessage={handleSendMessage} 
                   onRefresh={refreshMessages}
                   viewerId={viewerId}
                   loading={loading}
                />
             )}
             
             {activeTab === 'PERFORMANCE' && (
                <PerformanceBoard 
                    sales={salesHistory} 
                    dailyReports={dailyReports}
                    targets={{ revenue: profile.monthlyRevenue || 0, volume: profile.monthlyVolume || 0 }} 
                    onSaveTargets={handleUpdateTargets}
                />
             )}

             {activeTab === 'COMPLIANCE' && (
                <ComplianceBoard 
                   attendance={attendance} 
                   leaveRequests={leaves} 
                   onUpdateLeave={handleLeaveUpdate}
                   onRecallLeave={handleLeaveRecall}
                />
             )}
          </main>
       </div>
    </div>
  );
}