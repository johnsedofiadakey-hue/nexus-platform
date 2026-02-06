"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Calendar, FileText, LogOut, ArrowLeft,
  Moon, Sun, Palette, User, Briefcase, CreditCard, ShieldCheck, Target
} from "lucide-react";
import { useMobileTheme } from "@/context/MobileThemeContext";
import MobileTargetView from "@/components/mobile/MobileTargetView";

// Helper to get hex codes for inline styles
const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706"
  };
  return colors[color] || colors.blue;
};

export default function MobileProfilePage() {
  const { data: session } = useSession();
  const [view, setView] = useState<'MENU' | 'LEAVE_LIST' | 'LEAVE_FORM' | 'PROMOTER_DETAILS' | 'TARGETS'>('MENU');
  const { darkMode, toggleDarkMode, accent, setAccent, themeClasses } = useMobileTheme();
  const [mood, setMood] = useState("🚀 Productive");
  const [targetProgress, setTargetProgress] = useState<any>(null);

  // --- LEAVE FORM STATE ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "Annual Leave",
    startDate: "",
    endDate: "",
    reason: ""
  });

  // --- FETCH TARGET PROGRESS ---
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const res = await fetch('/api/mobile/init');
        const data = await res.json();
        if (data.targetProgress) {
          setTargetProgress(data.targetProgress);
        }
      } catch (error) {
        console.error('Failed to fetch targets:', error);
      }
    };
    fetchTargets();
  }, []);

  // --- SUBMIT LOGIC ---
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm),
      });

      if (res.ok) {
        alert("Request Sent to HQ!");
        setView('LEAVE_LIST');
        setLeaveForm({ type: "Annual Leave", startDate: "", endDate: "", reason: "" });
      } else {
        alert("Failed to send request. Try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Connection Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- VIEW 1: MAIN MENU ---
  if (view === 'MENU') {
    return (
      <div className={`min-h-[80vh] transition-colors duration-500 pb-24 font-sans`}>

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6 px-2 mt-6">
          <Link href="/mobilepos" className={`p-2 rounded-full border shadow-sm ${themeClasses.card} ${themeClasses.border}`}>
            <ArrowLeft className={`w-5 h-5 ${themeClasses.text}`} />
          </Link>
          <h1 className={`text-xl font-black ${themeClasses.text}`}>Profile & Settings</h1>
        </div>

        <div className="space-y-6">

          {/* PROFILE CARD */}
          <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${themeClasses.card} ${themeClasses.border}`}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg overflow-hidden border-2 border-white"
              style={{ backgroundColor: getColorHex(accent) }}
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                session?.user?.name ? session.user.name.charAt(0) : <User />
              )}
            </div>
            <div>
              <h2 className={`text-lg font-black ${themeClasses.text}`}>{session?.user?.name || "Agent"}</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sales Rep • {session?.user?.email}</p>
              <button
                onClick={() => setMood(mood === "🚀 Productive" ? "😴 Need Coffee" : "🚀 Productive")}
                className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10`}
                style={{ color: getColorHex(accent), backgroundColor: `${getColorHex(accent)}20` }}
              >
                {mood}
              </button>
            </div>
          </div>

          {/* APPEARANCE */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 px-2">System Vibe</h3>
            <div className={`p-6 rounded-[2rem] border shadow-sm space-y-6 ${themeClasses.card} ${themeClasses.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-slate-100 text-slate-400'}`}>
                    {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <p className={`font-bold ${themeClasses.text}`}>{darkMode ? "Dark Mode" : "Light Mode"}</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full p-1 transition-colors`}
                  style={{ backgroundColor: darkMode ? getColorHex(accent) : '#e2e8f0' }}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${darkMode ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getColorHex(accent)}20`, color: getColorHex(accent) }}>
                    <Palette className="w-5 h-5" />
                  </div>
                  <p className={`font-bold ${themeClasses.text}`}>Accent Color</p>
                </div>
                <div className="flex gap-2">
                  {(['blue', 'purple', 'rose', 'amber'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setAccent(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${c === accent ? "border-white shadow-lg scale-110" : "border-transparent opacity-50"}`}
                      style={{ backgroundColor: getColorHex(c) }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* WORKSTATION */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Workstation</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setView('TARGETS')}
                className={`p-6 rounded-3xl border shadow-sm text-left group transition-all active:scale-95 ${themeClasses.card} ${themeClasses.border}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${getColorHex(accent)}20`, color: getColorHex(accent) }}
                >
                  <Target className="w-5 h-5" />
                </div>
                <p className={`font-black ${themeClasses.text}`}>My Targets</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Performance Goals</p>
              </button>
              <button
                onClick={() => setView('LEAVE_LIST')}
                className={`p-6 rounded-3xl border shadow-sm text-left group transition-all active:scale-95 ${themeClasses.card} ${themeClasses.border}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${getColorHex(accent)}20`, color: getColorHex(accent) }}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <p className={`font-black ${themeClasses.text}`}>Time Off</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Request Leave</p>
              </button>
              <button
                onClick={() => setView('PROMOTER_DETAILS')}
                className={`p-6 rounded-3xl border shadow-sm text-left group transition-all active:scale-95 ${themeClasses.card} ${themeClasses.border}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-amber-500/10 text-amber-500"
                >
                  <Briefcase size={20} />
                </div>
                <p className={`font-black ${themeClasses.text}`}>Promoter Details</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">ID & Banking</p>
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

          <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mb-8">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: TARGETS ---
  if (view === 'TARGETS') {
    return (
      <div className="min-h-[80vh] pb-24 font-sans">
        <div className="flex items-center justify-between mb-6 px-2 mt-6">
          <button onClick={() => setView('MENU')} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:opacity-80">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className={`text-xl font-black ${themeClasses.text}`}>My Targets</h1>
        </div>
        <MobileTargetView targetProgress={targetProgress} themeClasses={themeClasses} accent={accent} />
      </div>
    );
  }

  // --- VIEW 3: LEAVE LIST ---
  if (view === 'LEAVE_LIST') {
    return (
      <div className="min-h-[80vh] pb-24 font-sans">
        <div className="flex items-center justify-between mb-6 px-2 mt-6">
          <button onClick={() => setView('MENU')} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:opacity-80">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className={`text-xl font-black ${themeClasses.text}`}>My Requests</h1>
        </div>
        <button
          onClick={() => setView('LEAVE_FORM')}
          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
          style={{ backgroundColor: getColorHex(accent) }}
        >
          + New Request
        </button>

        <div className={`mt-8 text-center p-8 rounded-3xl border border-dashed ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active history</p>
        </div>
      </div>
    );
  }

  // --- VIEW 4: LEAVE FORM ---
  if (view === 'LEAVE_FORM') {
    return (
      <div className="min-h-[80vh] font-sans pb-24">
        <div className="flex items-center justify-between mb-6 px-2 mt-6">
          <button onClick={() => setView('LEAVE_LIST')} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:opacity-80">
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>
          <h1 className={`text-xl font-black ${themeClasses.text}`}>New Request</h1>
        </div>

        <form onSubmit={handleSubmitLeave} className={`p-6 rounded-3xl border shadow-sm space-y-6 ${themeClasses.card} ${themeClasses.border}`}>

          {/* LEAVE TYPE */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Leave Category</label>
            <select
              className={`w-full h-12 rounded-xl px-4 text-sm font-bold outline-none ${darkMode ? "bg-slate-700 text-white border border-slate-600" : "bg-slate-50 text-slate-900 border-transparent"}`}
              value={leaveForm.type}
              onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
            >
              <option>Annual Leave</option>
              <option>Sick Leave</option>
              <option>Emergency</option>
              <option>Maternity/Paternity</option>
            </select>
          </div>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
              <input
                type="date" required
                className={`w-full h-12 rounded-xl px-4 text-sm font-bold outline-none ${darkMode ? "bg-slate-700 text-white border border-slate-600" : "bg-slate-50 text-slate-900"}`}
                value={leaveForm.startDate}
                onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End Date</label>
              <input
                type="date" required
                className={`w-full h-12 rounded-xl px-4 text-sm font-bold outline-none ${darkMode ? "bg-slate-700 text-white border border-slate-600" : "bg-slate-50 text-slate-900"}`}
                value={leaveForm.endDate}
                onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* EXPLANATION */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Explanation / Reason</label>
            <textarea
              rows={4}
              required
              placeholder="Please explain why you need this leave..."
              className={`w-full rounded-xl p-4 text-sm font-bold outline-none resize-none ${darkMode ? "bg-slate-700 text-white placeholder:text-slate-500 border border-slate-600" : "bg-slate-50 text-slate-900 placeholder:text-slate-400"}`}
              value={leaveForm.reason}
              onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: getColorHex(accent) }}
          >
            {isSubmitting ? "Sending..." : "Submit Request"}
          </button>
        </form>
      </div>
    );
  }

  // --- VIEW 5: PROMOTER DETAILS ---
  if (view === 'PROMOTER_DETAILS') {
    const user = session?.user as any;
    return (
      <div className="min-h-[80vh] font-sans pb-24">
        <div className="flex items-center justify-between mb-6 px-2 mt-6">
          <button onClick={() => setView('MENU')} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:opacity-80">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className={`text-xl font-black ${themeClasses.text}`}>Promoter Details</h1>
        </div>

        <div className={`p-6 rounded-[2rem] border shadow-sm space-y-8 ${themeClasses.card} ${themeClasses.border}`}>
          {/* BANKING SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text}`}>Banking Credentials</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bank Name</p>
                <p className={`text-sm font-black ${themeClasses.text}`}>{user?.bankName || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account Number</p>
                <p className={`text-sm font-black mono ${themeClasses.text}`}>{user?.bankAccountNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account Name</p>
                <p className={`text-sm font-black ${themeClasses.text}`}>{user?.bankAccountName || user?.name}</p>
              </div>
            </div>
          </div>

          {/* STATUTORY SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text}`}>Statutory & Employment</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SSNIT Number</p>
                <p className={`text-sm font-black mono ${themeClasses.text}`}>{user?.ssnitNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ghana Card PIN</p>
                <p className={`text-sm font-black mono ${themeClasses.text}`}>{user?.ghanaCard || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commencement Date</p>
                <p className={`text-sm font-black ${themeClasses.text}`}>
                  {user?.commencementDate ? new Date(user.commencementDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl bg-slate-50/50 border ${themeClasses.border} flex gap-3 items-center`}>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <LogOut className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">
              To update this information, please contact your Hub Manager or Organization Administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }
}