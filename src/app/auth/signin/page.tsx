"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, Key, AlertCircle } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        setError("Access Denied: Invalid Credentials");
        setIsLoading(false);
      } else {
        // Force redirect to Dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("System Error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-50" />
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50 relative z-10">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1 uppercase tracking-tight relative z-10">Nexus Portal</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] relative z-10">Secure Command Gateway</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wide">{error}</p>
            </div>
          )}

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational ID</label>
             <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email"
                  required
                  placeholder="operative@nexus.com"
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Security Key</label>
             <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
             </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate Identity"}
          </button>

          <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-wider pt-4">
             Restricted Access • LG Operations Ghana
          </p>

        </form>
      </div>
    </div>
  );
}