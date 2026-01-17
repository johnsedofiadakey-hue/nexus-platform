"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Attempt Login
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false, // We will handle redirection manually
      });

      if (result?.error) {
        setError("Invalid credentials. Access denied.");
        setIsLoading(false);
        return;
      }

      // 2. Login Successful - Now, let's find out WHO this is.
      // We assume the session is now set. We verify the role by calling a quick check.
      // (Alternatively, we can just fetch the session client-side, but this is faster)
      
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (!session || !session.user) {
        setError("Session failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // 3. THE TRAFFIC COP LOGIC 👮‍♂️
      const role = session.user.role;

      if (role === "ADMIN" || role === "SUPER_USER" || role === "HR_MANAGER") {
        // Commanders go to the Dashboard
        router.push("/dashboard"); 
      } else {
        // Field Agents go to the Mobile App
        router.push("/mobile/sales"); 
      }

    } catch (err) {
      console.error(err);
      setError("System connection error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Nexus Terminal</h1>
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-[0.3em] mt-2">Secure Access Gateway</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
                <Lock className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational ID (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                <input 
                  type="email" 
                  required
                  placeholder="name@nexus.com"
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Security Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                "Initialize Session"
              )}
            </button>

          </form>
        </div>
        
        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold">
            Restricted System • Authorized Personnel Only
          </p>
        </div>

      </div>
    </div>
  );
}