"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
 Lock, Mail, Loader2,
  Eye, EyeOff,
  Smartphone, Zap, TrendingUp, ArrowRight
} from "lucide-react";
import { toast } from "react-hot-toast";

/**  * 📱 MOBILE-FIRST PROMOTER GREETING
 * Native app feel with energetic design for field promoters
 */
function WelcomeHeader() {
  const [greeting, setGreeting] = useState("Welcome");
  const [quote, setQuote] = useState("Let's make today count!");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const quotes = [
      "Let's make today count!",
      "Your hustle powers our success",
      "Time to close those deals! 💪",
      "Be the promoter customers love",
      "Every sale is a victory!"
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="text-center mb-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
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
          {greeting}, Promoter! 🎯
        </h1>
        <div className="flex items-center justify-center gap-2 px-4">
          <TrendingUp size={16} className="text-indigo-600" />
          <p className="text-sm text-gray-600 font-medium">{quote}</p>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
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
      const callbackUrl = searchParams.get("callbackUrl") || "/mobilepos";
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
      <WelcomeHeader />
      <form onSubmit={handleLogin} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl shadow-indigo-500/20 space-y-6 relative overflow-hidden border border-gray-100">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 rounded-full blur-3xl" />
        <div className="relative space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">Email or Phone</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input required type="email" placeholder="your@email.com" className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-base font-semibold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-gray-400" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full h-14 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-2xl text-base font-semibold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-gray-400" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 active:scale-95">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting || status === "loading"} className="group w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/40 disabled:opacity-70 disabled:shadow-none disabled:cursor-not-allowed mt-8">
            {isSubmitting || status === "loading" ? (<><Loader2 className="animate-spin w-5 h-5" /><span>Logging you in...</span></>) : (<><span>Get Started</span><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>)}
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">Forgot password? Contact your supervisor</p>
      </form>
      <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest pt-2">Promoter Portal v2.0</p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 selection:bg-indigo-100 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-200/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-200/40 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>
      <div className="relative w-full z-10">
        <Suspense fallback={<div className="w-full max-w-sm mx-auto h-96 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 flex flex-col items-center justify-center gap-4 shadow-2xl"><Loader2 className="animate-spin text-indigo-400" size={40} /><span className="text-sm font-bold text-gray-500">Loading...</span></div>}>
          <SignInForm />
</Suspense>
      </div>
    </div>
  );
}
