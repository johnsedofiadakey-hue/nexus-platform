"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate with NextAuth
      // We set redirect: false so we can control the navigation manually below
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false, 
      });

      if (result?.error) {
        setError("Invalid ID or Access Code.");
        toast.error("Access Denied");
        setLoading(false);
        return;
      }

      // 2. Check User Role to Redirect Correctly
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      
      // Force a refresh so the Sidebar/Nav updates immediately
      router.refresh();

      if (session?.user?.role === "SALES_REP") {
        toast.success("Welcome, Agent");
        router.push("/mobilepos"); // 📱 Sent to Mobile Interface
      } else {
        toast.success("Welcome, Commander");
        router.push("/dashboard"); // 💻 Sent to Admin Command Center
      }

    } catch (error) {
      console.error(error);
      setError("Connection failed. Check internet.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* LOGO HEADER */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-slate-900/20">
            <ShieldCheck size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Nexus Access</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Secure Gateway v26.2</p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="space-y-1">
            <input 
              type="email" 
              placeholder="Operator ID (Email)" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-400"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <input 
              type="password" 
              placeholder="Access Code" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-400"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 rounded-xl flex items-start gap-3 text-red-600 animate-in zoom-in duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Authenticate</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase">
             Unauthorized Access is Prohibited
           </p>
        </div>

      </div>
    </div>
  );
}