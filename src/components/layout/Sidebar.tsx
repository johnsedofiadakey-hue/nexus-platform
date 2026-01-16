"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Building2, Users, Gavel, 
  Wallet, MessageSquare, Settings, LogOut, ShieldCheck 
} from "lucide-react";

const navItems = [
  { name: "Terminal Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Retail Hubs", href: "/dashboard/shops", icon: Building2 },
  { name: "Personnel Grid", href: "/dashboard/hr/enrollment", icon: Users },
  { name: "Conduct & Gavel", href: "/dashboard/hr/disciplinary", icon: Gavel },
  { name: "Wage Settlement", href: "/dashboard/hr/wages", icon: Wallet },
  { name: "Global Comms", href: "/dashboard/messages", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 flex flex-col border-r border-white/5">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-black uppercase tracking-[0.2em] text-xs">Nexus LG</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5 space-y-2">
        <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}