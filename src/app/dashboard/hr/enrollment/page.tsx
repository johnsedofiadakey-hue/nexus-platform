"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  UserPlus, Camera, MapPin, FileText, 
  ChevronRight, Loader2, CheckCircle, ArrowLeft, 
  Building2, ShieldCheck, Lock, UploadCloud,
  Calendar, Phone, Mail, Zap
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AddMemberWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATE ---
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [shops, setShops] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "", 
    email: "", 
    phone: "", 
    role: "SALES_REP", 
    shopId: "", 
    password: "password123",
    ghanaCard: "", 
    dob: "",
    image: "" 
  });

  // --- 🛰️ SYNC SHOPS ---
  useEffect(() => {
    async function loadShops() {
      try {
        const res = await fetch('/api/shops/list'); 
        const data = await res.json();
        setShops(Array.isArray(data) ? data : []);
      } catch (e) {
        setShops([]);
      }
    }
    loadShops();
  }, []);

  // --- 📸 PHOTO CAPTURE ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo is too large (Maximum 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
        toast.success("Photo captured!", { icon: '📸' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setCompleted(true);
        toast.success("New member added successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Could not add member.");
      }
    } catch (error) {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignedShopName = useMemo(() => {
    return shops.find(s => s.id === formData.shopId)?.name || "Not Assigned Yet";
  }, [formData.shopId, shops]);

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in zoom-in duration-700 p-10">
        <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-100 border border-emerald-100">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Setup Complete!</h2>
        <p className="text-slate-500 font-medium mt-4">The new team member is now registered and ready to work.</p>
        <button 
          onClick={() => router.push('/dashboard/hr')}
          className="mt-10 px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
        >
          Go back to Team List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 mb-4 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Team
          </button>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Add New Member</h1>
          <div className="flex items-center gap-2 mt-3">
             <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Step {step} of 3: {step === 1 ? 'Identity' : step === 2 ? 'Assignment' : 'Security'}</span>
          </div>
        </div>
        
        {/* PROGRESS BAR */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                step === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 
                step > i ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300'
              }`}>
                {step > i ? <CheckCircle className="w-5 h-5" /> : i}
              </div>
              {i < 3 && <div className="w-8 h-1 bg-slate-100 rounded-full" />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleFinalSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-8">
          
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Photo Upload Area */}
              <div className="flex items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="relative group w-32 h-32 shrink-0">
                  <div className="w-full h-full rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-200" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-xl shadow-lg">
                      <UploadCloud size={16} />
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Profile Photo</h3>
                  <p className="text-sm text-slate-500 mt-1">Upload a clear photo of the new member. This will be used for their profile and ID.</p>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input required placeholder="First & Last Name" className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 ring-blue-500/10 transition-all"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input required type="email" placeholder="email@nexus.com" className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 ring-blue-500/10 transition-all"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ghana Card ID</label>
                    <input placeholder="GHA-..." className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 ring-blue-500/10 transition-all"
                      value={formData.ghanaCard} onChange={e => setFormData({...formData, ghanaCard: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <input type="date" className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 ring-blue-500/10 transition-all"
                      value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input required placeholder="024..." className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 ring-blue-500/10 transition-all"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Shop</label>
                  <select required className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-sm font-bold text-slate-900 appearance-none focus:ring-4 ring-blue-500/10 transition-all"
                    value={formData.shopId} onChange={e => setFormData({...formData, shopId: e.target.value})}
                  >
                    <option value="">-- Select a Shop --</option>
                    {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Member Role</label>
                  <select required className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-sm font-bold text-slate-900 appearance-none focus:ring-4 ring-blue-500/10 transition-all"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="SALES_REP">Sales Representative</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="HR_MANAGER">HR Manager</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm">
                  <Lock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Security Credentials</h4>
                  <p className="text-xs text-blue-700 font-medium">Create a password for the member to log in.</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input required type="text" className="w-full bg-slate-50 border-none h-14 px-6 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 ring-blue-500/10 transition-all shadow-inner"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-all">Previous</button>
            ) : <div />}
            
            <button 
              type={step === 3 ? "submit" : "button"} 
              onClick={() => step < 3 && setStep(step + 1)}
              disabled={isSubmitting}
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-slate-200"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : step === 3 ? "Complete Registration" : "Continue"}
            </button>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-8">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-8">Member Summary</h3>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center">
                {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <UserPlus className="text-slate-200" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 tracking-tight">{formData.name || 'New Member'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formData.role.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="space-y-5">
               <SummaryRow label="Assigned Shop" value={assignedShopName} color="text-blue-600" />
               <SummaryRow label="ID Status" value={formData.ghanaCard ? "ID Provided" : "Missing"} color={formData.ghanaCard ? "text-emerald-500" : "text-slate-400"} />
               <SummaryRow label="Email" value={formData.email || "---"} />
               <SummaryRow label="Security" value={formData.password ? "Access Ready" : "Missing"} color={formData.password ? "text-emerald-500" : "text-rose-500"} />
            </div>

            <div className="mt-10 p-5 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                   "Check all details carefully before adding the member to the local network."
                </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function SummaryRow({ label, value, color = "text-slate-900" }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="font-bold text-slate-400">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}