"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react"; // SessionProvider removed (it's in root layout now)
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShoppingBag, LogOut,
  ShieldCheck, Menu, Building2, ChevronRight,
  MessageSquare, Loader2, Bell, Settings, FileText, RefreshCw
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import CommandPalette from "@/components/CommandPalette";

// 🚀 NAVIGATION MAP
const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Building2, label: "Stores", path: "/dashboard/shops" },
  { icon: Users, label: "Team", path: "/dashboard/hr" },
  { icon: ShoppingBag, label: "Inventory", path: "/dashboard/inventory" },
  { icon: FileText, label: "Sales Register", path: "/dashboard/sales" }, // 🆕 ADDED
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { data: session, status: authStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // 3. ⏳ LOADING STATE: Show a clean spinner while checking session
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <CommandPalette />
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">

          {/* BRANDING */}
          <div className="h-20 flex items-center px-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20"
                style={{ backgroundColor: theme.primaryColor || '#0f172a' }}
              >
                {theme.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={theme.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 block leading-none">{theme.name || 'NEXUS'}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 block">Enterprise</span>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4 py-8 space-y-1">
            <p className="px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</p>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => { if (pathname !== item.path) setNavigatingTo(item.path) }}
                  // Dynamic Active State
                  className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-slate-900/5 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                  {item.label === "Inventory" && <span className="ml-auto w-2 h-2 rounded-full bg-rose-500"></span>}
                  {navigatingTo === item.path && <Loader2 className="absolute right-4 w-3.5 h-3.5 animate-spin text-slate-400" />}
                </Link>
              );
            })}
            <p className="px-4 pt-8 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intelligence</p>
            <Link
              href="/dashboard/reports"
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/reports'
                ? "bg-slate-900/5 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <FileText className={`w-4 h-4 transition-colors ${pathname === '/dashboard/reports' ? 'text-blue-600' : 'text-slate-400'}`} />
              Field Reports
            </Link>
          </nav>

          {/* EXIT STRATEGY */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* --- PRIMARY WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* HEADER */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="hover:text-slate-900 cursor-pointer transition-colors">Nexus</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 capitalize">{pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95 group/refresh ${isRefreshing ? 'opacity-70 cursor-wait' : ''}`}
              title="Refresh Global Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 group-hover/refresh:text-blue-500 transition-colors ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/refresh:text-slate-900">
                {isRefreshing ? 'Refreshing...' : 'Sync'}
              </span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            {/* Dynamic System Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/5 rounded-full border border-slate-900/5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Secure</span>
            </div>

            <div className="h-8 w-px bg-slate-200"></div>

            <NotificationBell />
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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