"use client";

import { useState } from "react";
import { Camera, Barcode, CheckCircle2, Loader2 } from "lucide-react";

export default function MobileSalesEntry() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Logic to POST to /api/sales
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-black text-slate-900">SALE SYNCED</h2>
        <p className="text-slate-500 text-sm mt-2">Data transmitted to LG Command Center</p>
        <button onClick={() => setSuccess(false)} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">New Entry</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* MOBILE HEADER */}
      <div className="bg-white px-6 py-6 border-b border-slate-200 sticky top-0 z-10">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">LG Ghana • Field Op</p>
        <h1 className="text-xl font-black text-slate-900">Sales Entry Portal</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* PRODUCT SELECTION */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Product Category</label>
          <select className="w-full bg-white border border-slate-200 h-14 px-4 rounded-xl text-sm font-bold appearance-none">
            <option>OLED TV - C Series</option>
            <option>InstaView Refrigerator</option>
            <option>Vivace Washing Machine</option>
            <option>Dual Inverter AC</option>
          </select>
        </div>

        {/* SALE DETAILS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
            <input type="number" defaultValue="1" className="w-full border border-slate-200 h-14 px-4 rounded-xl text-sm font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price (GHS)</label>
            <input type="number" placeholder="0.00" className="w-full border border-slate-200 h-14 px-4 rounded-xl text-sm font-bold" />
          </div>
        </div>

        {/* CUSTOMER INFO (OPTIONAL FOR WARRANTY) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Phone (Warranty)</label>
          <input type="tel" placeholder="024 XXX XXXX" className="w-full border border-slate-200 h-14 px-4 rounded-xl text-sm font-bold" />
        </div>

        {/* PHOTO PROOF (Optional) */}
        <button type="button" className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center text-slate-400 gap-2">
          <Camera className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Capture Receipt / Product S/N</span>
        </button>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 h-16 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sync with Hub"}
        </button>
      </form>
    </div>
  );
}