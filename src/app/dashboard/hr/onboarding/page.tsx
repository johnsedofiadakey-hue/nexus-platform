"use client";

import { UserPlus, Upload, ShieldCheck, MapPin } from "lucide-react";

export default function HROnboarding() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Personnel Enrollment</h1>
        <p className="text-slate-500 text-sm">Register new field operatives for LG Ghana Retail Grid</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <form className="space-y-8">
          {/* PROFILE IMAGE UPLOAD */}
          <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase">Headshot Profile</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">PNG, JPG up to 5MB</p>
              <button className="mt-3 text-[10px] font-black text-blue-600 uppercase border-b border-blue-600 pb-0.5">Upload Image</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name (As on Ghana Card)</label>
              <input className="w-full border border-slate-200 h-12 px-4 rounded-xl text-sm font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghana Card ID (GHA-XXXXXXXXX-X)</label>
              <input className="w-full border border-slate-200 h-12 px-4 rounded-xl text-sm font-medium focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
              <input type="date" className="w-full border border-slate-200 h-12 px-4 rounded-xl text-sm font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Hub</label>
              <select className="w-full border border-slate-200 h-12 px-4 rounded-xl text-sm font-medium">
                <option>Accra Mall Hub</option>
                <option>Kumasi Regional Center</option>
                <option>Takoradi Port Node</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Assignment</label>
              <select className="w-full border border-slate-200 h-12 px-4 rounded-xl text-sm font-medium">
                <option>Sales Representative</option>
                <option>Regional Supervisor</option>
                <option>Inventory Auditor</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button className="w-full bg-slate-900 text-white h-14 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3">
              <UserPlus className="w-4 h-4" /> Enroll Personnel to Grid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}