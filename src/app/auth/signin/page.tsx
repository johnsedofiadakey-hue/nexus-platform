"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation"; 
import { 
  Lock, Mail, Loader2, ShieldCheck, 
  ChevronRight, ShieldAlert 
} from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * 🔐 SIGN-IN COMPONENT LOGIC
 * High-performance authentication with FORCED navigation to break loops.
 */
function SignInForm() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Prevents Hydration Mismatch
  useEffect(() => { setMounted(true); }, []);

  // 🛰️ 2. FALLBACK AUTO-ROUTING (Just in case the manual redirect misses)
  useEffect(() => {
    if (status === "authenticated" && session?.user && mounted) {
      const role = (session.user as any).role;
      const callbackUrl = searchParams.get("callbackUrl");

      if (callbackUrl && !callbackUrl.includes("/auth/signin")) {
         window.location.href = callbackUrl;
         return;
      }

      // Hard Redirects based on Role
      if (role === "WORKER" || role === "AGENT") {
        window.location.href = "/mobilepos";
      } else {
        window.location.href = "/dashboard";
      }
    }
  }, [session, status, mounted, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Send Credentials
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password: password,
        redirect: false, 
      });

      if (res?.error) {
        toast.error("Identity Rejected: Invalid Credentials");
        setIsSubmitting(false); // Enable button again so you can retry
      } else {
        // ✅ SUCCESS CASE
        toast.success("Uplink Established. Forcing Entry...");

        // 🚀 THE FIX: MANUAL REDIRECT
        // We don't wait for React to "realize" we are logged in. We just go.
        
        // Simple check: If email has "agent" or "worker", go to mobile. Otherwise dashboard.
        if (email.toLowerCase().includes("agent") || email.toLowerCase().includes("worker")) {
             window.location.href = "/mobilepos";
        } else {
             window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      toast.error("Satellite Link Interrupted. Retry login.");
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <form onSubmit={handleLogin} className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Network Identifier</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-all duration-300" size={18} />
            <input 
              required
              type="email" 
              placeholder="agent@nexus.com"
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-slate-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Access Key</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-all duration-300" size={18} />
            <input 
              required
              type="password" 
              placeholder="••••••••"
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-slate-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button 
        disabled={isSubmitting || status === "loading"}
        className="group w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
      >
        {isSubmitting || status === "loading" ? (
          <>
            <Loader2 className="animate-spin w-5 h-5" />
            <span className="opacity-70">Establishing Link...</span>
          </>
        ) : (
          <>
            Initialize Uplink
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 pt-2">
         <ShieldAlert size={12} className="text-slate-300" />
         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">AES-256 Bit Encryption Active</span>
      </div>
    </form>
  );
}

/**
 * 🏢 PAGE ENTRY
 */
export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 selection:bg-blue-100">
      
      {/* 🏛️ SaaS Aesthetics */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-blue-50 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-slate-100 rounded-full blur-[140px]" />
      </div>

      <div className="relative w-full max-w-[440px]">
        
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-200 rotate-3 hover:rotate-0 transition-transform duration-500">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Nexus OS</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-4">Security Credentials Required</p>
        </div>

        <Suspense fallback={
          <div className="w-full h-80 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 shadow-sm">
             <Loader2 className="animate-spin text-slate-200" size={32} />
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Synchronizing Registry...</span>
          </div>
        }>
          <SignInForm />
        </Suspense>

        <div className="mt-12 text-center">
            <button className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-900 transition-all border-b border-transparent hover:border-slate-900 pb-1">
               Lost your Access Key? Contact Systems Admin
            </button>
        </div>

      </div>
    </div>
  );
}