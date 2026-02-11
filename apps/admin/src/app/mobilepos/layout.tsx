"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { SessionProvider as AuthProvider } from "@/components/providers/SessionProvider";
import { MobileThemeProvider, useMobileTheme } from "@/context/MobileThemeContext";
import { MobileDataProvider } from "@/context/MobileDataContext";
import LocationGuard from "@/components/auth/LocationGuard";
import SyncManager from "@/components/mobile/SyncManager";
import LeaveLockout from "@/components/mobile/LeaveLockout";
import GeoLockoutOverlay from "@/components/mobile/GeoLockoutOverlay";
import { PWAInstallPrompt } from "@/components/mobile/PWAInstallPrompt";
import { useEffect, useState } from "react";
import { Loader2, Plus, Home, Package, MessageSquare, Menu } from "lucide-react";
import { registerServiceWorker, requestPersistentStorage } from "@/lib/pwa-register";

/**
 * 📱 MOBILE FRAME WRAPPER
 * High-End SaaS Overhaul + PWA Support
 */
function MobileFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { themeClasses } = useMobileTheme();
  const [lockout, setLockout] = useState<{ active: boolean; returnDate?: string }>({ active: false });
  const [geoConfig, setGeoConfig] = useState<{ lat: number; lng: number; radius: number; bypass: boolean } | null>(null);

  useEffect(() => {
    // 🚀 Register PWA service worker
    registerServiceWorker();
    requestPersistentStorage();

    // Note: Init data now comes from MobileDataContext
    // We just need to setup geo config from the context
  }, []);

  // ✅ FIX: lockout is now initialized to {active: false} instead of null
  // This prevents the infinite loading loop
  if (lockout.active) {
    return <LeaveLockout returnDate={lockout.returnDate!} />;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className={`w-full max-w-[480px] h-screen relative flex flex-col overflow-hidden transition-all duration-500 bg-slate-50 dark:bg-slate-900 mx-auto shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 overscroll-none select-none`}>

      {/* 🔴 Status Bar Area (Visual Only) */}
      <div className="h-2 w-full bg-transparent z-50 shrink-0" />

      {/* 🔒 GEO LOCKOUT (Client Side Guard) */}
      {geoConfig && (
        <GeoLockoutOverlay
          shopLat={geoConfig.lat}
          shopLng={geoConfig.lng}
          radius={geoConfig.radius}
          bypass={geoConfig.bypass}
        />
      )}

      {/* 🟢 MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-32">
        <SyncManager />
        {children}
      </main>

      {/* 📱 THE DOCK (Floating Glass) */}
      <div className="absolute bottom-6 left-4 right-4 h-20 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] backdrop-blur-xl flex justify-between items-center px-6 z-50">

        {/* HUB */}
        <button onClick={() => router.push('/mobilepos')} className="group flex flex-col items-center gap-1 transition-all">
          <div className={`p-2 rounded-full transition-all duration-300 ${isActive('/mobilepos') ? 'bg-blue-100 text-blue-600 translate-y-[-4px]' : 'text-slate-400'}`}>
            <Home size={22} className={isActive('/mobilepos') ? 'fill-blue-600' : ''} />
          </div>
          {isActive('/mobilepos') && <span className="w-1 h-1 rounded-full bg-blue-600 animate-in fade-in" />}
        </button>

        {/* STOCK */}
        <button onClick={() => router.push('/mobilepos/inventory')} className="group flex flex-col items-center gap-1 transition-all">
          <div className={`p-2 rounded-full transition-all duration-300 ${isActive('/mobilepos/inventory') ? 'bg-blue-100 text-blue-600 translate-y-[-4px]' : 'text-slate-400'}`}>
            <Package size={22} className={isActive('/mobilepos/inventory') ? 'fill-blue-600' : ''} />
          </div>
          {isActive('/mobilepos/inventory') && <span className="w-1 h-1 rounded-full bg-blue-600 animate-in fade-in" />}
        </button>

        {/* ➕ ACTION BUTTON (Floating Gradient) */}
        <div className="relative -top-8">
          <button
            onClick={() => router.push('/mobilepos/pos')}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--nexus-primary)] text-white shadow-2xl shadow-blue-900/30 active:scale-90 transition-all border-[4px] border-white dark:border-slate-800"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        {/* HQ CHAT */}
        <button onClick={() => router.push('/mobilepos/messages')} className="group flex flex-col items-center gap-1 transition-all">
          <div className={`p-2 rounded-full transition-all duration-300 ${isActive('/mobilepos/messages') ? 'bg-blue-100 text-blue-600 translate-y-[-4px]' : 'text-slate-400'}`}>
            <MessageSquare size={22} className={isActive('/mobilepos/messages') ? 'fill-blue-600' : ''} />
          </div>
          {isActive('/mobilepos/messages') && <span className="w-1 h-1 rounded-full bg-blue-600 animate-in fade-in" />}
        </button>

        {/* MENU */}
        <button onClick={() => router.push('/mobilepos/settings')} className="group flex flex-col items-center gap-1 transition-all">
          <div className={`p-2 rounded-full transition-all duration-300 ${isActive('/mobilepos/settings') ? 'bg-blue-100 text-blue-600 translate-y-[-4px]' : 'text-slate-400'}`}>
            <Menu size={22} />
          </div>
          {isActive('/mobilepos/settings') && <span className="w-1 h-1 rounded-full bg-blue-600 animate-in fade-in" />}
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
    <AuthProvider>
      <MobileThemeProvider>
        <MobileDataProvider>
          <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center items-center overflow-hidden font-sans antialiased selection:bg-blue-100">
            {/* 🛡️ GPS GUARD APPLIED HERE */}
            <LocationGuard>
              <MobileFrame>
                {children}
              </MobileFrame>
            </LocationGuard>

            {/* 📲 PWA INSTALL PROMPT */}
            <PWAInstallPrompt />
          </div>
        </MobileDataProvider>
      </MobileThemeProvider>
    </AuthProvider>
  );
}