"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Lock, Mail, Loader2, ShieldCheck,
  ChevronRight, Eye, EyeOff,
  Building2, Smartphone, Zap, TrendingUp, ArrowRight
} from "lucide-react";
import { toast } from "react-hot-toast";

type UserRole = 'ADMIN' | 'PROMOTER';

/**
 * 🎯 ROLE SELECTION SCREEN
 */
function RoleSelector({ onSelectRole }: { onSelectRole: (role: UserRole) => void }) {
  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-400/50 ring-4 ring-white/90">
            <Building2 className="text-white w-12 h-12" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Welcome to Nexus
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Select your role to continue
        </p>
      </div>

      <div className="grid gap-4">
        {/* Admin Button */}
        <button
          onClick={() => onSelectRole('ADMIN')}
          className="group relative bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-900 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/50 active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Admin</h3>
              <p className="text-sm text-slate-600 font-medium">
                Access administrative dashboard
              </p>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" size={24} />
          </div>
        </button>

        {/* Promoter Button */}
        <button
          onClick={() => onSelectRole('PROMOTER')}
          className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-indigo-200 hover:border-indigo-600 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-300/50 active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Smartphone className="text-white w-8 h-8" strokeWidth={2} />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <Zap className="text-white w-3 h-3" fill="currentColor" />
              </div>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Promoter</h3>
              <p className="text-sm text-slate-700 font-medium">
                Access field sales portal
              </p>
            </div>
            <ChevronRight className="text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={24} />
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 font-medium">
        Nexus Platform • Secure Access Portal
      </p>
    </div>
  );
}

/**
 * 🔐 ADMIN LOGIN FORM
 */
function AdminLoginForm({ onBack }: { onBack: () => void }) {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user && mounted) {
      const role = (session.user as any).role;
      const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AUDITOR'].includes(role);

      if (!isAdminRole) {
        toast.error("Access Denied: This is the admin portal.");
        import("next-auth/react").then(({ signOut }) => signOut({ redirect: false }));
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl && !callbackUrl.includes("/auth/signin") && !callbackUrl.includes("/auth/error")) {
        window.location.href = callbackUrl;
        return;
      }

      toast.success("Admin Access Granted");
      window.location.href = "/dashboard";
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
        toast.error("Invalid Credentials. Please check your inputs.");
        setIsSubmitting(false);
      } else if (res?.ok) {
        toast.success("Authentication successful!");
        // Force redirect immediately after successful login
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl && !callbackUrl.includes("/auth/signin") && !callbackUrl.includes("/auth/error")) {
          window.location.href = callbackUrl;
        } else {
          window.location.href = "/dashboard";
        }
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

  return (
    <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 space-y-8 animate-in slide-in-from-right-12 duration-500 w-full max-w-md relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-900 font-medium mb-6 flex items-center gap-2 transition-colors"
        >
          <ChevronRight className="rotate-180" size={16} />
          Back to role selection
        </button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center shadow-xl">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Administrator Login
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Enter your admin credentials to access the dashboard
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              required
              type="email"
              placeholder="admin@nexus.com"
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
        type="submit"
        disabled={isSubmitting || status === "loading"}
        className="group w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-slate-300/50 disabled:opacity-70 disabled:shadow-none"
      >
        {isSubmitting || status === "loading" ? (
          <>
            <Loader2 className="animate-spin w-5 h-5" />
            <span className="opacity-80">Authenticating...</span>
          </>
        ) : (
          <>
            Access Admin Dashboard
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}

/**
 * 📱 PROMOTER LOGIN FORM
 */
function PromoterLoginForm({ onBack }: { onBack: () => void }) {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user && mounted) {
      const role = (session.user as any).role;
      const isPromoterRole = ['WORKER', 'AGENT', 'ASSISTANT'].includes(role);

      if (!isPromoterRole) {
        toast.error("This portal is for Promoters only.");
        import("next-auth/react").then(({ signOut }) => signOut({ redirect: false }));
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/staff";
      window.location.href = callbackUrl;
    }
  }, [status, session, searchParams, mounted]);

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
        toast.error("Invalid credentials. Double-check your info!");
        setIsSubmitting(false);
      } else if (res?.ok) {
        toast.success("Welcome back! 🎉");
        // Force redirect immediately after successful login
        const callbackUrl = searchParams.get("callbackUrl") || "/staff";
        window.location.href = callbackUrl;
      } else {
        toast.error("Login failed. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Connection error. Check your internet.");
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-sm mx-auto space-y-6 animate-in zoom-in-95 duration-500">
      <div className="text-center mb-8 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-indigo-600 hover:text-indigo-900 font-medium mb-4 flex items-center gap-2 transition-colors mx-auto"
        >
          <ChevronRight className="rotate-180" size={16} />
          Back to role selection
        </button>

        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/50">
              <Smartphone className="text-white w-10 h-10" strokeWidth={2} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <Zap className="text-white w-3 h-3" fill="currentColor" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Promoter Login 🎯
          </h1>
          <div className="flex items-center justify-center gap-2 px-4">
            <TrendingUp size={16} className="text-indigo-600" />
            <p className="text-sm text-gray-600 font-medium">Let's make today count!</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleLogin} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl shadow-indigo-500/20 space-y-6 relative overflow-hidden border border-gray-100">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 rounded-full blur-3xl" />

        <div className="relative space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">Email or Phone</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                required
                type="email"
                placeholder="your@email.com"
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-base font-semibold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full h-14 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-2xl text-base font-semibold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 active:scale-95"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status === "loading"}
            className="group w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/40 disabled:opacity-70 disabled:shadow-none disabled:cursor-not-allowed mt-8"
          >
            {isSubmitting || status === "loading" ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Logging you in...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">Forgot password? Contact your supervisor</p>
      </form>
      <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest pt-2">Promoter Portal v2.0</p>
    </div>
  );
}

/**
 * 🏢 MAIN SIGN IN PAGE
 */
function SignInContent() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  if (selectedRole === 'ADMIN') {
    return <AdminLoginForm onBack={() => setSelectedRole(null)} />;
  }

  if (selectedRole === 'PROMOTER') {
    return <PromoterLoginForm onBack={() => setSelectedRole(null)} />;
  }

  return <RoleSelector onSelectRole={setSelectedRole} />;
}

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FC] flex items-center justify-center p-4 selection:bg-blue-100 relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-sky-100/50 rounded-full blur-[150px] animate-pulse delay-700" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-[150px] animate-pulse" />
      </div>

      <div className="relative w-full z-10">
        <Suspense fallback={
          <div className="w-full max-w-md mx-auto h-80 bg-white/70 backdrop-blur rounded-[2.5rem] border border-white/50 flex flex-col items-center justify-center gap-4 shadow-xl">
            <Loader2 className="animate-spin text-slate-300" size={32} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Nexus...</span>
          </div>
        }>
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
}