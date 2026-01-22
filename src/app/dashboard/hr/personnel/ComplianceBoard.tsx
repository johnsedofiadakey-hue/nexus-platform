"use client";

import React, { useState } from "react";
import { Clock, AlertTriangle, FileText, CheckCircle, XCircle, Gavel, Plus, Lock, Unlock } from "lucide-react";

export default function ComplianceBoard({ attendance, leaveRequests, onUpdateLeave, onRecallLeave }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'ATTENDANCE' | 'LEAVE' | 'DISCIPLINARY'>('ATTENDANCE');

  // Check if currently on approved leave (System Locked)
  const activeLeave = leaveRequests.find((r: any) => {
    const now = new Date();
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    return r.status === 'APPROVED' && now >= start && now <= end;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px]">
       
       {/* ACTIVE LOCK ALERT */}
       {activeLeave && (
         <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-700">
               <Lock className="w-5 h-5" />
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest">System Access Locked</h4>
                  <p className="text-[10px] font-bold opacity-80">Agent is currently on leave until {new Date(activeLeave.endDate).toDateString()}</p>
               </div>
            </div>
            <button 
              onClick={() => onRecallLeave(activeLeave.id)}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
            >
               <Unlock className="w-3.5 h-3.5" /> Recall / Unlock
            </button>
         </div>
       )}

       {/* TAB HEADER */}
       <div className="flex border-b border-slate-100">
          {[
            { id: 'ATTENDANCE', icon: Clock, label: 'Attendance Log' },
            { id: 'LEAVE', icon: FileText, label: 'Leave Requests' },
            { id: 'DISCIPLINARY', icon: Gavel, label: 'Disciplinary' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 py-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === tab.id 
                ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
               <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
       </div>

       <div className="p-8">
          {/* ... (ATTENDANCE & DISCIPLINARY TABS REMAIN THE SAME) ... */}
          
          {/* 1. ATTENDANCE VIEW */}
          {activeSubTab === 'ATTENDANCE' && (
             <div className="space-y-4">
                {attendance.length === 0 ? (
                   <div className="text-center py-20 opacity-40">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-sm">No Attendance Records</p>
                   </div>
                ) : attendance.map((log: any) => (
                   <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 font-black text-slate-400 text-xs">
                            {new Date(log.date).getDate()}
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900">{new Date(log.date).toDateString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                               IN: {log.clockInTime ? new Date(log.clockInTime).toLocaleTimeString() : '--:--'} • 
                               OUT: {log.clockOutTime ? new Date(log.clockOutTime).toLocaleTimeString() : 'Active'}
                            </p>
                         </div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                         Verified
                      </div>
                   </div>
                ))}
             </div>
          )}

          {/* 2. LEAVE REQUESTS */}
          {activeSubTab === 'LEAVE' && (
             <div className="space-y-4">
                {leaveRequests.length === 0 ? (
                   <div className="text-center py-20 opacity-40">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-sm">No Active Requests</p>
                   </div>
                ) : leaveRequests.map((req: any) => (
                   <div key={req.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <span className="px-2 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest mb-2 inline-block">
                               {req.type}
                            </span>
                            <h4 className="text-sm font-bold text-slate-700">
                               {new Date(req.startDate).toDateString()} — {new Date(req.endDate).toDateString()}
                            </h4>
                         </div>
                         {req.status === 'PENDING' ? (
                            <div className="flex gap-2">
                               <button onClick={() => onUpdateLeave(req.id, 'APPROVED')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><CheckCircle className="w-4 h-4" /></button>
                               <button onClick={() => onUpdateLeave(req.id, 'REJECTED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><XCircle className="w-4 h-4" /></button>
                            </div>
                         ) : (
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                               {req.status}
                            </span>
                         )}
                      </div>
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                         "{req.reason}"
                      </p>
                   </div>
                ))}
             </div>
          )}

          {/* 3. DISCIPLINARY */}
          {activeSubTab === 'DISCIPLINARY' && (
             <div className="text-center">
                <div className="p-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 mb-6">
                   <Gavel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Clean Record</h3>
                   <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">No disciplinary actions or citations have been logged for this personnel.</p>
                </div>
                <button className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2 mx-auto">
                   <Plus className="w-4 h-4" /> Issue Citation
                </button>
             </div>
          )}
       </div>
    </div>
  );
}