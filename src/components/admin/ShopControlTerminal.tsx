// path: /src/components/admin/ShopControlTerminal.tsx
"use client";

import { MessageSquare, Users, MapPin, Package, ShieldCheck } from "lucide-react";

export default function ShopControlTerminal({ shop }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* SHOP IDENTITY HEADER */}
      <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest">{shop.name}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{shop.location}</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-blue-600 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest">
            {shop.inventoryCount} SKUs
          </span>
          <span className="bg-emerald-500 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest">
            {shop.activeReps} Reps On-Site
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 divide-x divide-slate-100 h-[500px]">
        {/* SECTION 1: PERSONNEL MANAGEMENT */}
        <div className="col-span-5 p-6 space-y-4 overflow-y-auto">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between">
            Assigned Personnel <Users className="w-3 h-3" />
          </h3>
          {shop.users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${user.isPresent ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <div>
                  <p className="text-[11px] font-bold text-slate-900">{user.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{user.role}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          ))}
        </div>

        {/* SECTION 2: LIVE STRATEGIC CHAT */}
        <div className="col-span-7 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 underline decoration-blue-500 underline-offset-4">Secure Hub Comms</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Example Admin-Rep Chat Flow */}
            <div className="flex flex-col items-end">
              <div className="bg-slate-900 text-white p-3 rounded-2xl rounded-tr-none text-[11px] max-w-[80%] font-medium">
                "Kojo, we are seeing low stock on OLED 65" C3. Please verify physical inventory."
              </div>
              <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Sent to: Kojo Bonsu • 09:45</span>
            </div>
            <div className="flex flex-col items-start">
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-[11px] max-w-[80%] font-medium text-slate-800">
                "Verified. We have only 2 units left on the floor. 1 box in back-room damaged."
              </div>
              <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">From: Kojo Bonsu • 09:48</span>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              placeholder="Send instruction to shop staff..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-medium outline-none focus:border-blue-500"
            />
            <button className="bg-slate-900 text-white p-2 rounded-xl">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper ArrowRight Icon
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}