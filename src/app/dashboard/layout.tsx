"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react"; // SessionProvider removed (it's in root layout now)
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, ShoppingBag, LogOut, 
  ShieldCheck, Menu, Building2, ChevronRight, 
  MessageSquare, Loader2, Bell
} from "lucide-react";

// 🚀 NAVIGATION MAP
const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Building2, label: "Stores", path: "/dashboard/shops" },
  { icon: Users, label: "Team", path: "/dashboard/hr" }, 
  { icon: ShoppingBag, label: "Inventory", path: "/dashboard/inventory" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-[#0F172A] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          
          {/* BRANDING */}
          <div className="p-10 flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-black text-lg text-white block tracking-tighter uppercase leading-none">Nexus</span>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mt-1 block">Command</span>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-6 space-y-2">
            <p className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Main Menu</p>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  onClick={() => { if(pathname !== item.path) setNavigatingTo(item.path) }}
                  className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive 
                    ? "bg-white text-[#0F172A] shadow-2xl shadow-black/10 scale-[1.02]" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  {item.label}
                  {navigatingTo === item.path && <Loader2 className="absolute right-5 w-3 h-3 animate-spin text-blue-500" />}
                </Link>
              );
            })}
          </nav>

          {/* EXIT STRATEGY */}
          <div className="p-6 border-t border-slate-800/30">
            <button 
              onClick={() => signOut()} 
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-800/40 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 transition-all active:scale-95"
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
               <span className="hover:text-slate-600 cursor-pointer transition-colors">Nexus Terminal</span> 
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
             
             <button className="p-3 text-slate-400 hover:text-blue-600 transition-colors relative">
                <Bell size={18} />
                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
             </button>
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