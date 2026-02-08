"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard, Users, ShoppingBag,
    Settings, Building2, Plus, Search,
    FileText, ShieldCheck
} from "lucide-react";

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in duration-200">
            <Command className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center px-4 border-b border-slate-100">
                    <Search className="w-5 h-5 text-slate-400 mr-2" />
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="w-full h-16 outline-none text-lg font-medium text-slate-900 placeholder:text-slate-400"
                    />
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2">
                    <Command.Empty className="py-6 text-center text-slate-500 text-sm font-medium">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                        <Item icon={LayoutDashboard} onSelect={() => runCommand(() => router.push("/dashboard"))}>Overview</Item>
                        <Item icon={Building2} onSelect={() => runCommand(() => router.push("/dashboard/shops"))}>Shops</Item>
                        <Item icon={Users} onSelect={() => runCommand(() => router.push("/dashboard/hr"))}>Team</Item>
                        <Item icon={ShoppingBag} onSelect={() => runCommand(() => router.push("/dashboard/inventory"))}>Inventory</Item>
                        <Item icon={Settings} onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>Settings</Item>
                    </Command.Group>

                    <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-black text-slate-400 uppercase tracking-widest mb-1 mt-2">
                        <Item icon={Plus} onSelect={() => runCommand(() => router.push("/dashboard/shops?new=true"))}>Add New Shop</Item>
                        <Item icon={Plus} onSelect={() => runCommand(() => router.push("/dashboard/hr?new=true"))}>Add Staff Member</Item>
                        <Item icon={FileText} onSelect={() => runCommand(() => router.push("/dashboard/sales"))}>View Sales Register</Item>
                        <Item icon={ShieldCheck} onSelect={() => runCommand(() => router.push("/dashboard/settings/audit"))}>View Audit Logs</Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
}

function Item({ children, icon: Icon, onSelect }: { children: React.ReactNode, icon: any, onSelect: () => void }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors aria-selected:bg-slate-100 aria-selected:text-slate-900"
        >
            <Icon className="w-4 h-4 text-slate-400" />
            {children}
        </Command.Item>
    );
}
