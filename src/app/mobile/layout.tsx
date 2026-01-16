"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MessageSquare, Menu, ShoppingBag, Bell } from "lucide-react";
import { MobileThemeProvider, useMobileTheme } from "@/context/MobileThemeContext"; 

// 1. INNER COMPONENT (Uses the Theme)
function MobileLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { darkMode, accent, themeClasses } = useMobileTheme();

  // Dynamic Accent Colors for the Active Tab
  const accentColors = {
    blue: "text-blue-600 fill-blue-600/10",
    purple: "text-purple-600 fill-purple-600/10",
    rose: "text-rose-600 fill-rose-600/10",
    amber: "text-amber-500 fill-amber-500/10",
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/mobile" },
    { icon: ShoppingBag, label: "Stock", path: "/mobile/inventory" },
    { icon: PlusCircle, label: "Sell", path: "/mobile/sales", highlight: true },
    { icon: MessageSquare, label: "Chat", path: "/mobile/chat" },
    { icon: Menu, label: "Menu", path: "/mobile/menu" },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 pb-24 ${themeClasses.bg} ${themeClasses.text}`}>
      
      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b flex items-center justify-between px-6 z-50 transition-colors duration-300 ${themeClasses.nav} ${themeClasses.border}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg bg-${accent}-600`}>
            N
          </div>
          <span className={`font-black text-sm tracking-widest uppercase ${themeClasses.text}`}>Nexus<span className={`text-${accent}-600`}>Go</span></span>
        </div>
        <button className={`relative p-2 rounded-full hover:bg-white/10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-20 px-4 animate-in fade-in duration-300">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t h-20 flex items-center justify-around px-2 z-50 pb-2 shadow-lg rounded-t-[2rem] transition-colors duration-300 ${themeClasses.nav} ${themeClasses.border}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          if (item.highlight) {
            return (
              <Link key={item.path} href={item.path} className="flex items-center justify-center -mt-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl border-4 transform transition-transform active:scale-95 bg-${accent}-600 ${darkMode ? "border-slate-900" : "border-white"}`}>
                  <item.icon className="w-7 h-7" />
                </div>
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                isActive ? accentColors[accent].split(" ")[0] : "text-slate-400 hover:text-slate-500"
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? accentColors[accent].split(" ")[1] : ""}`} />
              <span className={`text-[9px] font-bold mt-1 ${isActive ? "opacity-100" : "opacity-0"} transition-opacity`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// 2. MAIN LAYOUT WRAPPER (This fixes the error)
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileThemeProvider>
      <MobileLayoutContent>{children}</MobileLayoutContent>
    </MobileThemeProvider>
  );
}