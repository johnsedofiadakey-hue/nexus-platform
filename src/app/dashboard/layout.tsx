"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
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
  ShieldAlert,
  MessageSquare,
  AlertCircle,
  ArrowRight
} from "lucide-react";

// ✅ IMPORT THE CALL SYSTEM
import AdminCallSystem from "@/components/admin/AdminCallSystem";

// --- 🔧 ENGINEERING SAFETY SWITCH ---
const EMERGENCY_BYPASS = true; 

// Professional Navigation Structure (Simplified English)
const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Building2, label: "Shops", path: "/dashboard/shops" },
  { icon: Users, label: "Team", path: "/dashboard/hr/enrollment" },
  { icon: Gavel, label: "Conduct", path: "/dashboard/hr/disciplinary" },
  { icon: Wallet, label: "Payroll", path: "/dashboard/hr/wages" },
  { icon: ShoppingBag, label: "Inventory", path: "/dashboard/inventory" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // --- 🔔 NOTIFICATION STATE ---
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    type: 'MESSAGE' | 'REQUEST' | 'CRITICAL';
    sender: string;
    location: string;
    message: string;
    actionUrl: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    setSidebarOpen(false);

    // 🔍 DIAGNOSTIC LOGGING
    if (session?.user) {
      console.log("--- NEXUS ACCESS DIAGNOSTIC ---");
      console.log("User:", session.user.name);
      console.log("Role:", (session.user as any).role);
      console.log("Status:", (session.user as any).status);
      console.log("Bypass Active:", EMERGENCY_BYPASS);
    }
  }, [session, pathname]);

  // --- 🧪 SIMULATION: MOCK INCOMING MESSAGE ---
  useEffect(() => {
    const triggerMockMessage = () => {
      if (!activeAlert) {
        setActiveAlert({
          id: "msg-001",
          type: "MESSAGE",
          sender: "Kojo Bonsu",
          location: "Melcom Accra Mall",
          message: "Urgent: Stock variance detected on 55\" OLED.",
          actionUrl: "/dashboard/messages/chat/user-123"
        });
        setTimeout(() => setActiveAlert(null), 8000);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') triggerMockMessage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlert]);

  if (!mounted) return null;

  // 🛡️ AUTHORITY AUDIT LOGIC
  const user = session?.user as any;
  const isSuspended = user?.status === "SUSPENDED" || user?.isSuspended === true;
  const isHQAdmin = user?.role === "ADMIN" || user?.role === "SUPER_USER";

  // The Gatekeeper (Lockdown Screen)
  if (!EMERGENCY_BYPASS && authStatus === "authenticated" && isSuspended && !isHQAdmin) {
    return (
      <div className="fixed inset-0 bg-red-600 z-[9999] flex flex-col items-center justify-center p-10 text-white animate-in fade-in duration-500">
        <div className="max-w-4xl w-full flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 border border-white/20">
            <ShieldAlert className="w-12 h-12 text-white animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Access Restricted</h1>
          <div className="h-1 w-20 bg-white/30 mb-6" />
          <p className="text-sm font-medium text-red-100 mb-8 uppercase tracking-widest">
            Your account privileges have been suspended.
          </p>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-8 py-3 bg-white text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all shadow-xl"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased"
      suppressHydrationWarning={true} 
    >
      
      {/* --- 🔔 NOTIFICATION POPUP (Clean Design) --- */}
      {activeAlert && (
        <div 
          onClick={() => {
            router.push(activeAlert.actionUrl);
            setActiveAlert(null);
          }}
          className="fixed top-6 right-1/2 translate-x-1/2 md:translate-x-0 md:right-8 z-[110] cursor-pointer animate-in slide-in-from-top-4 duration-500"
        >
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl shadow-slate-400/20 border border-slate-700 flex items-start gap-4 max-w-sm w-full backdrop-blur-xl group hover:scale-[1.01] transition-transform">
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                 {activeAlert.type === 'MESSAGE' ? <MessageSquare className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-slate-900"></span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-0.5">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                   {activeAlert.type === 'MESSAGE' ? 'New Message' : 'Alert'}
                 </p>
                 <span className="text-[10px] text-slate-400">Just now</span>
               </div>
               <h4 className="font-bold text-sm text-white truncate">{activeAlert.sender}</h4>
               <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mt-1">
                 {activeAlert.message}
               </p>
            </div>
            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity -ml-2">
               <ArrowRight className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR (Professional Dark Theme) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-[#0F172A] border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          
          {/* Brand Logo */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50 group-hover:bg-blue-500 transition-colors">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm text-white block tracking-tight">Nexus Platform</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Enterprise</span>
              </div>
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
            <p className="px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</p>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile (Bottom) */}
          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center font-bold text-blue-400 text-xs shadow-inner">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide truncate">
                    {session?.user?.role || "Staff"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700/50 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
               <span className="hidden md:inline font-medium">Dashboard</span>
               <ChevronRight className="w-4 h-4 text-slate-300" />
               <span className="font-bold text-slate-900">
                  {pathname === '/dashboard' ? 'Overview' : pathname.split('/').pop()?.replace(/^\w/, c => c.toUpperCase())}
               </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">System Online</span>
            </div>
            
            <button 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all relative"
              onClick={() => {
                // Test trigger for notifications
                window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'm'}));
              }}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar relative">
          {children}
          
          {/* ✅ CALL SYSTEM (FLOATING LAYER) */}
          <AdminCallSystem />
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}