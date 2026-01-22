"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - MASTER MOBILE LAYOUT
 * VERSION: 26.1.0 (SYSTEM-WIDE THEME SYNC)
 * --------------------------------------------------------------------------
 * FEATURES:
 * 1. GLOBAL THEME SYNC: Background, Nav, and Accent colors update everywhere.
 * 2. NOTIFICATION ENGINE: Real-time unread counts with audio/haptic cues.
 * 3. DYNAMIC SHELL: Managed Header and Bottom Navigation for all sub-pages.
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  PlusCircle, 
  MessageSquare, 
  ShoppingBag, 
  Bell, 
  UserCircle 
} from "lucide-react";
import { MobileThemeProvider, useMobileTheme } from "@/context/MobileThemeContext"; 

// 🎨 ACCENT MAP: Translates theme state into live CSS Hex codes
const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706"
  };
  return colors[color] || colors.blue;
};

function MobileLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { darkMode, accent, themeClasses } = useMobileTheme();
  const accentHex = getColorHex(accent);
  
  // 🔔 NOTIFICATION STATE
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔊 NOTIFICATION & HAPTIC ENGINE
  useEffect(() => {
    const checkNewMessages = async () => {
      try {
        const res = await fetch(`/api/mobile/messages/unread-count?t=${Date.now()}`); 
        if (res.ok) {
          const { count } = await res.json();
          
          if (count > unreadCount) {
            // Audio Feedback
            const audio = new Audio("/sounds/notification.mp3"); 
            audio.play().catch(() => {});
            
            // Haptic Feedback (Vibration)
            if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
          }
          setUnreadCount(count);
        }
      } catch (e) {
        // Silent fail to maintain stealth
      }
    };

    const interval = setInterval(checkNewMessages, 5000); 
    return () => clearInterval(interval);
  }, [unreadCount]);

  // Reset notification badge if user enters chat
  useEffect(() => {
    if (pathname === "/mobilepos/messages") setUnreadCount(0);
  }, [pathname]);

  // 🧭 MASTER NAVIGATION DEFINITION
  const navItems = [
    { icon: Home, label: "Home", path: "/mobilepos" },
    { icon: ShoppingBag, label: "Stock", path: "/mobilepos/inventory" },
    { icon: PlusCircle, label: "Sell", path: "/mobilepos/pos", highlight: true },
    { icon: MessageSquare, label: "Chat", path: "/mobilepos/messages", badge: unreadCount },
    { icon: UserCircle, label: "Settings", path: "/mobilepos/settings" },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 flex flex-col ${themeClasses.bg} ${themeClasses.text}`}>
      
      {/* 🏗️ DYNAMIC BRAND HEADER */}
      <header className={`fixed top-0 left-0 right-0 h-16 backdrop-blur-lg border-b flex items-center justify-between px-6 z-40 transition-all ${themeClasses.nav} ${themeClasses.border}`}>
        <div className="flex items-center gap-2">
          {/* Logo responds to Accent Color */}
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg transition-transform active:scale-90"
            style={{ backgroundColor: accentHex, boxShadow: `0 4px 12px ${accentHex}40` }}
          >
            N
          </div>
          <span className={`font-black text-xs tracking-[0.2em] uppercase ${themeClasses.text}`}>NexusGo</span>
        </div>
        
        <button className="relative p-2 group active:scale-90 transition-transform">
          <Bell className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm" />
          )}
        </button>
      </header>

      {/* 📱 VIEWPORT: Renders children pages (POS, Inventory, etc.) */}
      <main className="flex-1 pt-20 px-4 pb-32 overflow-x-hidden">
        {children}
      </main>

      {/* 🧭 SYSTEM-WIDE NAVIGATION BAR */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t h-20 flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-t-[2.5rem] transition-all duration-500 ${themeClasses.nav} ${themeClasses.border}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center justify-center relative w-14 h-14 rounded-2xl transition-all duration-300 ${
                item.highlight 
                  ? `-mt-12 w-16 h-16 rounded-full text-white active:scale-90` 
                  : (isActive ? `scale-110` : "text-slate-400 hover:text-slate-500")
              }`}
              style={
                item.highlight 
                  ? { backgroundColor: accentHex, boxShadow: `0 12px 24px -6px ${accentHex}60` } 
                  : isActive ? { color: accentHex } : {} 
              }
            >
              <item.icon className={item.highlight ? "w-7 h-7" : "w-6 h-6"} strokeWidth={isActive ? 2.5 : 2} />
              
              {/* NOTIFICATION BADGE (for Chat/Stock) */}
              {!item.highlight && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {item.badge}
                </span>
              )}

              <span className={`text-[8px] font-black uppercase mt-1 tracking-tighter transition-all duration-300 ${isActive && !item.highlight ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"} ${item.highlight ? "hidden" : ""}`}>
                {item.label}
              </span>

              {/* ACTIVE DOT INDICATOR */}
              {isActive && !item.highlight && (
                <div 
                  className="absolute -bottom-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: accentHex }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ROOT WRAPPER: Injects the Theme Provider into the entire tree
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileThemeProvider>
      <MobileLayoutContent>{children}</MobileLayoutContent>
    </MobileThemeProvider>
  );
}