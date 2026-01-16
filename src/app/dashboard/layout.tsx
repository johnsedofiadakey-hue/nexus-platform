"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Map as MapIcon, 
  ShoppingBag, 
  LogOut, 
  ShieldCheck, 
  Bell,
  Menu,
  X,
  Building2,
  Gavel,
  Wallet,
  Activity,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

// --- 🔧 ENGINEERING SAFETY SWITCH ---
// I have set this to TRUE to force you back into the system.
// Once you are in, check the Console to see what your "Status" actually is.
const EMERGENCY_BYPASS = true; 

// LG Ghana Strategic Navigation Structure
const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Building2, label: "Retail Hubs", path: "/dashboard/shops" },
  { icon: Users, label: "Personnel Grid", path: "/dashboard/hr/enrollment" },
  { icon: Gavel, label: "Conduct & Gavel", path: "/dashboard/hr/disciplinary" },
  { icon: Wallet, label: "Wage Settlement", path: "/dashboard/hr/wages" },
  { icon: ShoppingBag, label: "Inventory", path: "/dashboard/inventory" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSidebarOpen(false);

    // 🔍 DIAGNOSTIC LOGGING
    // Check your browser console to see what the system thinks you are.
    if (session?.user) {
      console.log("--- NEXUS ACCESS DIAGNOSTIC ---");
      console.log("User:", session.user.name);
      console.log("Role:", (session.user as any).role);
      console.log("Status:", (session.user as any).status);
      console.log("Is Suspended:", (session.user as any).isSuspended);
      console.log("Bypass Active:", EMERGENCY_BYPASS);
    }
  }, [session, pathname]);

  if (!mounted) return null;

  // 🛡️ AUTHORITY AUDIT LOGIC
  const user = session?.user as any;
  const isSuspended = user?.status === "SUSPENDED" || user?.isSuspended === true;
  const isHQAdmin = user?.role === "ADMIN" || user?.role === "SUPER_USER";

  // The Gatekeeper
  // Now respects the EMERGENCY_BYPASS switch to let you in.
  if (!EMERGENCY_BYPASS && authStatus === "authenticated" && isSuspended && !isHQAdmin) {
    return (
      <div className="fixed inset-0 bg-red-600 z-[9999] flex flex-col items-center justify-center p-10 text-white animate-in fade-in duration-500">
        <div className="max-w-4xl w-full flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 border border-white/20">
            <ShieldAlert className="w-12 h-12 text-white animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            Nexus System <br/> Override Active
          </h1>
          <div className="h-1 w-32 bg-white/30 mb-8" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-200 mb-12">
            Terminal Access Revoked • Strategic Lockdown Protocol
          </p>
          <div className="bg-white/10 p-4 rounded-lg mb-8 text-xs font-mono text-left">
            <p className="opacity-50 mb-2">DIAGNOSTIC TRACE:</p>
            <p>USER: {user?.name || 'Unknown'}</p>
            <p>ROLE: {user?.role || 'Undefined'}</p>
            <p>STATUS: {user?.status || 'Undefined'}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-8 py-4 bg-white text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition-all shadow-2xl"
            >
              Terminate & Reset Session
            </button>
            <Link 
              href="mailto:support@stormglide.com"
              className="px-8 py-4 bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-800 transition-all border border-red-500"
            >
              Contact Command HQ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 antialiased"
      suppressHydrationWarning={true} // Helps prevents extension conflicts
    >
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* PERSISTENT STRATEGIC SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-slate-900 border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-black text-xs uppercase tracking-[0.3em] text-white block">
                  Nexus <span className="text-blue-500">GHA</span>
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">LG Ghana Hub</span>
              </div>
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Strategic Console</p>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group ${
                    isActive 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-500/30" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center font-black text-blue-500 text-xs shadow-inner uppercase">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">
                    {session?.user?.name || "Authenticating..."}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">
                    {session?.user?.role || "Field Operative"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-white transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex flex-col">
               <h2 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px] leading-none mb-1 flex items-center gap-2">
                 System Console <ChevronRight className="w-3 h-3 text-slate-300" /> <span className="text-blue-600">Terminal</span>
               </h2>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  {pathname.replace("/dashboard/", "").replace("/", " • ") || "Grid Overview"}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Node Active</span>
              </div>
            </div>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 relative group shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-600 rounded-full border-2 border-white group-hover:animate-ping" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#FBFBFE] custom-scrollbar">
          {children}
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}