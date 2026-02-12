"use client";

import React from "react";
import { ShieldOff, Calendar, PhoneCall, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function LeaveLockout({ returnDate }: { returnDate: string }) {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-8 border border-blue-500/30">
                <ShieldOff className="w-10 h-10 text-blue-500" />
            </div>

            <h1 className="text-2xl font-black tracking-tighter uppercase mb-2">System Locked</h1>
            <p className="text-slate-400 text-sm uppercase font-bold tracking-widest mb-10 leading-relaxed">
                Your access to the Nexus Grid has been temporarily suspended due to approved leave.
            </p>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Return Date</span>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-black tabular-nums">{returnDate}</span>
                    </div>
                </div>
                <div className="text-left">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2">Instructions</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                        Please contact your LG Regional Supervisor if you are returning to your node earlier than expected.
                    </p>
                </div>
            </div>

            <div className="w-full space-y-4">
                <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                    <PhoneCall className="w-4 h-4" /> Contact Supervisor
                </button>
                <button
                    onClick={() => signOut()}
                    className="w-full py-4 bg-white/5 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-white/10"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </div>
    );
}
