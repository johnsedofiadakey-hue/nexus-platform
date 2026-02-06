"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2, Zap, PackageSearch, Send,
  Loader2, CheckCircle2, ArrowLeft, Plus, X
} from "lucide-react";
import { useMobileTheme } from "@/context/MobileThemeContext";

const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706"
  };
  return colors[color] || colors.blue;
};

export default function FieldReportPage() {
  const router = useRouter();
  const { darkMode, accent, themeClasses } = useMobileTheme();
  const accentHex = getColorHex(accent);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Separate State for Intel to avoid complex JSON parsing on every keystroke
  const [intelItems, setIntelItems] = useState([{ brand: "", model: "", price: "" }]);

  const [formData, setFormData] = useState({
    walkIns: "",
    inquiries: "",
    buyers: "",
    stockGaps: "",
    competitorNotes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/operations/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          marketIntel: JSON.stringify(intelItems.filter(i => i.brand || i.model)) // Serialize here
        }),
      });
      if (response.ok) setSuccess(true);
    } catch (err) {
      console.error("Sync Failure");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300 ${themeClasses.bg}`}>
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
        <h2 className={`text-xl font-black uppercase tracking-tighter ${themeClasses.text}`}>Report Synchronized</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Intelligence logged to Command Center</p>
        <button
          onClick={() => router.push("/mobilepos")}
          className="mt-10 px-8 py-4 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
          style={{ backgroundColor: accentHex }}
        >
          Return to Sales Portal
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans pb-24 transition-colors duration-500 ${themeClasses.bg}`}>

      {/* HEADER */}
      <div className={`px-6 py-6 border-b sticky top-0 z-20 shadow-sm ${themeClasses.nav} ${themeClasses.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <ArrowLeft className={`w-5 h-5 ${themeClasses.text}`} />
            </button>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: accentHex }}>Nexus Field Intel</p>
              <h1 className={`text-lg font-black tracking-tighter ${themeClasses.text}`}>Operations Report</h1>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase ${themeClasses.card} ${themeClasses.border} ${themeClasses.text} opacity-60`}>
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">

        {/* SECTION: FOOT TRAFFIC */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foot Traffic & Conversion</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Walk-ins</label>
              <input
                type="number" required placeholder="0"
                className={`w-full border h-14 px-4 rounded-xl text-sm font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                style={{ borderColor: darkMode ? undefined : accentHex }}
                onChange={(e) => setFormData({ ...formData, walkIns: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Inquiries</label>
              <input
                type="number" required placeholder="0"
                className={`w-full border h-14 px-4 rounded-xl text-sm font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                style={{ borderColor: darkMode ? undefined : accentHex }}
                onChange={(e) => setFormData({ ...formData, inquiries: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Actual Buyers</label>
              <input
                type="number" required placeholder="0"
                className={`w-full border h-14 px-4 rounded-xl text-sm font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                style={{ borderColor: darkMode ? undefined : accentHex }}
                onChange={(e) => setFormData({ ...formData, buyers: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* SECTION: MARKET INTEL */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5" style={{ color: accentHex }} />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Competitor Prices</h3>
          </div>

          {/* Dynamic Intel List */}
          <div className="space-y-4">
            {intelItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3 relative group">
                <div className="absolute right-2 top-2">
                  {intelItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIntelItems(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Brand</label>
                    <input
                      value={item.brand}
                      placeholder="e.g. Samsung"
                      className={`w-full border h-10 px-3 rounded-lg text-xs font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      onChange={(e) => {
                        const newItems = [...intelItems];
                        newItems[idx].brand = e.target.value;
                        setIntelItems(newItems);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Model</label>
                    <input
                      value={item.model}
                      placeholder="e.g. A14"
                      className={`w-full border h-10 px-3 rounded-lg text-xs font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      onChange={(e) => {
                        const newItems = [...intelItems];
                        newItems[idx].model = e.target.value;
                        setIntelItems(newItems);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Price (₵)</label>
                  <input
                    type="number"
                    value={item.price}
                    placeholder="0.00"
                    className={`w-full border h-10 px-3 rounded-lg text-xs font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    onChange={(e) => {
                      const newItems = [...intelItems];
                      newItems[idx].price = e.target.value;
                      setIntelItems(newItems);
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Add Button */}
            <button
              type="button"
              onClick={() => setIntelItems([...intelItems, { brand: "", model: "", price: "" }])}
              className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Competitor Item
            </button>
          </div>
        </section>

        {/* SECTION: STOCK GAP ALERTS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <PackageSearch className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory & Stock Gaps</h3>
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Urgent Low Availability</label>
            <textarea
              rows={2}
              className={`w-full border-dashed border-2 p-4 rounded-xl text-xs font-bold outline-none transition-all resize-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              placeholder="Which models are out of stock?"
              onChange={(e) => setFormData({ ...formData, stockGaps: e.target.value })}
            />
          </div>
        </section>

        {/* SYNC BUTTON */}
        <button
          disabled={loading}
          className="w-full h-16 rounded-2xl text-white font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
          style={{ backgroundColor: accentHex, boxShadow: `0 10px 25px -5px ${accentHex}50` }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <Send className="w-4 h-4" /> Finalise Daily Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}