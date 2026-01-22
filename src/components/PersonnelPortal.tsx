"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - PERSONNEL HUB (v25.0 - DEADLINE STABLE)
 * --------------------------------------------------------------------------
 * FIXED: 
 * 1. Infinite Reload Loop -> Solved using `setTimeout` recursion logic.
 * 2. Message Failure -> Fixed by API ID resolution (Step 1).
 * 3. Side Jumping -> Fixed by fetching viewer identity on mount.
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect, use, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, Phone, Mail, Activity, Send, Lock, FileText, 
  AlertTriangle, Clock, Bell, MapPin, CheckCircle, History, 
  UserCheck, Smartphone, BarChart3, MessageCircle, RefreshCcw, 
  CheckCheck, MessageSquare, Key, ShieldAlert, Loader2
} from "lucide-react";

// Dynamic Import for Map
const LiveMap = dynamic(() => import("@/components/LiveMap"), { 
  ssr: false, 
  loading: () => <div className="h-full bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
});

type Params = Promise<{ id: string }>;

export default function PersonnelPortal({ params }: { params: Params }) {
  const resolvedParams = use(params);
  const staffId = resolvedParams.id; 
  
  // --- STABLE REFS (These do not trigger re-renders) ---
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'LIVE_OPS' | 'ANALYTICS' | 'TRIAGE' | 'HISTORY'>('LIVE_OPS');
  const [isLoading, setIsLoading] = useState(true);
  const [viewerId, setViewerId] = useState<string | null>(null); // MY ID (Admin)

  // Data Containers
  const [profile, setProfile] = useState<any>(null); 
  const [shops, setShops] = useState<any[]>([]); 
  const [messages, setMessages] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]); 
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  
  // UI Inputs
  const [chatMessage, setChatMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // --- 1. BOOTSTRAP (RUNS ONCE) ---
  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      try {
        // 1. Who am I? (Crucial for Chat Sides)
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user?.id) setViewerId(sessionData.user.id);

        // 2. Fetch Base Data
        const [u, s, m, r, l, a] = await Promise.all([
          fetch(`/api/hr/staff/${staffId}`).then(res => res.json()),
          fetch("/api/shops").then(res => res.json()),
          fetch(`/api/messages?staffId=${staffId}`).then(res => res.json()),
          fetch(`/api/daily-reports?userId=${staffId}`).then(res => res.json()),
          fetch(`/api/leaves?userId=${staffId}`).then(res => res.json()),
          fetch(`/api/attendance?userId=${staffId}`).then(res => res.json())
        ]);

        setProfile(u);
        setShops(Array.isArray(s) ? s : []);
        setMessages(Array.isArray(m) ? m : []);
        setDailyReports(Array.isArray(r) ? r : []);
        setLeaveRequests(Array.isArray(l) ? l : []);
        setAttendanceHistory(Array.isArray(a) ? a : []);

        // Scroll to bottom
        setTimeout(() => chatScrollRef.current?.scrollTo({ top: 99999, behavior: 'auto' }), 500);

      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    init();
    return () => { isMounted.current = false; };
  }, [staffId]);

  // --- 2. THE SILENT SYNC ENGINE (NO RELOADS) ---
  useEffect(() => {
    const poll = async () => {
      if (!isMounted.current) return;
      try {
        // Only fetch messages if we are looking at them
        if (activeTab === 'LIVE_OPS') {
          const res = await fetch(`/api/messages?staffId=${staffId}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
               // Only update if count changes to prevent flicker
               setMessages(prev => (prev.length !== data.length ? data : prev));
            }
          }
        }
      } catch (e) { 
        // Silent fail
      } finally {
        if (isMounted.current) setTimeout(poll, 3000); // Recursive 3s Timer
      }
    };
    
    // Start the engine after 1s
    const timer = setTimeout(poll, 1000);
    return () => clearTimeout(timer);
  }, [staffId, activeTab]); // Dependencies are STABLE now

  // --- 3. SEND MESSAGE HANDLER ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isSending) return;

    const tempId = Date.now();
    const txt = chatMessage;
    
    // Optimistic Update
    setChatMessage("");
    setIsSending(true);
    setMessages(prev => [...prev, { 
      id: tempId, 
      content: txt, 
      senderId: viewerId || "ME", // Use real ID immediately
      createdAt: new Date().toISOString() 
    }]);

    // Scroll
    setTimeout(() => chatScrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 10);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: txt, receiverId: staffId })
      });
    } catch (err) {
      alert("Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  // --- RENDER ---
  if (isLoading || !profile) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link href="/dashboard/hr/enrollment" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500" /></Link>
            <div>
               <h1 className="text-sm font-black uppercase">{profile.name}</h1>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.role}</span>
            </div>
         </div>
         {/* TABS */}
         <div className="flex bg-slate-100 p-1 rounded-lg">
            {['LIVE_OPS', 'ANALYTICS', 'HISTORY'].map((t) => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t as any)}
                 className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === t ? 'bg-white shadow-sm text-blue-700' : 'text-slate-400'}`}
               >
                 {t.replace('_', ' ')}
               </button>
            ))}
         </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-6">
        
        {/* LIVE OPS (MAP + CHAT) */}
        {activeTab === 'LIVE_OPS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
             
             {/* MAP (2/3) */}
             <div className="lg:col-span-2 bg-slate-200 rounded-3xl overflow-hidden relative shadow-sm border border-slate-300">
                <LiveMap reps={[{ ...profile, id: staffId }]} shops={shops} />
             </div>

             {/* CHAT (1/3) */}
             <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-600" /> Secure Link
                   </span>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                   {messages.map((m: any) => {
                      // TRIPLE GUARD CHECK
                      const isMe = m.senderId === viewerId || m.senderId === 'ME' || m.senderId === 'admin';
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[12px] font-medium shadow-sm ${
                              isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                           }`}>
                              {m.content}
                           </div>
                        </div>
                      );
                   })}
                </div>

                <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex gap-2">
                   <input 
                     value={chatMessage}
                     onChange={e => setChatMessage(e.target.value)}
                     className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all"
                     placeholder="Type command..."
                   />
                   <button disabled={isSending} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all">
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'ANALYTICS' && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Reports</p>
                 <p className="text-3xl font-black text-slate-900 mt-2">{dailyReports.length}</p>
              </div>
           </div>
        )}

      </div>
    </div>
  );
}