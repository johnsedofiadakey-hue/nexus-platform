"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - HR COMMAND HUB
 * VERSION: 25.5.0 (LIVE ROSTER / SHOP LINKED)
 * --------------------------------------------------------------------------
 * LOGIC:
 * 1. REAL-TIME: Polls staff directory every 10s for status updates.
 * 2. SHOP LINK: Displays assigned Shop for every agent.
 * 3. ENROLLMENT: Creates User + Links Shop in one atomic action.
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  UserPlus, Fingerprint, MapPin, FileText, 
  ChevronRight, Loader2, CheckCircle, ArrowLeft, 
  Mail, Phone, Building2, ShieldCheck, RefreshCw
} from "lucide-react";

export default function PersonnelController() {
  const [view, setView] = useState<'GRID' | 'FORM'>('GRID');
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. LIVE SYNC ENGINE ---
  useEffect(() => {
    if (view === 'GRID') {
      fetchStaff();
      // Poll for status updates every 10 seconds
      const interval = setInterval(fetchStaff, 10000); 
      return () => clearInterval(interval);
    }
  }, [view]);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/hr/staff?t=${Date.now()}`);
      if (res.ok) {
        setStaff(await res.json());
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to load staff");
    }
  };

  // --- RENDER: THE GRID (DIRECTORY) ---
  if (view === 'GRID') {
    return (
      <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 bg-slate-50/50 min-h-screen">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Personnel Grid</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Strategic Field Force
            </p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={fetchStaff} className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-95">
               <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setView('FORM')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" /> Enroll Personnel
            </button>
          </div>
        </div>

        {/* THE TABLE */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          {isLoading && staff.length === 0 ? (
            <div className="p-32 flex flex-col items-center justify-center text-slate-400 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Accessing Directory...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-32 text-center text-slate-400">
              <p className="font-bold text-lg text-slate-900 mb-2">No Personnel Found</p>
              <p className="text-xs uppercase tracking-widest">Enroll your first operative to begin.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Hub</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map((person) => (
                  <tr key={person.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-sm shadow-inner">
                          {person.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{person.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                               <Mail className="w-3 h-3" /> {person.email}
                             </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       {person.shop ? (
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg w-fit shadow-sm">
                           <Building2 className="w-3.5 h-3.5 text-blue-500" /> {person.shop.name}
                         </div>
                       ) : (
                         <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-50 px-2 py-1 rounded">Unassigned</span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                        person.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        person.status === 'SUSPENDED' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${person.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {person.status || 'ACTIVE'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <Link 
                         href={`/dashboard/hr/personnel/${person.id}`}
                         className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
                       >
                         Manage Profile <ChevronRight className="w-3 h-3" />
                       </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER: THE FORM ---
  return <EnrollmentForm onBack={() => setView('GRID')} />;
}

// --- SUB-COMPONENT: ENROLLMENT FORM ---
function EnrollmentForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [shops, setShops] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", 
    role: "SALES_REP", shopId: "", password: "",
    ghanaCard: "", dob: "" 
  });

  // Load Shops for Dropdown
  useEffect(() => {
    const loadShops = async () => {
       const res = await fetch("/api/shops?t=" + Date.now());
       if (res.ok) setShops(await res.json());
    };
    loadShops();
  }, []);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/hr/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setCompleted(true);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      alert("Network Error");
      setIsSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-100">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">ENROLLMENT SUCCESSFUL</h2>
        <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">Personnel synced to Nexus Global Grid</p>
        <button 
          onClick={onBack}
          className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
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
                  <input 
                    required 
                    placeholder="As on Ghana Card" 
                    className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all focus:shadow-md"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    placeholder="official@nexus.com" 
                    className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all focus:shadow-md"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ghana Card ID</label>
                  <input 
                    placeholder="GHA-000000000-0" 
                    className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all focus:shadow-md"
                    value={formData.ghanaCard}
                    onChange={e => setFormData({...formData, ghanaCard: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all focus:shadow-md"
                    value={formData.dob}
                    onChange={e => setFormData({...formData, dob: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    required 
                    placeholder="+233..." 
                    className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all focus:shadow-md"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
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
                  <div className="relative">
                    <select 
                      className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all focus:shadow-md appearance-none"
                      value={formData.shopId}
                      onChange={e => setFormData({...formData, shopId: e.target.value})}
                    >
                      <option value="">-- Unassigned (HQ Pool) --</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                      ))}
                    </select>
                    <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role within Grid</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all focus:shadow-md appearance-none"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="SALES_REP">Sales Representative</option>
                      <option value="ADMIN">Administrator (HQ)</option>
                      <option value="HR_MANAGER">HR Manager</option>
                    </select>
                    <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
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
                <input 
                  required 
                  type="password" 
                  placeholder="Min 8 chars" 
                  className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all focus:shadow-md"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
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
                className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all"
              >
                Next Stage <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Enrollment"}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white sticky top-10 shadow-2xl shadow-slate-900/20">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 text-blue-400">Enrollment Summary</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white/50" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</p>
                  <p className="text-xs font-bold uppercase tracking-wider">Drafting Profile...</p>
                </div>
              </div>

              <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
                 <div className="flex justify-between text-[10px]">
                   <span className="text-white/40 font-bold uppercase">Name</span>
                   <span className="font-bold">{formData.name || "..."}</span>
                 </div>
                 <div className="flex justify-between text-[10px]">
                   <span className="text-white/40 font-bold uppercase">Role</span>
                   <span className="font-bold text-blue-400">{formData.role}</span>
                 </div>
                 <div className="flex justify-between text-[10px]">
                   <span className="text-white/40 font-bold uppercase">Assigned Hub</span>
                   <span className="font-bold text-emerald-400">
                     {shops.find(s => s.id === formData.shopId)?.name || "Unassigned"}
                   </span>
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