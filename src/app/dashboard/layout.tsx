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
  ChevronRight
} from "lucide-react";

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
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevention of Hydration Mismatch for Next.js 16
  useEffect(() => {
    setMounted(true);
    // Close sidebar on route change for mobile to prevent being "stuck"
    setSidebarOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 antialiased">
      
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
          
          {/* Brand Identity Section */}
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

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Strategic Console</p>
            {navItems.map((item) => {
              // High-level path matching to keep navigation active even in sub-pages
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

          {/* Personnel Control Section (Bottom) */}
          <div className="p-4 border-t border-white/5">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center font-black text-blue-500 text-xs shadow-inner">
                  {session?.user?.name?.charAt(0) || "C"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">
                    {session?.user?.name || "Commander"}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">
                    {session?.user?.role || "HQ Administrator"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white transition-all"
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
        
        {/* Top Intelligence Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
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

            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all relative group shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-600 rounded-full border-2 border-white group-hover:animate-ping" />
            </button>
          </div>
        </header>

        {/* Page Content Area with Scroll Management */}
        <main className="flex-1 overflow-y-auto bg-[#FBFBFE]">
          {children}
        </main>
      </div>
    </div>
  );
}