"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Lock, Mail, Loader2, ShieldAlert,
  ChevronRight, ArrowLeft, Eye, EyeOff, Zap
} from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * 🔐 SUPER_ADMIN EXCLUSIVE LOGIN
 * Separate authentication for SUPER_ADMIN role with enhanced security
 */

function SuperAdminHeader() {
  return (
    <div className="text-center mb-10 space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-400/50 ring-4 ring-white/90">
          <Zap className="text-white w-10 h-10" strokeWidth={2} fill="currentColor" />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
        Super Admin Control
      </h1>
      <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
        <ShieldAlert size={16} className="text-red-600" />
        <p className="text-sm tracking-wide">Global System Administration</p>
      </div>
      <p className="text-xs text-slate-400 font-semibold">Version 2.4.0 - Secure Access Only</p>
    </div>
  );
}

function SuperAdminLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ✅ Verify SUPER_ADMIN role
  useEffect(() => {
    if (status === "authenticated" && session?.user && mounted) {
      const role = (session.user as any).role;

      if (role !== 'SUPER_ADMIN') {
        toast.error("Access Denied: SUPER_ADMIN role required");
        import("next-auth/react").then(({ signOut }) => signOut({ redirect: false }));
        return;
      }

      toast.success("✅ Global Access Granted");
      const callbackUrl = searchParams.get("callbackUrl") || "/super-user";
      window.location.href = callbackUrl;
    }
  }, [session, status, mounted, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password: password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("🔴 Authentication Failed: Invalid credentials or insufficient permissions");
        setIsSubmitting(false);
      } else if (res?.ok) {
        toast.success("✅ Verifying SUPER_ADMIN access...");
        // Session update will trigger useEffect redirect
      } else {
        toast.error("Authentication failed. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Super admin login error:", error);
      toast.error("Connection Error. Please check your internet connection.");
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 space-y-8 animate-in slide-in-from-right-12 duration-500 w-full relative overflow-hidden">

      {/* Decorative gradient blur */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />

      <SuperAdminHeader />

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address (SUPER_ADMIN)</label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={18} />
            <input
              required
              type="email"
              placeholder="super.admin@nexus.com"
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 ring-red-500/10 focus:border-red-500 transition-all placeholder:text-slate-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Master Password</label>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={18} />
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 ring-red-500/10 focus:border-red-500 transition-all placeholder:text-slate-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <button
        disabled={isSubmitting || status === "loading"}
        className="group w-full h-14 text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-red-300/50 disabled:opacity-70 disabled:shadow-none bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
      >
        {isSubmitting || status === "loading" ? (
          <>
            <Loader2 className="animate-spin w-5 h-5" />
            <span className="opacity-80">Authenticating Global Access...</span>
          </>
        ) : (
          <>
            Enter Global Administration
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="pt-6 border-t border-slate-100 space-y-3">
        <p className="text-[10px] text-slate-400 font-semibold text-center uppercase tracking-widest">Security Notice</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
          <p className="text-[11px] font-bold text-red-900 flex items-start gap-2">
            <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
            This portal is restricted to SUPER_ADMIN accounts only and logs all access for security.
          </p>
        </div>
      </div>
    </form>
  );
}

export default function SuperAdminSignInPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FC] flex items-center justify-center p-4 selection:bg-red-100 relative overflow-hidden">

      {/* Modern Background - Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-100/50 rounded-full blur-[150px] animate-pulse delay-700" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-orange-100/50 rounded-full blur-[150px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-[420px] z-10">
        <Suspense fallback={
          <div className="w-full h-80 bg-white/70 backdrop-blur rounded-[2.5rem] border border-white/50 flex flex-col items-center justify-center gap-4 shadow-xl">
            <Loader2 className="animate-spin text-slate-300" size={32} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Global Access Portal...</span>
          </div>
        }>
          <SuperAdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
