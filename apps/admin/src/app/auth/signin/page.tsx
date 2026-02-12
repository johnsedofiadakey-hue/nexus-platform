"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Users, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type Role = "ADMIN" | "PROMOTER";

export default function UnifiedSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>("ADMIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check for errors in URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "CredentialsSignin") {
      toast.error("Invalid email or password");
    } else if (error) {
      toast.error("An authentication error occurred");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password: password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error === "CredentialsSignin" ? "Invalid credentials" : "Login failed");
        setIsSubmitting(false);
      } else if (result?.ok) {
        // 🛡️ STRICT ROLE VALIDATION
        // We need to fetch the session briefly to check the role before final redirect
        // or rely on a quick check. Since we are using client-side signIn, 
        // we can fetch the session now.
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const userRole = sessionData?.user?.role;

        const isPromoterRole = ['WORKER', 'AGENT', 'ASSISTANT'].includes(userRole);
        const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AUDITOR'].includes(userRole);

        // Check for mismatch
        if (role === "ADMIN" && !isAdminRole) {
          toast.error("Access Denied: This account does not have Admin privileges.");
          setIsSubmitting(false);
          return;
        }

        if (role === "PROMOTER" && !isPromoterRole) {
          toast.error("Access Denied: This account is not authorized for Promoter access.");
          setIsSubmitting(false);
          return;
        }

        setSuccess(true);
        toast.success(`Welcome back, ${role === "ADMIN" ? "Admin" : "Promoter"}!`);

        // Deterministic redirect
        const destination = role === "ADMIN" ? "/dashboard" : "/mobilepos";

        // Allow some time for the success animation
        setTimeout(() => {
          window.location.href = destination;
        }, 800);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Connection error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-700 ${role === "ADMIN"
      ? "bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"
      : "bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900"
      }`}>
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-colors duration-700 ${role === "ADMIN" ? "bg-blue-500" : "bg-emerald-500"
          }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-colors duration-700 ${role === "ADMIN" ? "bg-purple-500" : "bg-cyan-500"
          }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="inline-block p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 mb-4"
          >
            <div className="text-white font-black text-2xl tracking-tighter">NEXUS</div>
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Intelligence Platform</h1>
          <p className="text-white/60 mt-2">Strategic field operations management</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-1 border border-white/10 shadow-2xl">
          <div className="bg-white rounded-[1.4rem] p-8 shadow-inner overflow-hidden relative">
            {/* Success Overlay */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center text-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <CheckCircle2 className={`w-20 h-20 mb-4 ${role === "ADMIN" ? "text-blue-600" : "text-emerald-600"}`} />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                  <p className="text-gray-500 mt-2">Preparing your workspace...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role Selector */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
              <button
                onClick={() => setRole("ADMIN")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${role === "ADMIN"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Shield size={16} />
                Administrator
              </button>
              <button
                onClick={() => setRole("PROMOTER")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${role === "PROMOTER"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Users size={16} />
                Promoter
              </button>
            </div>

            {/* Title Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900">
                {role === "ADMIN" ? "Admin Access" : "Field Operations"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {role === "ADMIN"
                  ? "Enterprise management and analytics dashboard"
                  : "Mobile POS and inventory management system"
                }
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                  Identity / Email
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@nexus-platform.com"
                    required
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                  Security Key
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || success}
                className={`w-full group relative flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none ${role === "ADMIN"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/25"
                  }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Enter {role === "ADMIN" ? "Dashboard" : "Mobile POS"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-8 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/40 px-2">
          <span>v2.1.0 Intelligence Sync</span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </span>
        </div>
      </motion.div>
    </div>
  );
}