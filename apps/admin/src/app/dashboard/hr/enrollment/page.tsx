"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  UserPlus, Camera, CheckCircle, ArrowLeft,
  Building2, Lock, UploadCloud,
  Mail, ShieldCheck, Info, User, Smartphone,
  Fingerprint, Sparkles, ShieldAlert, ChevronRight, Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AddMemberWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [shops, setShops] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "WORKER",
    shopId: "",
    password: "nexus_password_2026",
    ghanaCard: "",
    dob: "",
    image: "",
    bankAccountName: "",
    bankName: "",
    bankAccountNumber: "",
    ssnitNumber: "",
    commencementDate: ""
  });

  useEffect(() => {
    async function loadShops() {
      try {
        const res = await fetch('/api/shops/list');
        const data = await res.json();
        setShops(Array.isArray(data) ? data : (data.data || []));
      } catch (e) {
        setShops([]);
      }
    }
    loadShops();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Security Scan Failed: File too large (Max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
        toast.success("Biometric Scan Ready");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ AUDIT FIX: PRE-FLIGHT VALIDATION
    if (!formData.shopId) {
      toast.error("Sector Assignment Required");
      setStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      // 🛡️ CRASH FIX: Standardized Date handling
      let safeIsoDate = null;
      if (formData.dob) {
        const dateObj = new Date(formData.dob);
        if (!isNaN(dateObj.getTime())) {
          safeIsoDate = dateObj.toISOString();
        }
      }

      const payload = {
        ...formData,
        dob: safeIsoDate,
        email: formData.email.toLowerCase().trim(),
        // 🛡️ AUDIT FIX: Ensure empty strings don't break database relations
        shopId: formData.shopId || null
      };

      const res = await fetch("/api/hr/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (res.ok) {
        setCompleted(true);
        toast.success("Personnel Uplink Established");
      } else {
        console.error("🏁 ENROLLMENT_TERMINAL_REJECTION:", responseData);
        toast.error(responseData.error || "Uplink Rejected by Terminal. Cross-check access credentials.");
      }
    } catch (error: any) {
      console.error("🚨 ENROLLMENT_NETWORK_CRITICAL:", error);
      toast.error(`Connection Error: ${error.message || "Shield Breach Detected"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignedShopName = useMemo(() => {
    return shops.find(s => s.id === formData.shopId)?.name || "Unassigned";
  }, [formData.shopId, shops]);

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-500 p-12 bg-white rounded-xl border border-slate-200 shadow-sm m-6">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Registration Successful</h2>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto">
          Promoter {formData.name} has been enrolled and synced with the {assignedShopName} hub.
        </p>
        <button
          onClick={() => router.push('/dashboard/hr')}
          className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-all active:scale-95"
        >
          Return to Team Management
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in duration-700">

      {/* PROFESSIONAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 border-b border-slate-200 pb-8 gap-6">
        <div>
          <button onClick={() => router.back()} className="group flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-900 mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Directory
          </button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Enroll New Personnel</h1>
          <p className="text-slate-500 text-sm mt-1">Initialize secure promoter credentials for hub deployment.</p>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${step === i ? 'bg-slate-900 border-slate-900 text-white' :
                step > i ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-200 text-slate-300'
                }`}>
                {step > i ? <CheckCircle className="w-4 h-4" /> : i}
              </div>
              {i < 4 && <div className={`w-6 h-[2px] mx-1 ${step > i ? 'bg-slate-900' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleFinalSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        <div className="lg:col-span-8 space-y-10">

          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-start gap-8">
                <div className="relative group shrink-0">
                  <div className="w-32 h-32 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-inner" onClick={() => fileInputRef.current?.click()}>
                    {formData.image ? (
                      <img src={formData.image} alt="Agent" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Profile Identification</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs">Upload a professional headshot. This biometric data is used for secure terminal authentication.</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest mt-2 block">
                    {formData.image ? 'Change Photo' : 'Upload Image'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <InputGroup label="Full Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} placeholder="e.g. John Doe" />
                <InputGroup label="Corporate Email" type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} placeholder="j.doe@nexus.com" />
                <InputGroup label="Ghana Card PIN" value={formData.ghanaCard} onChange={v => setFormData({ ...formData, ghanaCard: v })} placeholder="GHA-000000000-0" />
                <InputGroup label="Date of Birth" type="date" value={formData.dob} onChange={v => setFormData({ ...formData, dob: v })} />
                <div className="md:col-span-2">
                  <InputGroup label="Contact Number" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} placeholder="+233..." />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Hub</label>
                  <select required className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                    value={formData.shopId} onChange={e => setFormData({ ...formData, shopId: e.target.value })}
                  >
                    <option value="">Select Operational Hub</option>
                    {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Deployment Role</label>
                  <select required className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="WORKER">Standard Promoter (POS)</option>
                    <option value="ADMIN">System Administrator</option>
                    <option value="SUPER_ADMIN">Executive HQ</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex gap-3 items-center">
                <ShieldCheck className="text-slate-400 w-4 h-4" />
                <p className="text-[11px] text-slate-500 font-medium">Role assignment dictates geofencing restrictions and terminal permissions.</p>
              </div>
            </div>
          )}



          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">Banking Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Bank Name" value={formData.bankName} onChange={v => setFormData({ ...formData, bankName: v })} placeholder="e.g. EcoBank" />
                  <InputGroup label="Account Number" value={formData.bankAccountNumber} onChange={v => setFormData({ ...formData, bankAccountNumber: v })} placeholder="0000000000" />
                  <div className="md:col-span-2">
                    <InputGroup label="Account Name" value={formData.bankAccountName} onChange={v => setFormData({ ...formData, bankAccountName: v })} placeholder="Name on Account" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">Statutory Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="SSNIT Number" value={formData.ssnitNumber} onChange={v => setFormData({ ...formData, ssnitNumber: v })} placeholder="SSNIT #" />
                  <InputGroup label="Commencement Date" type="date" value={formData.commencementDate} onChange={v => setFormData({ ...formData, commencementDate: v })} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">Security Credentials</h4>
                <p className="text-xs text-slate-500 mt-1">This key will be required for the promoter's first terminal initialization.</p>
                <div className="mt-6">
                  <InputGroup label="Access Password" value={formData.password} onChange={v => setFormData({ ...formData, password: v })} type="text" />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-8">
            <button
              type="button"
              onClick={() => step > 1 && setStep(step - 1)}
              className={`text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0' : 'opacity-100'}`}
            >
              Go Back
            </button>

            <button
              type={step === 4 ? "submit" : "button"}
              onClick={() => step < 4 && setStep(step + 1)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 4 ? "Confirm Enrollment" : "Continue"}
              {step < 4 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm sticky top-10">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-8">Enrollment Summary</h3>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <User className="text-slate-200 w-6 h-6" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{formData.name || 'New Personnel'}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide truncate">{formData.role}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <SummaryItem label="Sector" value={assignedShopName} />
              <SummaryItem label="Verification" value={formData.ghanaCard ? 'Validated' : 'Pending'} />
              <SummaryItem label="Signal Status" value={formData.phone ? 'Link Ready' : 'Awaiting'} />
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex gap-2 items-start opacity-60">
              <ShieldAlert className="w-3 h-3 text-slate-400 mt-0.5" />
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter leading-tight">
                Data is encrypted and synced with the central Nexus operative database.
              </p>
            </div>
          </div>
        </div>
      </form >
    </div >
  );
}

function InputGroup({ label, value, onChange, placeholder = "", type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        required
        type={type}
        placeholder={placeholder}
        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 ring-slate-900/5 focus:border-slate-900 transition-all outline-none placeholder:text-slate-300 shadow-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="font-semibold text-slate-400 uppercase tracking-tighter">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}