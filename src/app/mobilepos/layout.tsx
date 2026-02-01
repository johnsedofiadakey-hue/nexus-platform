"use client";

import React from "react";
import { 
  Home, Package, Plus, Settings, Zap, MessageSquare 
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { SessionProvider } from "@/components/Providers/SessionProvider";
import { MobileThemeProvider, useMobileTheme } from "@/context/MobileThemeContext";
// 🛡️ IMPORT THE BACKGROUND TRACKER
import LocationGuard from "@/components/auth/LocationGuard";

/**
 * 📱 MOBILE FRAME WRAPPER
 * This component is the "Source of Truth" for the navigation dock.
 */
function MobileFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { themeClasses } = useMobileTheme();

  const isActive = (path: string) => pathname === path;

  return (
    <div className={`w-full max-w-[480px] h-screen relative shadow-2xl flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses.bg}`}>
      
      {/* 🟢 MAIN CONTENT AREA 
          Fixed height with hidden overflow on parent.
          ✅ UPDATED: Added 'pb-28' (padding-bottom) to ensure content scrolls 
          ABOVE the floating + button so nothing gets hidden behind it.
      */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-28">
        {children}
      </main>

      {/* 📱 THE DOCK (Flex container at bottom) */}
      <div className={`p-4 pb-8 border-t flex justify-around items-end gap-1 shrink-0 z-50 ${themeClasses.nav} ${themeClasses.border}`}>
        
        {/* HUB */}
        <button onClick={() => router.push('/mobilepos')} className="flex flex-col items-center gap-1 group w-14">
          <div className={`p-3 rounded-2xl transition-all active:scale-90 ${isActive('/mobilepos') ? 'bg-blue-600/10' : themeClasses.card}`}>
            <Home size={20} className={isActive('/mobilepos') ? 'text-blue-500' : 'text-slate-400'} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive('/mobilepos') ? 'text-blue-500' : 'text-slate-400'}`}>Hub</span>
        </button>

        {/* STOCK */}
        <button onClick={() => router.push('/mobilepos/inventory')} className="flex flex-col items-center gap-1 group w-14">
          <div className={`p-3 rounded-2xl transition-all active:scale-90 ${isActive('/mobilepos/inventory') ? 'bg-blue-600/10' : themeClasses.card}`}>
            <Package size={20} className={isActive('/mobilepos/inventory') ? 'text-blue-500' : 'text-slate-400'} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive('/mobilepos/inventory') ? 'text-blue-500' : 'text-slate-400'}`}>Stock</span>
        </button>

        {/* ➕ THE ICONIC ACTION BUTTON (Floating) */}
        <div className="relative -top-6">
           <button 
             onClick={() => router.push('/mobilepos/pos')}
             className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-900 text-white shadow-2xl shadow-blue-900/20 active:scale-90 transition-all border-[5px] border-white dark:border-slate-800"
           >
             <Plus size={28} strokeWidth={3} />
           </button>
        </div>

        {/* HQ CHAT */}
        <button onClick={() => router.push('/mobilepos/messages')} className="flex flex-col items-center gap-1 group w-14">
          <div className={`p-3 rounded-2xl transition-all active:scale-90 ${isActive('/mobilepos/messages') ? 'bg-blue-600/10' : themeClasses.card}`}>
            <MessageSquare size={20} className={isActive('/mobilepos/messages') ? 'text-blue-500' : 'text-slate-400'} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive('/mobilepos/messages') ? 'text-blue-500' : 'text-slate-400'}`}>Chat</span>
        </button>

        {/* VIBE / SETTINGS */}
        <button onClick={() => router.push('/mobilepos/settings')} className="flex flex-col items-center gap-1 group w-14">
          <div className={`p-3 rounded-2xl transition-all active:scale-90 ${isActive('/mobilepos/settings') ? 'bg-blue-600/10' : themeClasses.card}`}>
            <Settings size={20} className={isActive('/mobilepos/settings') ? 'text-blue-500' : 'text-slate-400'} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive('/mobilepos/settings') ? 'text-blue-500' : 'text-slate-400'}`}>Vibe</span>
        </button>

      </div>
    </div>
  );
}

/**
 * 🧱 ROOT WRAPPER
 */
export default function MobilePOSLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MobileThemeProvider>
        <div className="min-h-screen bg-slate-950 flex justify-center overflow-hidden">
          {/* 🛡️ GPS GUARD APPLIED HERE */}
          <LocationGuard>
            <MobileFrame>
              {children}
            </MobileFrame>
          </LocationGuard>
        </div>
      </MobileThemeProvider>
    </SessionProvider>
  );
}