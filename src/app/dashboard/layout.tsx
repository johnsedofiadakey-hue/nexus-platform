"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react"; // SessionProvider removed (it's in root layout now)
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShoppingBag, LogOut,
  ShieldCheck, Menu, Building2, ChevronRight,
  MessageSquare, Loader2, Bell, Settings
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import NotificationBell from "@/components/dashboard/NotificationBell";

// 🚀 NAVIGATION MAP
const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Building2, label: "Stores", path: "/dashboard/shops" },
  { icon: Users, label: "Team", path: "/dashboard/hr" },
  { icon: ShoppingBag, label: "Inventory", path: "/dashboard/inventory" },
  // { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" }, // REMOVED
  { icon: Settings, label: "Settings", path: "/dashboard/settings" }, // ADDED
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { data: session, status: authStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // 1. 🛡️ AUTH GUARD: Redirect logic must be inside useEffect to prevent render crashes
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [authStatus, router]);

  // 2. 🧹 NAVIGATION CLEANUP: Close sidebar on mobile when route changes
  useEffect(() => {
    setNavigatingTo(null);
    setSidebarOpen(false);
  }, [pathname]);

  // 3. ⏳ LOADING STATE: Show a clean spinner while checking session
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verifying Credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased font-sans">

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-slate-200 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">

          {/* BRANDING */}
          <div className="p-8 flex items-center gap-4 border-b border-slate-100">
            <div
              className="p-2.5 rounded-xl shadow-lg shadow-slate-200 transition-colors duration-500"
              style={{ backgroundColor: theme.secondaryColor }}
            >
              {theme.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={theme.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <span className="font-black text-lg text-slate-900 block tracking-tight uppercase leading-none">{theme.name || 'Nexus'}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1 block"
                style={{ color: theme.primaryColor }}
              >
                Command
              </span>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            <p className="px-4 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational</p>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => { if (pathname !== item.path) setNavigatingTo(item.path) }}
                  // Dynamic Active State
                  className={`relative flex items-center gap-4 px-5 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${isActive
                    ? "text-white shadow-xl shadow-slate-200 translate-x-1"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  style={isActive ? { backgroundColor: theme.primaryColor } : {}}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                  {item.label}
                  {navigatingTo === item.path && <Loader2 className="absolute right-5 w-3 h-3 animate-spin text-white" />}
                </Link>
              );
            })}
          </nav>

          {/* EXIT STRATEGY */}
          <div className="p-6 border-t border-slate-100">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 transition-all active:scale-95 border border-slate-200 hover:border-rose-100"
            >
              <LogOut className="w-3 h-3" /> System Exit
            </button>
          </div>
        </div>
      </aside>

      {/* --- PRIMARY WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-10 z-20 sticky top-0">
          <div className="flex items-center gap-6">
            <button className="lg:hidden p-3 hover:bg-slate-100 rounded-2xl transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span
                className="cursor-pointer transition-colors hover:opacity-80"
                style={{ color: theme.secondaryColor }}
              >
                {theme.name || 'Terminal'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-900">{pathname.split('/').pop()?.replace(/-/g, ' ') || 'Summary'}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Dynamic System Status */}
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Encrypted Uplink Active</span>
            </div>

            <NotificationBell />
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-10 scroll-smooth">
          <div className="max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardContent>{children}</DashboardContent>
    </ThemeProvider>
  );
}