"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Loader2, Send, CheckCircle2, 
  Calendar, LogOut, User, Shield, ChevronRight,
  Moon, Sun, Palette, BarChart2, Store
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMobileTheme } from "@/context/MobileThemeContext"; 

const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#3b82f6",
    purple: "#a855f7",
    rose: "#f43f5e",
    amber: "#f59e0b"
  };
  return colors[color] || colors.blue;
};

export default function MobileSettings() {
  const { data: session } = useSession();
  const router = useRouter();
  const { darkMode, toggleDarkMode, accent, setAccent, themeClasses } = useMobileTheme();
  
  const [activeModal, setActiveModal] = useState<'NONE' | 'LEAVE' | 'REPORT'>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // DATA STATES - Aligned with Backend naming
  const [leaveData, setLeaveData] = useState({ startDate: "", endDate: "", reason: "" });
  const [reportData, setReportData] = useState({ walkIns: "", conversions: "", marketIntel: "", notes: "" });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/mobile/init").then(r => r.json()).then(setProfile);
  }, []);

  // --- HANDLERS ---

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "Annual Leave",
          startDate: leaveData.startDate,
          endDate: leaveData.endDate,
          reason: leaveData.reason 
        })
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => { setActiveModal('NONE'); setSubmitted(false); }, 2000);
      } else {
        alert("Submission Failed. Check required fields.");
      }
    } catch (err) { alert("Network Error."); } 
    finally { setIsSubmitting(false); }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Logic Match: Aligning frontend keys with your route's destructuring
      const res = await fetch("/api/operations/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walkIns: reportData.walkIns,
          conversions: reportData.conversions, // Maps to 'conv' on backend
          marketIntel: reportData.marketIntel,
          notes: reportData.notes
        })
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => { setActiveModal('NONE'); setSubmitted(false); }, 2000);
      } else {
        alert("Report Failed to Sync.");
      }
    } catch (err) { alert("Network Error"); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className={`min-h-screen font-sans pb-32 transition-colors duration-500 ${themeClasses.bg}`}>
      
      {/* HEADER */}
      <div className={`px-6 py-6 border-b sticky top-0 z-20 shadow-sm flex items-center gap-4 ${themeClasses.nav} ${themeClasses.border}`}>
        <button onClick={() => router.back()} className={`p-2 rounded-full ${darkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>Terminal Vibe</h1>
      </div>

      <div className="p-6 space-y-6">

        {/* 👤 PROFILE CARD */}
        <div className={`rounded-[2.5rem] p-8 text-center border shadow-xl relative overflow-hidden ${themeClasses.card} ${themeClasses.border}`}>
          <div className="relative z-10">
            <div className={`w-20 h-20 rounded-[2rem] mx-auto mb-4 overflow-hidden border-4 ${darkMode ? "border-slate-700" : "border-white"}`}>
               {profile?.image ? (
                 <img src={profile.image} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                   {session?.user?.name?.charAt(0)}
                 </div>
               )}
            </div>
            <h2 className={`text-lg font-black ${themeClasses.text}`}>{session?.user?.name}</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
               <Store size={12} /> {profile?.shopName || "Syncing Hub..."}
            </p>
          </div>
        </div>

        {/* 📊 OPERATIONS REPORT */}
        <button 
            onClick={() => setActiveModal('REPORT')}
            className={`w-full p-5 rounded-3xl border flex items-center justify-between shadow-sm active:scale-95 transition-all group ${themeClasses.card} ${themeClasses.border}`}
        >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                 <p className={`font-black text-sm ${themeClasses.text}`}>Daily Report</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Walk-ins & Sales Intel</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>

        {/* 📅 LEAVE REQUEST */}
        <button 
            onClick={() => setActiveModal('LEAVE')}
            className={`w-full p-5 rounded-3xl border flex items-center justify-between shadow-sm active:scale-95 transition-all group ${themeClasses.card} ${themeClasses.border}`}
        >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-left">
                 <p className={`font-black text-sm ${themeClasses.text}`}>Apply for Leave</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Request Time Off</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>

        {/* 🎨 APPEARANCE */}
        <div className={`p-6 rounded-[2rem] border shadow-sm space-y-6 ${themeClasses.card} ${themeClasses.border}`}>
             <div className="flex items-center justify-between">
                <p className={`font-bold text-sm ${themeClasses.text}`}>Dark Mode</p>
                <button onClick={toggleDarkMode} className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? "bg-blue-600" : "bg-slate-200"}`}>
                   <div className={`w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? "translate-x-6" : "translate-x-0"}`} />
                </button>
             </div>
        </div>

        <button onClick={() => signOut()} className="w-full py-5 bg-red-500/10 text-red-500 font-black text-xs uppercase tracking-[0.2em] border border-red-500/20 rounded-2xl flex items-center justify-center gap-2">
          <LogOut size={16} /> Exit Terminal
        </button>
      </div>

      {/* --- MODAL ENGINE --- */}
      {activeModal !== 'NONE' && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 ${darkMode ? "bg-slate-800" : "bg-white"}`}>
            
            {submitted ? (
              <div className="py-12 text-center">
                 <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                 </div>
                 <h3 className={`text-xl font-black uppercase tracking-tight ${themeClasses.text}`}>Success</h3>
              </div>
            ) : (
              <form onSubmit={activeModal === 'LEAVE' ? handleLeaveSubmit : handleReportSubmit} className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-xl font-black ${themeClasses.text}`}>
                    {activeModal === 'LEAVE' ? "Leave Request" : "Daily Intel"}
                  </h3>
                  <button type="button" onClick={() => setActiveModal('NONE')} className="p-2 rounded-full hover:bg-slate-100/10 opacity-60">
                    <ArrowLeft size={20} className={themeClasses.text} />
                  </button>
                </div>

                {activeModal === 'REPORT' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Walk-ins</label>
                         <input type="number" required placeholder="0" className={`w-full h-14 px-4 rounded-2xl border-none font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setReportData({...reportData, walkIns: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Buyers / Conv</label>
                         <input type="number" required placeholder="0" className={`w-full h-14 px-4 rounded-2xl border-none font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setReportData({...reportData, conversions: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Market Intel (Competitors)</label>
                       <textarea placeholder="Samsung/LG activity..." className={`w-full p-4 rounded-2xl border-none font-bold text-sm min-h-[80px] outline-none resize-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setReportData({...reportData, marketIntel: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Staff Notes</label>
                       <textarea placeholder="Any extra feedback..." className={`w-full p-4 rounded-2xl border-none font-bold text-sm min-h-[80px] outline-none resize-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setReportData({...reportData, notes: e.target.value})} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
                         <input type="date" required className={`w-full h-14 px-4 rounded-2xl border-none font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setLeaveData({...leaveData, startDate: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">End Date</label>
                         <input type="date" required className={`w-full h-14 px-4 rounded-2xl border-none font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setLeaveData({...leaveData, endDate: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reason</label>
                       <textarea placeholder="Explanation..." required className={`w-full p-4 rounded-2xl border-none font-bold text-sm min-h-[100px] outline-none resize-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setLeaveData({...leaveData, reason: e.target.value})} />
                    </div>
                  </>
                )}

                <button disabled={isSubmitting} className="w-full text-white h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all" style={{ backgroundColor: getColorHex(accent) }}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={16} /> Sync to HQ</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}