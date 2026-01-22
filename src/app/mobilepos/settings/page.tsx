"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, Loader2, Send, CheckCircle2, 
  Calendar, LogOut, User, Shield, ChevronRight,
  Moon, Sun, Palette, Zap
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMobileTheme } from "@/context/MobileThemeContext"; // 👈 Restored Theme Context

// Helper for inline styles (since dynamic Tailwind classes can be tricky)
const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706"
  };
  return colors[color] || colors.blue;
};

export default function MobileSettings() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // 🎨 THEME STATE RESTORED
  const { darkMode, toggleDarkMode, accent, setAccent, themeClasses } = useMobileTheme();
  const [mood, setMood] = useState("🚀 Productive");

  // LEAVE FORM STATE
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leaveData, setLeaveData] = useState({ startDate: "", endDate: "", reason: "" });

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...leaveData, type: "Annual Leave" })
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => { 
          setShowLeaveForm(false); 
          setSubmitted(false); 
          setLeaveData({ startDate: "", endDate: "", reason: "" });
        }, 2000);
      } else {
        alert("Request Failed. Try again.");
      }
    } catch (err) {
      alert("Network Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans pb-32 transition-colors duration-300 ${themeClasses.bg}`}>
      
      {/* HEADER */}
      <div className={`px-6 py-6 border-b sticky top-0 z-20 shadow-sm flex items-center gap-4 ${themeClasses.nav} ${themeClasses.border}`}>
        <button onClick={() => router.back()} className={`p-2 rounded-full hover:opacity-70 transition-colors ${darkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>Settings & Vibe</h1>
      </div>

      <div className="p-6 space-y-6">

        {/* 1. PROFILE CARD (Gen Z Style) */}
        <div className={`rounded-[2.5rem] p-8 text-center border shadow-sm relative overflow-hidden ${themeClasses.card} ${themeClasses.border}`}>
          <div 
             className="absolute top-0 left-0 w-full h-24 opacity-20" 
             style={{ background: `linear-gradient(to bottom, ${getColorHex(accent)}, transparent)` }} 
          />
          
          <div className="relative z-10">
            <div 
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white shadow-xl border-4"
              style={{ backgroundColor: getColorHex(accent), borderColor: darkMode ? "#1e293b" : "#fff", boxShadow: `0 10px 30px -10px ${getColorHex(accent)}80` }}
            >
              {session?.user?.name?.charAt(0) || <User className="w-10 h-10" />}
            </div>
            
            <h2 className={`text-xl font-black ${themeClasses.text}`}>{session?.user?.name || "Agent"}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-${accent}-500/10 text-${accent}-600`} style={{ color: getColorHex(accent), backgroundColor: `${getColorHex(accent)}20` }}>
                <Shield className="w-3 h-3" /> Sales Rep
              </span>
            </div>
            
            {/* MOOD TOGGLE */}
            <button 
               onClick={() => setMood(mood === "🚀 Productive" ? "😴 Need Coffee" : "🚀 Productive")}
               className="mt-4 text-[10px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest"
            >
              Current Vibe: {mood}
            </button>
          </div>
        </div>

        {/* 2. SYSTEM VIBE (Theme Controls Restored) */}
        <div>
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">System Appearance</h3>
           <div className={`p-6 rounded-[2rem] border shadow-sm space-y-6 ${themeClasses.card} ${themeClasses.border}`}>
               
               {/* Dark Mode Toggle */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-slate-100 text-slate-400'}`}>
                      {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                   </div>
                   <p className={`font-bold text-sm ${themeClasses.text}`}>{darkMode ? "Dark Mode" : "Light Mode"}</p>
                 </div>
                 <button 
                    onClick={toggleDarkMode} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300`}
                    style={{ backgroundColor: darkMode ? getColorHex(accent) : '#e2e8f0' }}
                 >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? "translate-x-6" : "translate-x-0"}`} />
                 </button>
               </div>
               
               {/* Accent Color Picker */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getColorHex(accent)}20`, color: getColorHex(accent) }}>
                      <Palette className="w-5 h-5" />
                   </div>
                   <p className={`font-bold text-sm ${themeClasses.text}`}>Accent Color</p>
                 </div>
                 <div className="flex gap-2">
                   {['blue', 'purple', 'rose', 'amber'].map((c) => (
                     <button 
                        key={c} 
                        onClick={() => setAccent(c as any)} 
                        className={`w-8 h-8 rounded-full border-2 transition-all ${c === accent ? "border-white shadow-lg scale-110" : "border-transparent opacity-50"}`}
                        style={{ backgroundColor: getColorHex(c) }}
                     />
                   ))}
                 </div>
               </div>
            </div>
        </div>

        {/* 3. OPERATIONAL TOOLS */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Workstation</h3>
          <button 
            onClick={() => setShowLeaveForm(true)}
            className={`w-full p-5 rounded-3xl border flex items-center justify-between shadow-sm active:scale-95 transition-all group ${themeClasses.card} ${themeClasses.border}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${getColorHex(accent)}15`, color: getColorHex(accent) }}>
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-left">
                 <p className={`font-black text-sm ${themeClasses.text}`}>Apply for Leave</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Request Time Off</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>
        </div>

        {/* 4. SIGN OUT */}
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })} 
          className="w-full py-5 bg-red-500/10 text-red-500 font-black text-xs uppercase tracking-[0.2em] border border-red-500/20 rounded-2xl flex items-center justify-center gap-2 mt-8 active:scale-95 transition-transform"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>

      </div>

      {/* LEAVE MODAL (Kept Functional) */}
      {showLeaveForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 ${darkMode ? "bg-slate-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="py-12 text-center animate-in zoom-in duration-300">
                 <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                 </div>
                 <h3 className={`text-xl font-black uppercase tracking-tight ${themeClasses.text}`}>Request Sent</h3>
              </div>
            ) : (
              <form onSubmit={handleLeaveSubmit} className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-xl font-black ${themeClasses.text}`}>New Request</h3>
                  <button type="button" onClick={() => setShowLeaveForm(false)} className="p-2 rounded-full hover:bg-slate-100/10 opacity-60">
                    <ArrowLeft className={`w-5 h-5 ${themeClasses.text}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
                     <input type="date" required className={`w-full h-14 px-4 rounded-2xl border-none font-bold text-xs outline-none focus:ring-2 ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} style={{ focusRingColor: getColorHex(accent) }} onChange={e => setLeaveData({...leaveData, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">End Date</label>
                     <input type="date" required className={`w-full h-14 px-4 rounded-2xl border-none font-bold text-xs outline-none focus:ring-2 ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} style={{ focusRingColor: getColorHex(accent) }} onChange={e => setLeaveData({...leaveData, endDate: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reason</label>
                   <textarea placeholder="Why do you need leave?" required className={`w-full p-4 rounded-2xl border-none font-bold text-sm min-h-[120px] outline-none focus:ring-2 resize-none ${darkMode ? "bg-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 text-slate-900 placeholder:text-slate-400"}`} style={{ focusRingColor: getColorHex(accent) }} onChange={e => setLeaveData({...leaveData, reason: e.target.value})} />
                </div>

                <button disabled={isSubmitting} className="w-full text-white h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-70" style={{ backgroundColor: getColorHex(accent) }}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Request</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}