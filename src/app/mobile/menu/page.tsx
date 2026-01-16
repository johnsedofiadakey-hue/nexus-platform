"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { 
  User, Calendar, FileText, Settings, 
  HelpCircle, LogOut, ChevronRight, X, 
  CheckCircle, Clock, AlertTriangle, ArrowLeft,
  Moon, Sun, Palette, Smile, Zap
} from "lucide-react";
import { useMobileTheme } from "@/context/MobileThemeContext"; // 🔌 CONNECTING TO THE BRAIN

export default function MobileMenu() {
  const [view, setView] = useState<'MENU' | 'LEAVE_LIST' | 'LEAVE_FORM'>('MENU');
  
  // 🔌 USE GLOBAL THEME CONTEXT (Instead of local state)
  const { darkMode, toggleDarkMode, accent, setAccent, themeClasses } = useMobileTheme();
  
  // Local "Mood" state (This is just for fun on this page)
  const [mood, setMood] = useState("🚀 Productive");

  // --- LEAVE DATA ---
  const [leaveHistory, setLeaveHistory] = useState([
    { id: 1, type: "Sick Leave", dates: "Jan 12 - Jan 14", status: "Approved" },
    { id: 2, type: "Emergency", dates: "Dec 05", status: "Rejected" },
  ]);
  const [leaveForm, setLeaveForm] = useState({ type: "Annual Leave", startDate: "", endDate: "", reason: "" });

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest = { id: Date.now(), type: leaveForm.type, dates: `${leaveForm.startDate.slice(5)} - ${leaveForm.endDate.slice(5)}`, status: "Pending" };
    setLeaveHistory([newRequest, ...leaveHistory]);
    setView('LEAVE_LIST');
  };

  // --- VIEW 1: MAIN MENU ---
  if (view === 'MENU') {
    return (
      <div className={`min-h-[80vh] transition-colors duration-500`}>
        <div className="space-y-6 pb-24">
          
          {/* 1. PROFILE HEADER */}
          <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${themeClasses.card} ${themeClasses.border}`}>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg bg-${accent}-600`}>
               KB
             </div>
             <div>
               <h2 className={`text-lg font-black ${themeClasses.text}`}>Kojo Bonsu</h2>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sales Rep • ID: 4021</p>
               
               {/* Fun Mood Selector */}
               <button 
                 onClick={() => setMood(mood === "🚀 Productive" ? "😴 Need Coffee" : "🚀 Productive")}
                 className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 bg-${accent}-500/10 text-${accent}-600`}
               >
                  {mood}
               </button>
             </div>
          </div>

          {/* 2. THEME & VIBES (GLOBAL CONTROLS) */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Appearance & Vibe</h3>
            <div className={`p-6 rounded-[2rem] border shadow-sm space-y-6 ${themeClasses.card} ${themeClasses.border}`}>
               
               {/* Dark Mode Toggle */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-slate-100 text-slate-400'}`}>
                      {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                   </div>
                   <div>
                     <p className={`font-bold ${themeClasses.text}`}>{darkMode ? "Dark Mode" : "Light Mode"}</p>
                     <p className="text-[10px] uppercase font-bold text-slate-500">{darkMode ? "Easy on the eyes" : "Bright & Clean"}</p>
                   </div>
                 </div>
                 <button 
                   onClick={toggleDarkMode}
                   className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? `bg-${accent}-600` : "bg-slate-200"}`}
                 >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${darkMode ? "translate-x-6" : "translate-x-0"}`} />
                 </button>
               </div>

               {/* Color Picker */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${accent}-500/10 text-${accent}-600`}>
                      <Palette className="w-5 h-5" />
                   </div>
                   <p className={`font-bold ${themeClasses.text}`}>Theme Color</p>
                 </div>
                 <div className="flex gap-2">
                   {['blue', 'purple', 'rose', 'amber'].map((c) => (
                     <button 
                       key={c}
                       onClick={() => setAccent(c as any)}
                       className={`w-8 h-8 rounded-full border-2 transition-all ${c === accent ? "border-white shadow-lg scale-110" : "border-transparent opacity-50"} bg-${c === 'amber' ? 'amber-500' : c + '-600'}`} 
                     />
                   ))}
                 </div>
               </div>

            </div>
          </div>

          {/* 3. CORE ACTIONS */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Workstation</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('LEAVE_LIST')} className={`p-6 rounded-3xl border shadow-sm text-left group transition-all active:scale-95 ${themeClasses.card} ${themeClasses.border}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-${accent}-500/10 text-${accent}-600`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className={`font-black ${themeClasses.text}`}>Time Off</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Request Leave</p>
              </button>

              <button className={`p-6 rounded-3xl border shadow-sm text-left group transition-all active:scale-95 ${themeClasses.card} ${themeClasses.border}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-emerald-500/10 text-emerald-500`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className={`font-black ${themeClasses.text}`}>Payslips</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">View Salary</p>
              </button>
            </div>
          </div>

          {/* 4. LOGOUT */}
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: LEAVE HISTORY ---
  if (view === 'LEAVE_LIST') {
    return (
      <div className="min-h-[80vh]">
        <div className="space-y-6 pb-24">
           <div className="flex items-center justify-between">
              <button onClick={() => setView('MENU')} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:opacity-80">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h1 className={`text-xl font-black ${themeClasses.text}`}>My Leave</h1>
           </div>
           <button onClick={() => setView('LEAVE_FORM')} className={`w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform bg-${accent}-600`}>
             + Request New Leave
           </button>
           <div className="space-y-4">
              {leaveHistory.map((item) => (
                <div key={item.id} className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between ${themeClasses.card} ${themeClasses.border}`}>
                   <div>
                      <p className={`font-black ${themeClasses.text}`}>{item.type}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{item.dates}</p>
                   </div>
                   <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                      item.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                   }`}>
                      {item.status}
                   </span>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  // --- VIEW 3: LEAVE FORM ---
  if (view === 'LEAVE_FORM') {
    return (
      <div className="min-h-[80vh]">
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <button onClick={() => setView('LEAVE_LIST')} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:opacity-80">
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
              <h1 className={`text-xl font-black ${themeClasses.text}`}>New Request</h1>
           </div>
           <form onSubmit={handleSubmitLeave} className={`p-6 rounded-3xl border shadow-sm space-y-6 ${themeClasses.card} ${themeClasses.border}`}>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Leave Type</label>
                 <select 
                   className={`w-full h-12 rounded-xl px-4 text-sm font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`}
                   value={leaveForm.type}
                   onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}
                 >
                   <option>Annual Leave</option>
                   <option>Sick Leave</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dates</label>
                 <input 
                   type="date" required
                   className={`w-full h-12 rounded-xl px-4 text-sm font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`}
                   onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})}
                 />
              </div>
              <button type="submit" className={`w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform bg-${accent}-600`}>
                 Submit Request
              </button>
           </form>
        </div>
      </div>
    );
  }
}