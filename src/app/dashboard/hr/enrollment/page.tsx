"use client";

import React, { useState } from "react";
import { 
  UserPlus, 
  Fingerprint, 
  MapPin, 
  Camera, 
  ShieldCheck, 
  FileText, 
  ChevronRight,
  Loader2,
  CheckCircle
} from "lucide-react";

export default function EnrollmentPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Logic to POST to /api/hr/onboard
    setTimeout(() => {
      setIsSubmitting(false);
      setCompleted(true);
    }, 2000);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">ENROLLMENT SUCCESSFUL</h2>
        <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">Personnel synced to LG Global Retail Grid</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest"
        >
          Enroll Next Operative
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Personnel Enrollment</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">HR Intelligence & Field Force Initialization</p>
        </div>
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                step === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 
                step > i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > i ? <CheckCircle className="w-4 h-4" /> : i}
              </div>
              {i < 3 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: BIO-DATA & INFO */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* STEP 1: PERSONAL IDENTITY */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Personal Identity</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                  <input required placeholder="As on Ghana Card" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input required type="email" placeholder="official@nexus.com" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ghana Card ID</label>
                  <input required placeholder="GHA-000000000-0" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                  <input required type="date" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input required placeholder="+233..." className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Residential Address</label>
                <textarea rows={3} placeholder="Digital Address / Street Name" className="w-full bg-white border border-slate-200 p-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
          )}

          {/* STEP 2: OPERATIONAL MAPPING */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Operational Mapping</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Retail Node</label>
                  <select className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none">
                    <option>Melcom - Accra Mall</option>
                    <option>Game - Kumasi City Mall</option>
                    <option>Palace Hypermarket - Labone</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role within Grid</label>
                  <select className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none">
                    <option>Sales Representative</option>
                    <option>Floor Supervisor</option>
                    <option>Inventory Auditor</option>
                  </select>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex gap-4">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Geofence Enforcement</h4>
                    <p className="text-[10px] text-blue-600 mt-1 uppercase font-medium leading-relaxed">This operative will be required to check-in within a 150m radius of the assigned node to transmit live telemetry.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SECURITY & BIO-DATA */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <Fingerprint className="w-4 h-4 text-blue-600" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Security Credentials</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Password</label>
                <input required type="password" placeholder="System Generated or Custom" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500" />
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Requirements: Min 8 chars, 1 Special Char.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                    <Camera className="w-6 h-6 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capture Biometric Headshot</span>
                 </div>
                 <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                    <Upload className="w-6 h-6 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upload Ghana Card (Front/Back)</span>
                 </div>
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between pt-10 border-t border-slate-100">
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Back</button>
            ) : <div />}
            
            {step < 3 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200"
              >
                Next Stage <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Enrollment"}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW & HELP */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white sticky top-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 text-blue-400">Enrollment Summary</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white/50" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</p>
                  <p className="text-xs font-bold uppercase tracking-wider">Awaiting Deployment</p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Organization</p>
                  <p className="text-[11px] font-bold">LG Ghana Strategic Grid</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Security Clearance</p>
                  <p className="text-[11px] font-bold text-emerald-400 uppercase">Level 1 (Field Op)</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 mt-10">
                <p className="text-[9px] text-white/50 leading-relaxed uppercase font-bold tracking-tighter italic">
                  "Ensure Ghana Card ID is verified against the NIA database before final submission."
                </p>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}

// Simple Helper for the Upload Icon not imported from lucide-react in snippet
function Upload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}