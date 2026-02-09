"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Lock, Mail, Loader2, ShieldCheck,
  ChevronRight, ArrowLeft, Eye, EyeOff,
  Smartphone, Building2, Sparkles
} from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * ✨ DYNAMIC GREETING COMPONENT
 * Returns a time-sensitive welcome message + random motivational subtext.
 */
function WelcomeHeader() {
  const [greeting, setGreeting] = useState("Welcome");
  const [quote, setQuote] = useState("Ready to make an impact?");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const quotes = [
      "Ready to achieve greatness today?",
      "Your dedication drives our success.",
      "Let's build the future together.",
      "Efficiency is the soul of business.",
      "Empowering you to do your best work."
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="text-center mb-10 space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-400/50 ring-4 ring-white/90">
          <Building2 className="text-white w-10 h-10" strokeWidth={1.5} />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
        {greeting}, Admin
      </h1>
      <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
        <ShieldCheck size={16} className="text-blue-600" />
        <p className="text-sm tracking-wide">Administrative Control Panel</p>
      </div>
    </div>
  );
}

/**
 * 🔐 LOGIN FORM LOGIC
 */
function SignInForm() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'SELECT' | 'AGENT' | 'HQ'>('SELECT');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Prevents Hydration Mismatch
  useEffect(() => { setMounted(true); }, []);

  // 🛰️ 2. STRICT PORTAL GUARD & AUTO-ROUTING
  useEffect(() => {
    if (status === "authenticated" && session?.user && mounted) {
      const role = (session.user as any).role;
      const isAgentRole = ['WORKER', 'AGENT', 'ASSISTANT'].includes(role);
      const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AUDITOR'].includes(role);

      // 🛡️ ENFORCEMENT RULES
      if (mode === 'AGENT' && !isAgentRole) {
        toast.error("Access Denied: Admin account cannot use Field Agent Portal.");
        // Force sign out if they tried to cross-login
        import("next-auth/react").then(({ signOut }) => signOut({ redirect: false }));
        setMode('SELECT');
        return;
      }

      if (mode === 'HQ' && !isAdminRole) {
        toast.error("Access Denied: Field Agents cannot access HQ Command.");
        import("next-auth/react").then(({ signOut }) => signOut({ redirect: false }));
        setMode('SELECT');
        return;
      }

      // ✅ VALID ACCESS - Redirect
      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl && !callbackUrl.includes("/auth/signin") && !callbackUrl.includes("/auth/error")) {
        window.location.href = callbackUrl;
        return;
      }

      // Redirect to appropriate portal
      if (isAgentRole) {
        toast.success("Uplink Established");
        window.location.href = "/mobilepos";
      } else {
        toast.success("Command Access Granted");
        window.location.href = "/dashboard";
      }
    }
  }, [session, status, mounted, searchParams, mode]);

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
        toast.error("Invalid Credentials. Please check your inputs.");
        setIsSubmitting(false);
      } else if (res?.ok) {
        // Success - session will update and useEffect will handle redirect
        toast.success("Authentication successful!");
        // The useEffect above will handle the redirect once session updates
      } else {
        toast.error("Authentication failed. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Connection Error. Please check your internet connection.");
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  // --- 🌟 SCREEN 1: PORTAL SELECTOR ---
  if (mode === 'SELECT') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <WelcomeHeader />

        <div className="space-y-4">
          {/* AGENT BUTTON */}
          <button
            onClick={() => setMode('AGENT')}
            className="group w-full relative bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98] transition-all text-left flex items-center gap-5 ring-1 ring-slate-100/50"
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
              <Smartphone size={26} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Field Agent</h3>
              <p className="text-xs text-slate-500 font-medium">Mobile POS & Inventory</p>
            </div>
            <ChevronRight className="absolute right-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </button>

          {/* HQ BUTTON */}
          <button
            onClick={() => setMode('HQ')}
            className="group w-full relative bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-[0.98] transition-all text-left flex items-center gap-5 ring-1 ring-slate-100/50"
          >
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
              <Building2 size={26} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">HQ Command</h3>
              <p className="text-xs text-slate-500 font-medium">Admin & Operations</p>
            </div>
            <ChevronRight className="absolute right-6 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-4">
          Secure Nexus 2.4.0
        </p>
      </div>
    );
  }

  // --- 🔐 SCREEN 2: LOGIN FORM ---
  return (
    <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 space-y-8 animate-in slide-in-from-right-12 duration-500 w-full relative overflow-hidden">

      {/* Decorative gradient blur */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMode('SELECT')}
          className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-6 text-sm font-bold"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Portal Select
        </button>

        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          {mode === 'AGENT' ? 'Promoter Login' : 'HQ Access'}
        </h2>
        <p className="text-sm font-medium text-slate-500">
          {mode === 'AGENT' ? 'Enter your promoter credentials below.' : 'Secure administrative login.'}
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              required
              type="email"
              placeholder={mode === 'AGENT' ? "promoter@nexus.com" : "admin@nexus.com"}
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
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
        className={`group w-full h-14 text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-slate-300/50 disabled:opacity-70 disabled:shadow-none ${mode === 'AGENT'
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
          : 'bg-slate-900 hover:bg-black'
          }`}
      >
        {isSubmitting || status === "loading" ? (
          <>
            <Loader2 className="animate-spin w-5 h-5" />
            <span className="opacity-80">Verifying...</span>
          </>
        ) : (
          <>
            {mode === 'AGENT' ? 'Launch Promoter App' : 'Enter Dashboard'}
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

    </form>
  );
}

/**
 * 🏢 PAGE ENTRY
 */
export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FC] flex items-center justify-center p-4 selection:bg-blue-100 relative overflow-hidden">

      {/* 🏛️ Modern Background - Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-sky-100/50 rounded-full blur-[150px] animate-pulse delay-700" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-[150px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-[420px] z-10">
        <Suspense fallback={
          <div className="w-full h-80 bg-white/70 backdrop-blur rounded-[2.5rem] border border-white/50 flex flex-col items-center justify-center gap-4 shadow-xl">
            <Loader2 className="animate-spin text-slate-300" size={32} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Nexus...</span>
          </div>
        }>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}