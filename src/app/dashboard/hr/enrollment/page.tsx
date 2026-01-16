"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  UserPlus, Fingerprint, MapPin, Camera, ShieldCheck, FileText, 
  ChevronRight, Loader2, CheckCircle, Search, Filter, ArrowLeft, Upload
} from "lucide-react";

export default function PersonnelController() {
  const [view, setView] = useState<'GRID' | 'FORM'>('GRID');
  
  // --- MOCK DATA FOR GRID ---
  const [staff] = useState([
    { id: "1", name: "Kojo Bonsu", staffId: "LG-ACC-401", shop: "Melcom Accra Mall", status: "ACTIVE" },
    { id: "2", name: "Ama Serwaa", staffId: "LG-KUM-502", shop: "Game Kumasi Mall", status: "ON_LEAVE" },
    { id: "3", name: "Kwesi Appiah", staffId: "LG-LAB-201", shop: "Palace Labone", status: "SUSPENDED" },
  ]);

  // --- RENDER: THE GRID (DIRECTORY) ---
  if (view === 'GRID') {
    return (
      <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Personnel Grid</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Strategic Field Force Directory</p>
          </div>
          <button 
            onClick={() => setView('FORM')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" /> Enroll Personnel
          </button>
        </div>

        {/* THE TABLE */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Hub</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Portal Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staff.map((person) => (
                <tr key={person.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <Link href={`/dashboard/hr/personnel/${person.id}`} className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-xs">
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{person.name}</p>
                        <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">{person.staffId}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-6 text-[11px] font-bold text-slate-600 uppercase">{person.shop}</td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                      person.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      person.status === 'SUSPENDED' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {person.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <Link 
                       href={`/dashboard/hr/personnel/${person.id}`}
                       className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                     >
                       Open Portal <ChevronRight className="w-3 h-3" />
                     </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- RENDER: THE FORM (YOUR ORIGINAL CODE RE-INTEGRATED) ---
  return <EnrollmentForm onBack={() => setView('GRID')} />;
}

// --- SUB-COMPONENT: THE FORM ---
function EnrollmentForm({ onBack }: { onBack: () => void }) {
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
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">ENROLLMENT SUCCESSFUL</h2>
        <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">Personnel synced to LG Global Retail Grid</p>
        <button 
          onClick={onBack}
          className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          Return to Grid
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-in slide-in-from-right-10 duration-500">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Grid
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Personnel Enrollment</h1>
        </div>
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
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
                  <input required placeholder="As on Ghana Card" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input required type="email" placeholder="official@nexus.com" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ghana Card ID</label>
                  <input required placeholder="GHA-000000000-0" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                  <input required type="date" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input required placeholder="+233..." className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all" />
                </div>
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
                  <select className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all">
                    <option>Melcom - Accra Mall</option>
                    <option>Game - Kumasi City Mall</option>
                    <option>Palace Hypermarket - Labone</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role within Grid</label>
                  <select className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all">
                    <option>Sales Representative</option>
                    <option>Floor Supervisor</option>
                    <option>Inventory Auditor</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SECURITY */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <Fingerprint className="w-4 h-4 text-blue-600" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Security Credentials</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Password</label>
                <input required type="password" placeholder="Min 8 chars" className="w-full bg-white border border-slate-200 h-12 px-4 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between pt-10 border-t border-slate-100">
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Back</button>
            ) : <div />}
            
            {step < 3 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
              >
                Next Stage <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Enrollment"}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="lg:col-span-4 hidden lg:block">
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