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
import { SyncQueue } from "@/lib/sync-queue";
import { toast } from "react-hot-toast";

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

  const [activeModal, setActiveModal] = useState<'NONE' | 'LEAVE' | 'REPORT' | 'HISTORY'>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function HistoryView({ darkMode }: { darkMode: boolean }) {
    const [data, setData] = useState<{ reports: any[], leaves: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch('/api/mobile/history')
        .then(res => res.json())
        .then(d => {
          const payload = d?.data ?? d;
          setData({
            reports: Array.isArray(payload?.reports) ? payload.reports : [],
            leaves: Array.isArray(payload?.leaves) ? payload.leaves : [],
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    if (!data) return <div className="text-center py-10 opacity-50 font-bold">Failed to load history</div>;

    return (
      <div className="space-y-6 h-[60vh] overflow-y-auto custom-scrollbar pr-2">
        {/* LEAVES */}
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Leave Requests</h4>
          <div className="space-y-2">
            {data.leaves.length === 0 ? <p className="text-xs opacity-50 italic">No history found.</p> : data.leaves.map(l => (
              <div key={l.id} className={`p-3 rounded-xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-100 bg-slate-50"}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold opacity-70">{new Date(l.startDate).toLocaleDateString()}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${l.status === 'APPROVED' ? 'bg-emerald-500 text-white' : l.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>{l.status}</span>
                </div>
                <p className="text-xs font-bold truncate">{l.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* REPORTS */}
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Daily Reports</h4>
          <div className="space-y-2">
            {data.reports.length === 0 ? <p className="text-xs opacity-50 italic">No history found.</p> : data.reports.map(r => (
              <div key={r.id} className={`p-3 rounded-xl border ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-100 bg-slate-50"}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold opacity-70">{new Date(r.createdAt).toLocaleDateString()}</span>
                  <span className="text-[9px] font-black text-blue-500">GHS {r.totalSales}</span>
                </div>
                <p className="text-[10px] font-bold opacity-50">Walk-ins: {r.walkIns} | Conv: {r.buyers}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DATA STATES - Aligned with Backend naming
  const [leaveData, setLeaveData] = useState({ startDate: "", endDate: "", reason: "" });
  const [reportData, setReportData] = useState({ walkIns: "", conversions: "", marketIntel: "", notes: "" });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/mobile/init").then(r => r.json()).then(setProfile);
  }, []);

  // --- HANDLERS ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (Max 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result;
      if (typeof base64 === 'string') {
        // Optimistic Update
        setProfile((prev: any) => ({ ...prev, image: base64 }));

        try {
          const res = await fetch('/api/mobile/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          });
          if (res.ok) toast.success("Profile Photo Updated");
          else toast.error("Upload Failed");
        } catch (err) {
          toast.error("Network Error");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Convert dates to ISO strings if needed, ensuring strict typing
    const payload = {
      type: "Annual Leave",
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason
    };

    try {
      if (!navigator.onLine) throw new Error("Offline");

      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => { setActiveModal('NONE'); setSubmitted(false); }, 2000);
      } else {
        throw new Error("Server Error");
      }
    } catch (err) {
      // 📴 OFFLINE FALLBACK
      console.log("Network failed, queuing offline...");
      SyncQueue.enqueue('LEAVE', payload);
      toast.success("Saved Offline. Will sync when online.", { icon: '📡' });
      setSubmitted(true);
      setTimeout(() => { setActiveModal('NONE'); setSubmitted(false); }, 2000);
    }
    finally { setIsSubmitting(false); }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      walkIns: reportData.walkIns,
      conversions: reportData.conversions,
      marketIntel: reportData.marketIntel,
      notes: reportData.notes
    };

    try {
      if (!navigator.onLine) throw new Error("Offline");

      const res = await fetch("/api/operations/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => { setActiveModal('NONE'); setSubmitted(false); }, 2000);
      } else {
        throw new Error("Server Error");
      }
    } catch (err) {
      // 📴 OFFLINE FALLBACK
      console.log("Network failed, queuing offline...");
      SyncQueue.enqueue('REPORT', payload);
      toast.success("Saved Offline. Will sync when online.", { icon: '📡' });
      setSubmitted(true);
      setTimeout(() => { setActiveModal('NONE'); setSubmitted(false); }, 2000);
    }
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
            <div className="relative w-24 h-24 mx-auto mb-4 group">
              <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-4 ${darkMode ? "border-slate-700" : "border-white"} shadow-lg`}>
                {profile?.image ? (
                  <img src={profile.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                    {session?.user?.name?.charAt(0)}
                  </div>
                )}
              </div>
              {/* UPLOAD OVERLAY */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] cursor-pointer">
                <span className="text-xs font-bold text-white uppercase">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <h2 className={`text-lg font-black ${themeClasses.text}`}>{session?.user?.name}</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
              <Store size={12} /> {profile?.shopName || "Syncing Hub..."}
            </p>
          </div>
        </div>

        {/* 📊 OPERATIONS REPORT */}
        <button
          onClick={() => router.push('/mobilepos/report')}
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

        {/* 📜 HISTORY LOG */}
        <button
          onClick={() => setActiveModal('HISTORY')}
          className={`w-full p-5 rounded-3xl border flex items-center justify-between shadow-sm active:scale-95 transition-all group ${themeClasses.card} ${themeClasses.border}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500"}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className={`font-black text-sm ${themeClasses.text}`}>My History</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Past Reports & Requests</p>
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

        <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} className="w-full py-5 bg-red-500/10 text-red-500 font-black text-xs uppercase tracking-[0.2em] border border-red-500/20 rounded-2xl flex items-center justify-center gap-2">
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
                <p className="text-xs text-slate-400 mt-2">Data Processed Securely</p>
              </div>
            ) : (
              <form onSubmit={activeModal === 'LEAVE' ? handleLeaveSubmit : handleReportSubmit} className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-xl font-black ${themeClasses.text}`}>
                    {activeModal === 'LEAVE' ? "Leave Request" : activeModal === 'HISTORY' ? "My History" : "Daily Intel"}
                  </h3>
                  <button type="button" onClick={() => setActiveModal('NONE')} className="p-2 rounded-full hover:bg-slate-100/10 opacity-60">
                    <ArrowLeft size={20} className={themeClasses.text} />
                  </button>
                </div>

                {activeModal === 'HISTORY' ? (
                  <HistoryView darkMode={darkMode} />
                ) : activeModal === 'REPORT' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Walk-ins</label>
                        <input type="number" required placeholder="0" className={`w-full h-14 px-4 rounded-2xl border-none font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setReportData({ ...reportData, walkIns: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Buyers / Conv</label>
                        <input type="number" required placeholder="0" className={`w-full h-14 px-4 rounded-2xl border-none font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setReportData({ ...reportData, conversions: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Market Intel (Competitors)</label>
                      <textarea placeholder="Samsung/LG activity..." className={`w-full p-4 rounded-2xl border-none font-bold text-sm min-h-[80px] outline-none resize-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setReportData({ ...reportData, marketIntel: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Staff Notes</label>
                      <textarea placeholder="Any extra feedback..." className={`w-full p-4 rounded-2xl border-none font-bold text-sm min-h-[80px] outline-none resize-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setReportData({ ...reportData, notes: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
                        <input type="date" required className={`w-full h-14 px-4 rounded-2xl border-none font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">End Date</label>
                        <input type="date" required className={`w-full h-14 px-4 rounded-2xl border-none font-bold outline-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reason</label>
                      <textarea placeholder="Explanation..." required className={`w-full p-4 rounded-2xl border-none font-bold text-sm min-h-[100px] outline-none resize-none ${darkMode ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-900"}`} onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })} />
                    </div>
                  </>
                )}

                {activeModal !== 'HISTORY' && (
                  <button disabled={isSubmitting} className="w-full text-white h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all" style={{ backgroundColor: getColorHex(accent) }}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={16} /> Sync to HQ</>}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}