"use client";

import React from 'react';
import { 
  MoreHorizontal, MapPin, Smartphone, 
  ChevronRight, Signal, SignalLow, 
  UserCircle, Building2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TeamTable({ members }: { members: any[] }) {
  const router = useRouter();

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Operative</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Deployment</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Network Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Zone Intel</th>
            <th className="px-6 py-4 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((member) => (
            <tr 
              key={member.id} 
              onClick={() => router.push(`/dashboard/hr/member/${member.id}`)}
              className="group hover:bg-slate-50/80 transition-all cursor-pointer"
            >
              {/* OPERATIVE COLUMN */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {member.image ? (
                      <img src={member.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        {member.name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter truncate">{member.role?.replace('_', ' ')}</p>
                  </div>
                </div>
              </td>

              {/* DEPLOYMENT COLUMN */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-300" />
                  <span className="text-xs font-semibold text-slate-600 truncate">{member.shop}</span>
                </div>
              </td>

              {/* STATUS COLUMN */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-700">{member.status}</span>
                </div>
              </td>

              {/* ZONE INTEL COLUMN */}
              <td className="px-6 py-4 text-right">
                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest ${
                  member.isInsideZone 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {member.isInsideZone ? <Signal size={12} /> : <SignalLow size={12} />}
                  {member.isInsideZone ? 'In Zone' : 'Breach'}
                </div>
              </td>

              {/* ACTION COLUMN */}
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight size={18} className="text-slate-300" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {members.length === 0 && (
        <div className="py-20 text-center">
          <UserCircle className="w-10 h-10 text-slate-200 mx-auto mb-4" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No operatives found in registry</p>
        </div>
      )}
    </div>
  );
}