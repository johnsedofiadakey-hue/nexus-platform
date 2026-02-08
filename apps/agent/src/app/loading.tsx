"use client";

import { motion } from "framer-motion";
import { Briefcase, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-[9999] flex flex-col items-center justify-center">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/30 blur-[120px] rounded-full" />

      <div className="relative flex flex-col items-center">
        {/* Animated Brand Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200 mb-8"
        >
          <Briefcase className="w-8 h-8 text-white" />
        </motion.div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] ml-1">
            Nexus <span className="text-blue-600">Operations</span>
          </h2>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Synchronizing Intelligence...</span>
          </div>
        </div>

        {/* Professional Progress Bar */}
        <div className="mt-8 w-48 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-full h-full bg-gradient-to-r from-transparent via-blue-600 to-transparent"
          />
        </div>
      </div>

      {/* Security Footer */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Encrypted Connection Active</span>
        </div>
        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Stormglide Logistics Platform v1.0</p>
      </div>
    </div>
  );
}