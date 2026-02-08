"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Store, Users, Package, CreditCard, ShieldCheck, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", color: "text-blue-500" },
  { label: "Monitoring", icon: ShieldCheck, href: "/admin/monitoring", color: "text-emerald-500" },
  { label: "Inventory Hub", icon: Package, href: "/admin/inventory", color: "text-purple-500" },
  { label: "Staff Performance", icon: Users, href: "/admin/performance", color: "text-amber-500" },
  { label: "Expenses", icon: CreditCard, href: "/admin/expenses", color: "text-rose-500" },
  { label: "Shop Setup", icon: Store, href: "/admin/shops", color: "text-indigo-500" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white border-r border-slate-800">
      <div className="px-6 py-2 flex-1">
        <Link href="/admin/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4 bg-blue-600 rounded-lg flex items-center justify-center">
             <ShieldCheck className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter">NEXUS</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-bold cursor-pointer hover:text-white hover:bg-white/10 rounded-xl transition-all",
                pathname === route.href ? "bg-white/10 text-white" : "text-slate-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-6 mt-auto">
         <button className="flex items-center w-full p-3 text-slate-400 font-bold hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all">
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
         </button>
      </div>
    </div>
  )
}